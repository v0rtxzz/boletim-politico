import { supabase } from "./supabase";
import { CHEFES } from "./historia";
import { semAcento } from "./texto";

export type Resultado = { grupo: string; titulo: string; sub?: string; href: string; foto?: string | null };

const sa = (t: string) => semAcento(t);
/** Busca unificada na área Política Brasileira e nos boletins. */
export async function buscarTudo(q: string): Promise<Resultado[]> {
  const t = q.trim().replace(/[%,()*]/g, " ");
  if (t.length < 2) return [];
  const like = `%${t}%`;
  const [ps, pol, stf, glo, not, bol] = await Promise.all([
    supabase.from("partidos").select("slug, sigla, nome").eq("registrado", true).or(`sigla.ilike.${like},nome.ilike.${like}`).limit(8),
    supabase.from("politicos").select("id, nome, casa, partido_sigla, uf, foto_url").eq("em_exercicio", true).ilike("nome", like).limit(12),
    supabase.from("stf_ministros").select("slug, nome, cargo, indicado_por").not("nome", "is", null).ilike("nome", like).limit(5),
    supabase.from("glossario").select("termo, definicao").or(`termo.ilike.${like},definicao.ilike.${like}`).limit(8),
    supabase.from("noticias").select("data, titulo, origem").or(`titulo.ilike.${like},resumo.ilike.${like}`).order("data", { ascending: false }).limit(8),
    supabase.from("boletins").select("data, titulo_destaque").or(`titulo_destaque.ilike.${like},conteudo_md.ilike.${like}`).order("data", { ascending: false }).limit(6),
  ]);
  const r: Resultado[] = [];
  for (const p of ps.data ?? []) r.push({ grupo: "Partidos", titulo: p.sigla, sub: p.nome, href: `/partidos/${p.slug}` });
  for (const p of pol.data ?? []) r.push({ grupo: "Políticos", titulo: p.nome, sub: `${p.casa === "camara" ? "Deputado(a)" : "Senador(a)"}${p.partido_sigla ? `, ${p.partido_sigla}` : ""}${p.uf ? `-${p.uf}` : ""}`, href: `/politicos/${p.id}`, foto: p.foto_url });
  for (const m of stf.data ?? []) r.push({ grupo: "STF", titulo: m.nome!, sub: `${m.cargo ? `${m.cargo}, ` : ""}indicado por ${m.indicado_por}`, href: "/stf#ministros" });
  const ts = sa(t);
  for (const c of CHEFES.filter((c) => sa(`${c.nome} ${c.partido ?? ""}`).includes(ts)).slice(0, 6))
    r.push({ grupo: "História", titulo: c.nome, sub: `${c.periodo}${c.partido ? `, ${c.partido}` : ""}`, href: `/politica/historia#${c.periodoGeral.replace(/\s+/g, "-")}` });
  for (const g of glo.data ?? []) r.push({ grupo: "Glossário", titulo: g.termo, sub: g.definicao.slice(0, 110) + (g.definicao.length > 110 ? "…" : ""), href: `/glossario?q=${encodeURIComponent(g.termo)}` });
  for (const n of not.data ?? []) r.push({ grupo: "Notícias", titulo: n.titulo, sub: n.data.split("-").reverse().join("/"), href: n.origem === "boletim" ? `/boletim/${n.data}` : "/retrospectiva" });
  for (const b of bol.data ?? []) r.push({ grupo: "Boletins", titulo: b.titulo_destaque, sub: b.data.split("-").reverse().join("/"), href: `/boletim/${b.data}` });
  return r;
}
