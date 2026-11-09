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

/** Lê CSV do TSE (separador ";", campos entre aspas). */
function linhasCSV(texto: string): string[][] {
  return texto.split(/\r?\n/).filter(Boolean).map((l) => l.split(";").map((c) => c.replace(/^"|"$/g, "").trim()));
}

/**
 * Partidos com diretório NACIONAL vigente no cadastro de órgãos partidários do TSE (dados abertos).
 * Um partido só existe legalmente com registro no TSE, e todo partido registrado mantém órgão nacional.
 */
export async function buscarRegistroTSE() {
  const { unzipSync } = await import("fflate");
  const r = await fetch(FONTE_TSE, { headers: UA, cache: "no-store" });
  if (!r.ok) throw new Error(`TSE (dados abertos) respondeu ${r.status}`);
  const zip = unzipSync(new Uint8Array(await r.arrayBuffer()));
  const nomes = Object.keys(zip).filter((n) => n.toLowerCase().endsWith(".csv"));
  const preferido = nomes.find((n) => /_br\.csv$/i.test(n)) ?? nomes[0];
  if (!preferido) throw new Error("ZIP do TSE sem CSV");
  const linhas = linhasCSV(new TextDecoder("latin1").decode(zip[preferido]));
  const cab = linhas[0].map((c) => c.toUpperCase());
  const i = (re: RegExp) => cab.findIndex((c) => re.test(c));
  const iSigla = i(/^SG_PARTIDO$/), iNome = i(/^NM_PARTIDO$/), iNum = i(/^NR_PARTIDO$/);
  const iAbr = i(/ABRANGENCIA|TP_ORGAO|DS_TIPO_ORGAO|^SG_UF$/);
  const iSit = i(/SITUACAO|VIGENCIA_STATUS/);
  const iFim = i(/^DT_FIM_VIGENCIA|DT_FIM/);
  if (iSigla < 0 || iNome < 0) throw new Error(`CSV do TSE sem colunas esperadas: ${cab.slice(0, 30).join(",")}`);
  const hoje = new Date().toISOString().slice(0, 10);
  const dataBR = (d: string) => { const m = d.match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };
  const mapa = new Map<string, RegistroPartido>();
  let nacionais = 0;
  for (const c of linhas.slice(1)) {
    const abr = iAbr >= 0 ? (c[iAbr] ?? "").toUpperCase() : "BR";
    if (!(abr === "BR" || abr.includes("NACIONAL"))) continue;
    nacionais++;
    if (iSit >= 0 && /INATIV|ANULAD|CANCEL|EXTINT|SUSPENS/i.test(c[iSit] ?? "")) continue;
    if (iFim >= 0) { const f = dataBR(c[iFim] ?? ""); if (f && f < hoje) continue; }
    const sigla = c[iSigla], nome = c[iNome];
    if (!sigla || !nome) continue;
    const slug = slugPartido(sigla);
    if (!mapa.has(slug)) mapa.set(slug, { slug, sigla, nome, numero: iNum >= 0 ? c[iNum] : "", deferimento: "" });
  }
  return {
    partidos: [...mapa.values()],
    diagnostico: { arquivos: nomes.slice(0, 40), usado: preferido, colunas: cab, linhas: linhas.length - 1, nacionais, amostra: linhas.slice(1, 4) },
  };
}

/** Deputados em exercício, contados por partido (segue a paginação da API). */
export async function buscarBancadaCamara() {
  const contagem: Record<string, number> = {};
  const nomes: { nome: string; sigla: string }[] = [];
  let url: string | null = `${FONTE_CAMARA}?itens=100&pagina=1&ordem=ASC&ordenarPor=nome`;
  for (let guarda = 0; url && guarda < 20; guarda++) {
    const r: Response = await fetch(url, { headers: { ...UA, Accept: "application/json" }, cache: "no-store" });
    if (!r.ok) throw new Error(`Câmara respondeu ${r.status}`);
    const j = (await r.json()) as { dados: { nome: string; siglaPartido: string }[]; links?: { rel: string; href: string }[] };
    for (const d of j.dados) {
      const s = slugPartido(d.siglaPartido);
      contagem[s] = (contagem[s] ?? 0) + 1;
      nomes.push({ nome: d.nome, sigla: d.siglaPartido });
    }
    url = j.links?.find((l) => l.rel === "next")?.href ?? null;
  }
  const total = Object.values(contagem).reduce((a, b) => a + b, 0);
  if (total < 400) throw new Error(`Câmara: só ${total} deputados lidos`);
  return { bancadas: contagem, total, nomes };
}

type Parl = { IdentificacaoParlamentar: { NomeParlamentar: string; SiglaPartidoParlamentar: string } };
/** Senadores em exercício, contados por partido. */
export async function buscarBancadaSenado() {
  const r = await fetch(FONTE_SENADO, { headers: { ...UA, Accept: "application/json" }, cache: "no-store" });
  if (!r.ok) throw new Error(`Senado respondeu ${r.status}`);
  const j = await r.json();
  const lista = j?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar as Parl[] | Parl | undefined;
  const arr = Array.isArray(lista) ? lista : lista ? [lista] : [];
  const contagem: Record<string, number> = {};
  const nomes: { nome: string; sigla: string }[] = [];
  for (const p of arr) {
    const s = slugPartido(p.IdentificacaoParlamentar.SiglaPartidoParlamentar);
    contagem[s] = (contagem[s] ?? 0) + 1;
    nomes.push({ nome: p.IdentificacaoParlamentar.NomeParlamentar, sigla: p.IdentificacaoParlamentar.SiglaPartidoParlamentar });
  }
  if (arr.length < 70) throw new Error(`Senado: só ${arr.length} senadores lidos`);
  return { bancadas: contagem, total: arr.length, nomes };
}
