import { supabase } from "./supabase";

export type Partido = {
  slug: string; sigla: string; nome: string; numero: number | null; deferimento: string | null; registrado: boolean;
  fonte_registro: string | null; registro_atualizado_em: string | null;
  bancada_camara: number | null; fonte_camara: string | null; camara_atualizado_em: string | null;
  bancada_senado: number | null; fonte_senado: string | null; senado_atualizado_em: string | null;
};

export type TipoNoticia = "fato_confirmado" | "declaracao" | "investigacao" | "analise";
export type Tema = "congresso" | "justica" | "eleicoes" | "governo";

export const TIPOS: Record<TipoNoticia, string> = {
  fato_confirmado: "Fato confirmado",
  declaracao: "Declaração",
  investigacao: "Investigação",
  analise: "Análise",
};
export const TEMAS: Record<Tema, string> = { congresso: "Congresso", justica: "Justiça", eleicoes: "Eleições", governo: "Governo" };
export const PERIODOS = { "7": "7 dias", "30": "30 dias", "90": "90 dias", tudo: "Tudo" } as const;

export type NoticiaPartido = {
  id: number; data: string; titulo: string; resumo: string; secao: string | null; tipo: TipoNoticia; temas: Tema[];
  fontes: { titulo: string; url: string }[]; boletim_id: number;
  envolvidos: { politico: string | null; papel: string; filiacao_fonte: string | null }[];
};

export async function listarPartidos(): Promise<(Partido & { ultima: string | null })[]> {
  const [{ data: ps, error }, { data: ult }] = await Promise.all([
    supabase.from("partidos").select("*").eq("registrado", true).order("sigla"),
    supabase.from("noticias_partidos").select("partido_slug, noticias(data)"),
  ]);
  if (error) throw error;
  const ultima = new Map<string, string>();
  for (const r of (ult ?? []) as unknown as { partido_slug: string; noticias: { data: string } | null }[]) {
    const d = r.noticias?.data;
    if (d && (!ultima.has(r.partido_slug) || d > ultima.get(r.partido_slug)!)) ultima.set(r.partido_slug, d);
  }
  return ((ps ?? []) as Partido[])
    .sort((a, b) => a.sigla.localeCompare(b.sigla, "pt-BR", { sensitivity: "base" }))
    .map((p) => ({ ...p, ultima: ultima.get(p.slug) ?? null }));
}

export async function getPartido(slug: string): Promise<Partido | null> {
  const { data, error } = await supabase.from("partidos").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as Partido | null;
}

export async function noticiasDoPartido(slug: string, periodo: string, tema: string): Promise<NoticiaPartido[]> {
  let q = supabase
    .from("noticias_partidos")
    .select("politico, papel, filiacao_fonte, noticias!inner(id, data, titulo, resumo, secao, tipo, temas, fontes, boletim_id)")
    .eq("partido_slug", slug);
  if (periodo in PERIODOS && periodo !== "tudo") {
    const desde = new Date(Date.now() - Number(periodo) * 864e5).toISOString().slice(0, 10);
    q = q.gte("noticias.data", desde);
  }
  if (tema in TEMAS) q = q.contains("noticias.temas", [tema]);
  const { data, error } = await q;
  if (error) throw error;
  type Linha = { politico: string | null; papel: string; filiacao_fonte: string | null; noticias: Omit<NoticiaPartido, "envolvidos"> };
  const porNoticia = new Map<number, NoticiaPartido>();
  for (const l of (data ?? []) as unknown as Linha[]) {
    const n = porNoticia.get(l.noticias.id) ?? { ...l.noticias, envolvidos: [] };
    n.envolvidos.push({ politico: l.politico, papel: l.papel, filiacao_fonte: l.filiacao_fonte });
    porNoticia.set(n.id, n);
  }
  return [...porNoticia.values()].sort((a, b) => (a.data === b.data ? b.id - a.id : a.data < b.data ? 1 : -1));
}

/** Conteúdo dos boletins citados (para montar o link direto à notícia). */
export async function boletinsPorId(ids: number[]) {
  if (!ids.length) return new Map<number, { data: string; conteudo_md: string; titulo_destaque: string }>();
  const { data, error } = await supabase.from("boletins").select("id, data, conteudo_md, titulo_destaque").in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((b) => [b.id as number, b as { data: string; conteudo_md: string; titulo_destaque: string }]));
}
