/**
 * Coleta de dados oficiais dos partidos:
 * - Registro: lista de partidos registrados no TSE.
 * - Bancadas: APIs de Dados Abertos da Câmara dos Deputados e do Senado Federal.
 * Nada é estimado: se uma fonte falha, o resultado dela é nulo e o banco mantém o último valor (com a data antiga).
 */

export const FONTE_TSE = "https://www.tse.jus.br/partidos/partidos-registrados-no-tse";
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

const limpar = (h: string) =>
  h.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/\s+/g, " ").trim();

/** Lê a tabela do TSE mapeando as colunas pelo cabeçalho (Sigla, Nome, Número, Deferimento). */
export function lerTabelaTSE(html: string): { partidos: RegistroPartido[]; diagnostico: unknown } {
  const linhas = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => m[0]);
  const celulas = (tr: string) => [...tr.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => limpar(m[1]));
  let col = { sigla: -1, nome: -1, numero: -1, deferimento: -1 };
  const partidos: RegistroPartido[] = [];
  for (const tr of linhas) {
    const c = celulas(tr);
    if (c.length < 3) continue;
    const baixo = c.map((x) => x.toLowerCase());
    if (baixo.some((x) => x === "sigla" || x.startsWith("sigla"))) {
      col = {
        sigla: baixo.findIndex((x) => x.startsWith("sigla")),
        nome: baixo.findIndex((x) => x.startsWith("nome") || x.includes("denomina")),
        numero: baixo.findIndex((x) => /^(n[º°o.]|número|numero)/.test(x)),
        deferimento: baixo.findIndex((x) => x.includes("deferimento") || x.includes("registro")),
      };
      continue;
    }
    if (col.sigla < 0 || col.nome < 0) continue;
    const sigla = c[col.sigla], nome = c[col.nome];
    if (!sigla || !nome || sigla.length > 20) continue;
    partidos.push({
      slug: slugPartido(sigla), sigla, nome,
      numero: col.numero >= 0 ? (c[col.numero].match(/\d{2}/)?.[0] ?? "") : "",
      deferimento: col.deferimento >= 0 ? c[col.deferimento] : "",
    });
  }
  const unicos = [...new Map(partidos.map((p) => [p.slug, p])).values()];
  return {
    partidos: unicos,
    diagnostico: { linhas: linhas.length, colunas: col, amostra: linhas.slice(0, 3).map(celulas) },
  };
}

export async function buscarRegistroTSE() {
  const r = await fetch(FONTE_TSE, { headers: UA, cache: "no-store" });
  if (!r.ok) throw new Error(`TSE respondeu ${r.status}`);
  return lerTabelaTSE(await r.text());
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
