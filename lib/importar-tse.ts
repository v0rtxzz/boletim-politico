import { supabase } from "./supabase";
import { slugPartido } from "./partidos-oficial";

/**
 * Candidaturas das eleições gerais (TSE, dados abertos "consulta_cand"), lidas em fluxo.
 * Cargos federais e estaduais majoritários: Presidente, Vice-presidente, Governador, Senador e Deputado federal.
 */
export const FONTE_CAND = (ano: number) => `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_${ano}.zip`;
const CARGOS = new Set(["PRESIDENTE", "VICE-PRESIDENTE", "GOVERNADOR", "SENADOR", "DEPUTADO FEDERAL"]);
const UA = { "User-Agent": "BoletimPolitico/1.0 (+https://boletim-politico.vercel.app)" };
const limpar = (v?: string) => (!v || /^#NUL|^#NE#|^-1$/.test(v) ? "" : v.trim());

type Cand = { sq: string; ano: number; cargo: string; uf: string; nome: string; nome_urna: string; numero: string; sigla: string; slug: string; situacao: string; situacao_candidatura: string; turno: number; foto: string };

export async function lerCandidaturas(ano: number) {
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
        ix = { cargo: i("DS_CARGO"), uf: i("SG_UF"), sq: i("SQ_CANDIDATO"), num: i("NR_CANDIDATO"), nome: i("NM_CANDIDATO"), urna: i("NM_URNA_CANDIDATO"),
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
      mapa.set(sq, {
        sq, ano, cargo, uf: limpar(c[ix.uf]), nome: limpar(c[ix.nome]), nome_urna: limpar(c[ix.urna]), numero: limpar(c[ix.num]),
        sigla, slug: sigla ? slugPartido(sigla) : "", situacao: limpar(c[ix.sit]), situacao_candidatura: limpar(c[ix.sitc]), turno, foto: "",
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
