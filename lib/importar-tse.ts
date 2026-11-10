import { supabase } from "./supabase";
import { slugPartido } from "./partidos-oficial";

/**
 * Candidaturas das eleições gerais (TSE, dados abertos "consulta_cand"), lidas em fluxo.
 * Cargos federais e estaduais majoritários: Presidente, Vice-presidente, Governador, Senador e Deputado federal.
 */
export const FONTE_CAND = (ano: number) => `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_${ano}.zip`;
const CARGOS_GERAIS = new Set(["PRESIDENTE", "VICE-PRESIDENTE", "GOVERNADOR", "SENADOR", "DEPUTADO FEDERAL", "DEPUTADO ESTADUAL", "DEPUTADO DISTRITAL"]);
const CARGOS_MUNICIPAIS = new Set(["PREFEITO", "VICE-PREFEITO", "VEREADOR"]);
export const FONTE_VOTOS = (ano: number) => `https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_${ano}.zip`;
const UA = { "User-Agent": "BoletimPolitico/1.0 (+https://boletim-politico.vercel.app)" };
const limpar = (v?: string) => (!v || /^#NUL|^#NE#|^-1$/.test(v) ? "" : v.trim());

type Cand = { sq: string; ano: number; cargo: string; uf: string; municipio: string; nome: string; nome_urna: string; numero: string; sigla: string; slug: string; situacao: string; situacao_candidatura: string; turno: number; foto: string };

export async function lerCandidaturas(ano: number) {
  const municipal = ano % 4 === 0;
  const CARGOS = municipal ? CARGOS_MUNICIPAIS : CARGOS_GERAIS;
  const { Unzip, UnzipInflate } = await import("fflate");
  const r = await fetch(FONTE_CAND(ano), { headers: UA, cache: "no-store" });
  if (!r.ok || !r.body) throw new Error(`TSE respondeu ${r.status}`);
  const mapa = new Map<string, Cand>();
  const diag = { arquivos: [] as string[], colunas: [] as string[], linhas: 0 };
  const unzip = new Unzip();
  unzip.register(UnzipInflate);
  unzip.onfile = (arq) => {
    if (!arq.name.toLowerCase().endsWith(".csv")) return;
    diag.arquivos.push(arq.name);
    const dec = new TextDecoder("latin1");
    let resto = "";
    let ix: Record<string, number> | null = null;
    const linha = (l: string) => {
      if (!l) return;
      const c = l.split(";").map((x) => x.replace(/^"|"$/g, ""));
      if (!ix) {
        const cab = c.map((x) => x.toUpperCase().trim());
        if (!diag.colunas.length) diag.colunas = cab;
        const i = (...n: string[]) => cab.findIndex((x) => n.includes(x));
        ix = { cargo: i("DS_CARGO"), uf: i("SG_UF"), ue: i("NM_UE"), sq: i("SQ_CANDIDATO"), num: i("NR_CANDIDATO"), nome: i("NM_CANDIDATO"), urna: i("NM_URNA_CANDIDATO"),
          sigla: i("SG_PARTIDO"), sit: i("DS_SIT_TOT_TURNO"), sitc: i("DS_SITUACAO_CANDIDATURA", "DS_SIT_CANDIDATURA", "DS_DETALHE_SITUACAO_CAND"), turno: i("NR_TURNO") };
        return;
      }
      diag.linhas++;
      const cargo = (c[ix.cargo] ?? "").toUpperCase().trim();
      if (!CARGOS.has(cargo)) return;
      const sq = c[ix.sq];
      if (!sq) return;
      const turno = Number(c[ix.turno] ?? 1) || 1;
      const ant = mapa.get(sq);
      if (ant && ant.turno >= turno) return; // fica o resultado do turno mais recente
      const sigla = limpar(c[ix.sigla]);
      const situacao = limpar(c[ix.sit]);
      // Municipais: só quem foi eleito (mandato atual).
      if (municipal && !/^ELEIT/i.test(situacao)) { if (ant) mapa.delete(sq); return; }
      mapa.set(sq, {
        sq, ano, cargo, uf: limpar(c[ix.uf]), municipio: municipal ? limpar(c[ix.ue]) : "", nome: limpar(c[ix.nome]), nome_urna: limpar(c[ix.urna]), numero: limpar(c[ix.num]),
        sigla, slug: sigla ? slugPartido(sigla) : "", situacao, situacao_candidatura: limpar(c[ix.sitc]), turno, foto: "",
      });
    };
    arq.ondata = (err, dados, fim) => {
      if (err) throw err;
      resto += dec.decode(dados, { stream: !fim });
      const ls = resto.split(/\r?\n/);
      resto = fim ? "" : ls.pop() ?? "";
      for (const l of ls) linha(l);
    };
    arq.start();
  };
  const leitor = r.body.getReader();
  for (;;) {
    const { value, done } = await leitor.read();
    if (done) { unzip.push(new Uint8Array(0), true); break; }
    unzip.push(value);
  }
  return { candidaturas: [...mapa.values()], diag };
}

export async function gravarCandidaturas(lista: Cand[]) {
  let n = 0;
  for (let i = 0; i < lista.length; i += 500) {
    const { data, error } = await supabase.rpc("importar_candidaturas", { p_segredo: process.env.CRON_SECRET, p_lista: lista.slice(i, i + 500) });
    if (error) throw new Error(error.message);
    n += data as number;
  }
  return n;
}


/** Votos nominais por candidatura (soma das zonas), lidos em fluxo do arquivo oficial de votação. */
/** `ufs` limita a leitura a alguns estados (o arquivo é grande demais para uma só execução). */
export async function lerVotos(ano: number, ufs?: string[]) {
  const { Unzip, UnzipInflate } = await import("fflate");
  const r = await fetch(FONTE_VOTOS(ano), { headers: UA, cache: "no-store" });
  if (!r.ok || !r.body) throw new Error(`TSE (votação) respondeu ${r.status}`);
  const porTurno = new Map<string, number>(); // "sq|turno" -> votos
  const vistos = new Set<string>();
  const unzip = new Unzip();
  unzip.register(UnzipInflate);
  unzip.onfile = (arq) => {
    const nome = arq.name.toLowerCase();
    if (!nome.endsWith(".csv")) return;
    // Há um arquivo por UF e, em alguns anos, um consolidado BRASIL: usamos só um dos dois.
    if (ufs) { const m = nome.match(/_([a-z]{2})\.csv$/); if (!m || !ufs.includes(m[1].toUpperCase())) return; }
    else if (/brasil/i.test(nome)) { if (vistos.size) return; vistos.add("BRASIL"); } else if (vistos.has("BRASIL")) return; else vistos.add(nome);
    const dec = new TextDecoder("latin1");
    let resto = "";
    let ix: { sq: number; turno: number; votos: number; cargo: number } | null = null;
    const linha = (l: string) => {
      if (!l) return;
      const c = l.split(";");
      if (!ix) {
        const cab = c.map((x) => x.replace(/^"|"$/g, "").toUpperCase().trim());
        ix = { sq: cab.indexOf("SQ_CANDIDATO"), turno: cab.indexOf("NR_TURNO"), votos: cab.findIndex((x) => x === "QT_VOTOS_NOMINAIS" || x === "QT_VOTOS_NOMINAIS_VALIDOS"), cargo: cab.indexOf("CD_CARGO") };
        return;
      }
      // Presidente e vice somam votos de todos os estados: ficam de fora da leitura parcial.
      if (ufs && ix.cargo >= 0 && /^"?[12]"?$/.test(c[ix.cargo] ?? "")) return;
      const sq = (c[ix.sq] ?? "").replace(/"/g, "");
      const v = Number((c[ix.votos] ?? "0").replace(/"/g, "")) || 0;
      const k = `${sq}|${(c[ix.turno] ?? "1").replace(/"/g, "")}`;
      porTurno.set(k, (porTurno.get(k) ?? 0) + v);
    };
    arq.ondata = (err, dados, fim) => {
      if (err) throw err;
      resto += dec.decode(dados, { stream: !fim });
      const ls = resto.split(/\r?\n/);
      resto = fim ? "" : ls.pop() ?? "";
      for (const l of ls) linha(l);
    };
    arq.start();
  };
  const leitor = r.body.getReader();
  for (;;) {
    const { value, done } = await leitor.read();
    if (done) { unzip.push(new Uint8Array(0), true); break; }
    unzip.push(value);
  }
  const porSq = new Map<string, number>();
  for (const [k, v] of porTurno) { const sq = k.split("|")[0]; porSq.set(sq, Math.max(porSq.get(sq) ?? 0, v)); }
  return [...porSq.entries()].map(([sq, v]) => ({ sq, v }));
}

export async function gravarVotos(ano: number, lista: { sq: string; v: number }[]) {
  let n = 0;
  for (let i = 0; i < lista.length; i += 3000) {
    const { data, error } = await supabase.rpc("importar_votos", { p_segredo: process.env.CRON_SECRET, p_ano: ano, p_lista: lista.slice(i, i + 3000) });
    if (error) throw new Error(error.message);
    n += data as number;
  }
  return n;
}
