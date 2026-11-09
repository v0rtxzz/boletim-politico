/**
 * Coleta de dados oficiais dos partidos:
 * - Registro: lista de partidos registrados no TSE.
 * - Bancadas: APIs de Dados Abertos da Câmara dos Deputados e do Senado Federal.
 * Nada é estimado: se uma fonte falha, o resultado dela é nulo e o banco mantém o último valor (com a data antiga).
 */

export const FONTE_TSE = "https://cdn.tse.jus.br/estatistica/sead/odsele/orgao_partidario/orgao_partidario.zip";
export const PAGINA_TSE = "https://dadosabertos.tse.jus.br/dataset/delegados-partidarios";
export const FONTE_CAMARA = "https://dadosabertos.camara.leg.br/api/v2/deputados";
export const FONTE_SENADO = "https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json";

const UA = { "User-Agent": "BoletimPolitico/1.0 (+https://boletim-politico.vercel.app)" };

/** Chave estável para casar siglas escritas de formas diferentes (TSE × Câmara × Senado). */
export function slugPartido(sigla: string) {
  const s = sigla.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases: Record<string, string> = { podemos: "pode", uniaobrasil: "uniao", pcbdob: "pcdob", solidariedad: "solidariedade" };
  return aliases[s] ?? s;
}

export type RegistroPartido = { slug: string; sigla: string; nome: string; numero: string; deferimento: string };

const campos = (linha: string) => linha.split(";").map((c) => c.replace(/^"|"$/g, "").trim());

/**
 * Partidos com diretório NACIONAL vigente no cadastro de órgãos partidários do TSE (dados abertos).
 * Todo partido registrado no TSE mantém órgão de direção nacional. O arquivo é grande (todos os
 * diretórios do país), então é lido em fluxo: descompacta aos poucos e guarda só as linhas nacionais.
 */
export async function buscarRegistroTSE() {
  const { Unzip, UnzipInflate } = await import("fflate");
  const r = await fetch(FONTE_TSE, { headers: UA, cache: "no-store" });
  if (!r.ok || !r.body) throw new Error(`TSE (dados abertos) respondeu ${r.status}`);

  const hoje = new Date().toISOString().slice(0, 10);
  const dataISO = (d: string) => { const m = d.match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };
  const mapa = new Map<string, RegistroPartido>();
  const diag = { arquivos: [] as string[], colunas: [] as string[], linhas: 0, nacionais: 0, amostraNacional: [] as string[][], situacoes: {} as Record<string, number>, descartados: [] as string[] };

  const unzip = new Unzip();
  unzip.register(UnzipInflate);
  unzip.onfile = (arquivo) => {
    if (!arquivo.name.toLowerCase().endsWith(".csv")) return;
    diag.arquivos.push(arquivo.name);
    const dec = new TextDecoder("latin1");
    let resto = "";
    let idx: Record<string, number> | null = null;
    const processar = (linha: string) => {
      if (!linha) return;
      const c = campos(linha);
      if (!idx) {
        const cab = c.map((x) => x.toUpperCase());
        if (!diag.colunas.length) diag.colunas = cab;
        const i = (re: RegExp) => cab.findIndex((x) => re.test(x));
        idx = { sigla: i(/^SG_PARTIDO$/), nome: i(/^NM_PARTIDO$/), num: i(/^NR_PARTIDO$/), uf: i(/^SG_UF$/),
          abr: i(/^DS_TIPO_ABRANGENCIA$/), sit: i(/^DS_SITU_EXERC_ORGAO_PARTIDARIO$/), fim: i(/^DT_FIM_VIGENCIA_ORGAO$/) };
        return;
      }
      diag.linhas++;
      const abr = idx.abr >= 0 ? (c[idx.abr] ?? "").toUpperCase() : "";
      const nacional = abr.includes("NACIONAL") || (idx.abr < 0 && (c[idx.uf] ?? "") === "BR");
      if (!nacional) return;
      diag.nacionais++;
      const sit = idx.sit >= 0 ? c[idx.sit] ?? "" : "";
      diag.situacoes[sit] = (diag.situacoes[sit] ?? 0) + 1;
      if (diag.amostraNacional.length < 3) diag.amostraNacional.push([c[idx.sigla], c[idx.abr], c[idx.fim], sit]);
      const fimVig = idx.fim >= 0 ? dataISO(c[idx.fim] ?? "") : "";
      if ((sit && /INATIV|ANULAD|CANCEL|EXTINT|SUSPENS|ENCERRAD|BAIXAD/i.test(sit)) || (fimVig && fimVig < hoje)) {
        if (!diag.descartados.includes(c[idx.sigla])) diag.descartados.push(c[idx.sigla]);
        return;
      }
      const sigla = c[idx.sigla], nome = c[idx.nome];
      if (!sigla || !nome) return;
      const slug = slugPartido(sigla);
      if (!mapa.has(slug)) mapa.set(slug, { slug, sigla, nome, numero: idx.num >= 0 ? c[idx.num] : "", deferimento: "" });
    };
    arquivo.ondata = (err, dados, fim) => {
      if (err) throw err;
      resto += dec.decode(dados, { stream: !fim });
      const linhas = resto.split(/\r?\n/);
      resto = fim ? "" : linhas.pop() ?? "";
      for (const l of linhas) processar(l);
    };
    arquivo.start();
  };

  const leitor = r.body.getReader();
  for (;;) {
    const { value, done } = await leitor.read();
    if (done) { unzip.push(new Uint8Array(0), true); break; }
    unzip.push(value);
  }
  if (!diag.colunas.includes("SG_PARTIDO")) throw new Error(`CSV do TSE sem colunas esperadas: ${diag.colunas.slice(0, 30).join(",")}`);
  return { partidos: [...mapa.values()], diagnostico: diag };
}

/** Deputados em exercício, contados por partido (segue a paginação da API). */
export async function buscarBancadaCamara() {
  const contagem: Record<string, number> = {};
  const nomes: { nome: string; sigla: string }[] = [];
  const politicos: Parlamentar[] = [];
  let url: string | null = `${FONTE_CAMARA}?itens=100&pagina=1&ordem=ASC&ordenarPor=nome`;
  for (let guarda = 0; url && guarda < 20; guarda++) {
    const r: Response = await fetch(url, { headers: { ...UA, Accept: "application/json" }, cache: "no-store" });
    if (!r.ok) throw new Error(`Câmara respondeu ${r.status}`);
    const j = (await r.json()) as { dados: { id: number; nome: string; siglaPartido: string; siglaUf: string; urlFoto: string }[]; links?: { rel: string; href: string }[] };
    for (const d of j.dados) {
      const s = slugPartido(d.siglaPartido);
      contagem[s] = (contagem[s] ?? 0) + 1;
      nomes.push({ nome: d.nome, sigla: d.siglaPartido });
      politicos.push({
        id: `dep-${d.id}`, id_oficial: d.id, nome: d.nome, partido_sigla: d.siglaPartido, partido_slug: s, uf: d.siglaUf,
        foto_url: (d.urlFoto ?? "").replace(/^http:/, "https:"),
        pagina_url: `https://www.camara.leg.br/deputados/${d.id}`,
      });
    }
    url = j.links?.find((l) => l.rel === "next")?.href ?? null;
  }
  const total = Object.values(contagem).reduce((a, b) => a + b, 0);
  if (total < 400) throw new Error(`Câmara: só ${total} deputados lidos`);
  return { bancadas: contagem, total, nomes, politicos };
}

export type Parlamentar = { id: string; id_oficial: number; nome: string; partido_sigla: string; partido_slug: string; uf: string; foto_url: string; pagina_url: string };
type Parl = { IdentificacaoParlamentar: { CodigoParlamentar: string; NomeParlamentar: string; SiglaPartidoParlamentar: string; UfParlamentar: string; UrlFotoParlamentar?: string; UrlPaginaParlamentar?: string } };
/** Senadores em exercício, contados por partido. */
export async function buscarBancadaSenado() {
  const r = await fetch(FONTE_SENADO, { headers: { ...UA, Accept: "application/json" }, cache: "no-store" });
  if (!r.ok) throw new Error(`Senado respondeu ${r.status}`);
  const j = await r.json();
  const lista = j?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar as Parl[] | Parl | undefined;
  const arr = Array.isArray(lista) ? lista : lista ? [lista] : [];
  const contagem: Record<string, number> = {};
  const nomes: { nome: string; sigla: string }[] = [];
  const politicos: Parlamentar[] = [];
  for (const p of arr) {
    const i = p.IdentificacaoParlamentar;
    const s = slugPartido(i.SiglaPartidoParlamentar);
    contagem[s] = (contagem[s] ?? 0) + 1;
    nomes.push({ nome: i.NomeParlamentar, sigla: i.SiglaPartidoParlamentar });
    politicos.push({
      id: `sen-${i.CodigoParlamentar}`, id_oficial: Number(i.CodigoParlamentar), nome: i.NomeParlamentar,
      partido_sigla: i.SiglaPartidoParlamentar, partido_slug: s, uf: i.UfParlamentar,
      foto_url: (i.UrlFotoParlamentar ?? "").replace(/^http:/, "https:"),
      pagina_url: (i.UrlPaginaParlamentar ?? `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${i.CodigoParlamentar}`).replace(/^http:/, "https:"),
    });
  }
  if (arr.length < 70) throw new Error(`Senado: só ${arr.length} senadores lidos`);
  return { bancadas: contagem, total: arr.length, nomes, politicos };
}
