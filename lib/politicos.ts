import { supabase } from "./supabase";
import { semAcento } from "./texto";

export type Politico = {
  id: string; casa: "camara" | "senado"; id_oficial: number; nome: string;
  partido_sigla: string | null; partido_slug: string | null; uf: string | null;
  foto_url: string | null; pagina_url: string | null; em_exercicio: boolean; fonte: string; atualizado_em: string;
};

export const CARGO: Record<Politico["casa"], string> = { camara: "Deputado(a) federal", senado: "Senador(a)" };

export async function listarPoliticos(): Promise<Politico[]> {
  const { data, error } = await supabase.from("politicos").select("*").eq("em_exercicio", true).order("nome");
  if (error) throw error;
  return (data ?? []) as Politico[];
}

export async function politicosDoPartido(slug: string): Promise<Politico[]> {
  const { data, error } = await supabase.from("politicos").select("*").eq("partido_slug", slug).eq("em_exercicio", true).order("nome");
  if (error) throw error;
  return (data ?? []) as Politico[];
}

export async function getPolitico(id: string): Promise<Politico | null> {
  const { data, error } = await supabase.from("politicos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Politico | null;
}

/* ---------------- Histórico oficial (consultado nas APIs, com cache de 1 dia) ---------------- */

export type Dados = {
  nomeCivil?: string; nascimento?: string; naturalidade?: string; escolaridade?: string;
  filiacoes: { partido: string; inicio?: string; fim?: string }[];
  mandatos: { descricao: string; inicio?: string; fim?: string }[];
  fonte: string; erro?: string;
};

const UA = { "User-Agent": "BoletimPolitico/1.0 (+https://boletim-politico.vercel.app)", Accept: "application/json" };
const pegar = async (url: string) => {
  const r = await fetch(url, { headers: UA, next: { revalidate: 86400 } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};
const lista = <T,>(x: T | T[] | undefined | null): T[] => (Array.isArray(x) ? x : x ? [x] : []);
const dataBR = (iso?: string) => {
  if (!iso) return undefined;
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};

async function dadosCamara(id: number): Promise<Dados> {
  const fonte = `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}`;
  const [det, hist] = await Promise.all([pegar(fonte), pegar(`${fonte}/historico?itens=100`)]);
  const d = det?.dados ?? {};
  // O histórico registra cada mudança de situação; reduzimos a trocas de partido e a legislaturas.
  type H = { dataHora: string; siglaPartido: string; idLegislatura: number; situacao?: string; descricaoStatus?: string };
  const h = ((hist?.dados ?? []) as H[]).sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  const filiacoes: Dados["filiacoes"] = [];
  for (const x of h) {
    const ult = filiacoes[filiacoes.length - 1];
    if (!ult || ult.partido !== x.siglaPartido) {
      if (ult) ult.fim = dataBR(x.dataHora);
      filiacoes.push({ partido: x.siglaPartido, inicio: dataBR(x.dataHora) });
    }
  }
  const legs = [...new Set(h.map((x) => x.idLegislatura))];
  const mandatos = legs.map((l) => {
    const itens = h.filter((x) => x.idLegislatura === l);
    return { descricao: `${l}ª legislatura da Câmara`, inicio: dataBR(itens[0]?.dataHora), fim: undefined as string | undefined };
  });
  return {
    nomeCivil: d.nomeCivil, nascimento: dataBR(d.dataNascimento),
    naturalidade: [d.municipioNascimento, d.ufNascimento].filter(Boolean).join("/") || undefined,
    escolaridade: d.escolaridade || undefined,
    filiacoes: filiacoes.reverse(), mandatos: mandatos.reverse(), fonte,
  };
}

async function dadosSenado(cod: number): Promise<Dados> {
  const base = `https://legis.senado.leg.br/dadosabertos/senador/${cod}`;
  const [det, fil, man] = await Promise.all([
    pegar(`${base}.json`), pegar(`${base}/filiacoes.json`).catch(() => null), pegar(`${base}/mandatos.json`).catch(() => null),
  ]);
  const p = det?.DetalheParlamentar?.Parlamentar ?? {};
  const basicos = p.DadosBasicosParlamentar ?? {};
  const ident = p.IdentificacaoParlamentar ?? {};
  type F = { Partido?: { SiglaPartido?: string; NomePartido?: string }; DataFiliacao?: string; DataDesfiliacao?: string };
  const filiacoes = lista<F>(fil?.FiliacaoParlamentar?.Parlamentar?.Filiacoes?.Filiacao)
    .map((f) => ({ partido: f.Partido?.SiglaPartido ?? f.Partido?.NomePartido ?? "?", inicio: dataBR(f.DataFiliacao), fim: dataBR(f.DataDesfiliacao) }))
    .sort((a, b) => (b.inicio ?? "").split("/").reverse().join("").localeCompare((a.inicio ?? "").split("/").reverse().join("")));
  type M = { UfParlamentar?: string; DescricaoParticipacao?: string; PrimeiraLegislaturaDoMandato?: { DataInicio?: string }; SegundaLegislaturaDoMandato?: { DataFim?: string } };
  const mandatos = lista<M>(man?.MandatoParlamentar?.Parlamentar?.Mandatos?.Mandato).map((m) => ({
    descricao: `Senado${m.UfParlamentar ? ` (${m.UfParlamentar})` : ""}${m.DescricaoParticipacao ? `, ${m.DescricaoParticipacao.toLowerCase()}` : ""}`,
    inicio: dataBR(m.PrimeiraLegislaturaDoMandato?.DataInicio), fim: dataBR(m.SegundaLegislaturaDoMandato?.DataFim),
  }));
  return {
    nomeCivil: ident.NomeCompletoParlamentar, nascimento: dataBR(basicos.DataNascimento),
    naturalidade: [basicos.Naturalidade, basicos.UfNaturalidade].filter(Boolean).join("/") || undefined,
    filiacoes, mandatos, fonte: `${base}.json`,
  };
}

export async function dadosOficiais(p: Politico): Promise<Dados> {
  try {
    return p.casa === "camara" ? await dadosCamara(p.id_oficial) : await dadosSenado(p.id_oficial);
  } catch (e) {
    return { filiacoes: [], mandatos: [], fonte: p.fonte, erro: `A fonte oficial não respondeu agora (${(e as Error).message}).` };
  }
}

/* ---------------- Notícias dos boletins em que o político aparece ---------------- */

const norm = (t: string) => semAcento(t).replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
/** Mesmo nome: igual, ou o mais curto (com 2+ palavras) aparece inteiro dentro do mais longo. */
function mesmoNome(a: string, b: string) {
  if (a === b) return true;
  const [curto, longo] = a.length <= b.length ? [a, b] : [b, a];
  return curto.split(" ").length >= 2 && ` ${longo} `.includes(` ${curto} `);
}

export async function noticiasDoPolitico(nome: string) {
  const { data, error } = await supabase
    .from("noticias_partidos")
    .select("politico, papel, partido_slug, noticias!inner(id, data, titulo, resumo, tipo, origem, fontes)")
    .not("politico", "is", null);
  if (error) throw error;
  const alvo = norm(nome);
  type L = { politico: string; papel: string; partido_slug: string; noticias: { id: number; data: string; titulo: string; resumo: string; tipo: string; origem: string; fontes: { titulo: string; url: string }[] } };
  const vistos = new Set<number>();
  return ((data ?? []) as unknown as L[])
    .filter((l) => mesmoNome(norm(l.politico), alvo))
    .filter((l) => (vistos.has(l.noticias.id) ? false : (vistos.add(l.noticias.id), true)))
    .sort((a, b) => (a.noticias.data < b.noticias.data ? 1 : -1));
}
