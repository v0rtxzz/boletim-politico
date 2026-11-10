import { supabase } from "./supabase";
import { CHEFES } from "./historia";
import { CONCEITOS, CONSTITUICAO } from "./conteudo-civico";
import { semAcento } from "./texto";

export type Resultado = { grupo: string; titulo: string; sub?: string; href: string; foto?: string | null };

const sa = (t: string) => semAcento(t);
/** Busca unificada na área Política Brasileira e nos boletins. */
export async function buscarTudo(q: string): Promise<Resultado[]> {
  const t = q.trim().replace(/[%,()*]/g, " ");
  if (t.length < 2) return [];
  const like = `%${t}%`;
  const [ps, pol, stf, glo, not, bol, cand] = await Promise.all([
    supabase.from("partidos").select("slug, sigla, nome").eq("registrado", true).or(`sigla.ilike.${like},nome.ilike.${like}`).limit(8),
    supabase.from("politicos").select("id, nome, casa, partido_sigla, uf, foto_url, em_exercicio, periodo").ilike("nome", like).order("em_exercicio", { ascending: false }).order("ultima_legislatura", { ascending: false, nullsFirst: true }).limit(20),
    supabase.from("stf_ministros").select("slug, nome, cargo, indicado_por").not("nome", "is", null).ilike("nome", like).limit(5),
    supabase.from("glossario").select("termo, definicao").or(`termo.ilike.${like},definicao.ilike.${like}`).limit(8),
    supabase.from("noticias").select("data, titulo, origem").or(`titulo.ilike.${like},resumo.ilike.${like}`).order("data", { ascending: false }).limit(8),
    supabase.from("boletins").select("data, titulo_destaque").or(`titulo_destaque.ilike.${like},conteudo_md.ilike.${like}`).order("data", { ascending: false }).limit(6),
    supabase.from("candidaturas").select("ano, cargo, uf, nome, nome_urna, partido_sigla, situacao, foto_url").or(`nome.ilike.${like},nome_urna.ilike.${like}`).order("ano", { ascending: false }).limit(15),
  ]);
  const r: Resultado[] = [];
  for (const p of ps.data ?? []) r.push({ grupo: "Partidos", titulo: p.sigla, sub: p.nome, href: `/partidos/${p.slug}` });
  for (const p of pol.data ?? []) {
    const cargo = `${p.em_exercicio ? "" : "Ex-"}${p.casa === "camara" ? (p.em_exercicio ? "Deputado(a)" : "deputado(a)") : (p.em_exercicio ? "Senador(a)" : "senador(a)")}`;
    r.push({ grupo: "Políticos", titulo: p.nome, sub: `${cargo}${p.partido_sigla ? `, ${p.partido_sigla}` : ""}${p.uf ? `-${p.uf}` : ""}${!p.em_exercicio && p.periodo ? ` (último mandato: ${p.periodo})` : ""}`, href: `/politicos/${p.id}`, foto: p.foto_url });
  }
  for (const m of stf.data ?? []) r.push({ grupo: "STF", titulo: m.nome!, sub: `${m.cargo ? `${m.cargo}, ` : ""}indicado por ${m.indicado_por}`, href: "/stf#ministros" });
  const ts = sa(t);
  for (const c of CHEFES.filter((c) => sa(`${c.nome} ${c.partido ?? ""}`).includes(ts)).slice(0, 6))
    r.push({ grupo: "História", titulo: c.nome, sub: `${c.periodo}${c.partido ? `, ${c.partido}` : ""}`, href: `/politica/historia#${c.periodoGeral.replace(/\s+/g, "-")}` });
  for (const c of CONSTITUICAO.filter((c) => sa(`${c.titulo} ${c.itens.join(" ")}`).includes(ts)).slice(0, 5))
    r.push({ grupo: "Constituição", titulo: c.titulo, sub: c.artigos, href: `/politica/constituicao#${c.id}` });
  for (const c of CONCEITOS.filter((c) => sa(`${c.titulo} ${c.texto.join(" ")}`).includes(ts)).slice(0, 5))
    r.push({ grupo: "Conceitos políticos", titulo: c.titulo, href: `/politica/conceitos#${c.id}` });
  for (const c of cand.data ?? []) r.push({ grupo: "Candidaturas (TSE)", titulo: c.nome_urna || c.nome, sub: `${c.ano}: ${c.cargo.charAt(0)}${c.cargo.slice(1).toLowerCase()}${c.uf && c.uf !== "BR" ? `-${c.uf}` : ""}${c.partido_sigla ? `, ${c.partido_sigla}` : ""}${c.situacao ? ` (${c.situacao.toLowerCase()})` : ""}`, href: `/candidatos?q=${encodeURIComponent(c.nome_urna || c.nome)}&ano=${c.ano}`, foto: c.foto_url });
  for (const g of glo.data ?? []) r.push({ grupo: "Glossário", titulo: g.termo, sub: g.definicao.slice(0, 110) + (g.definicao.length > 110 ? "…" : ""), href: `/glossario?q=${encodeURIComponent(g.termo)}` });
  for (const n of not.data ?? []) r.push({ grupo: "Notícias", titulo: n.titulo, sub: n.data.split("-").reverse().join("/"), href: n.origem === "boletim" ? `/boletim/${n.data}` : "/retrospectiva" });
  for (const b of bol.data ?? []) r.push({ grupo: "Boletins", titulo: b.titulo_destaque, sub: b.data.split("-").reverse().join("/"), href: `/boletim/${b.data}` });
  return r;
}
