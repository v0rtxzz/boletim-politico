import { supabase } from "./supabase";

export type Candidatura = { municipio?: string | null; votos?: number | null; sq_candidato: number; ano: number; cargo: string; uf: string | null; nome: string; nome_urna: string | null; numero: string | null;
  partido_sigla: string | null; partido_slug: string | null; situacao: string | null; situacao_candidatura: string | null; foto_url: string | null };

export const CARGOS_CAND = ["PRESIDENTE", "VICE-PRESIDENTE", "GOVERNADOR", "SENADOR", "DEPUTADO FEDERAL", "DEPUTADO ESTADUAL", "DEPUTADO DISTRITAL", "PREFEITO", "VICE-PREFEITO", "VEREADOR"] as const;
export const ANOS_GERAIS = [2026, 2024, 2022, 2018, 2014, 2010, 2006, 2002, 1998, 1994];
export const cargoBonito = (c: string) => c.charAt(0) + c.slice(1).toLowerCase();
export const situacaoBonita = (s: string | null) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "Resultado não informado");

export async function buscarCandidaturas(f: { ano?: number; cargo?: string; uf?: string; partido?: string; q?: string; pagina?: number }) {
  const porPagina = 60;
  let q = supabase.from("candidaturas").select("*", { count: "exact" });
  if (f.ano) q = q.eq("ano", f.ano);
  if (f.cargo) q = q.eq("cargo", f.cargo);
  if (f.uf) q = q.eq("uf", f.uf);
  if (f.partido) q = q.eq("partido_slug", f.partido);
  const t = f.q?.trim().replace(/[%,()*]/g, " ");
  if (t) q = q.or(`nome.ilike.%${t}%,nome_urna.ilike.%${t}%`);
  const pag = Math.max(1, f.pagina ?? 1);
  const { data, count, error } = await q.order("ano", { ascending: false }).order("cargo").order("uf").order("nome")
    .range((pag - 1) * porPagina, pag * porPagina - 1);
  if (error) throw error;
  return { itens: (data ?? []) as Candidatura[], total: count ?? 0, porPagina, pagina: pag };
}

export async function candidaturasDoPolitico(nome: string, uf: string | null) {
  const t = nome.trim().replace(/[%,()*]/g, " ");
  let q = supabase.from("candidaturas").select("*").or(`nome_urna.ilike.${t},nome.ilike.${t}`);
  if (uf) q = q.in("uf", [uf, "BR"]);
  const { data } = await q.order("ano", { ascending: false }).limit(30);
  return (data ?? []) as Candidatura[];
}

export async function pessoasDoPartido(slug: string, busca: string) {
  let q = supabase.from("pessoas_partido").select("nome, nome_completo, papel, ano, uf, politico_id, foto_url").eq("partido_slug", slug);
  const t = busca.trim().replace(/[%,()*]/g, " ");
  if (t) q = q.or(`nome.ilike.%${t}%,nome_completo.ilike.%${t}%`);
  const { data } = await q.order("ano", { ascending: false, nullsFirst: false }).limit(t ? 80 : 40);
  return (data ?? []) as { nome: string; nome_completo: string; papel: string; ano: number | null; uf: string | null; politico_id: string | null; foto_url: string | null }[];
}
