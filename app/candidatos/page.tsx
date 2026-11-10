import type { Metadata } from "next";
import Link from "next/link";
import FotoPolitico from "@/components/FotoPolitico";
import { ANOS_GERAIS, CARGOS_CAND, buscarCandidaturas, cargoBonito, situacaoBonita } from "@/lib/candidaturas";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = { title: "Candidatos" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ ano?: string; cargo?: string; uf?: string; partido?: string; q?: string; p?: string }> };
const UFS = ["BR","AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export default async function Candidatos({ searchParams }: Props) {
  const sp = await searchParams;
  const ano = sp.ano ? Number(sp.ano) : undefined;
  const cargo = sp.cargo ?? (sp.q || sp.uf || sp.partido || sp.ano ? "" : "PRESIDENTE");
  const r = await buscarCandidaturas({ ano, cargo: cargo || undefined, uf: sp.uf, partido: sp.partido, q: sp.q, pagina: Number(sp.p ?? 1) });
  const { data: partidos } = await supabase.from("partidos").select("slug, sigla").order("sigla");
  const select = "rounded-full border border-[var(--fio)] bg-transparent px-3.5 py-2 text-sm";
  const url = (p: number) => {
    const q = new URLSearchParams(Object.entries({ ...sp, cargo, p: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `/candidatos?${q}`;
  };
  const porAno = r.itens.reduce<Record<number, typeof r.itens>>((a, c) => { (a[c.ano] ??= []).push(c); return a; }, {});

  return (
    <div className="pt-4">
      <Link href="/politica" className="text-sm text-[var(--suave)] hover:text-[var(--tinta)]">Política brasileira</Link>
      <h1 className="mt-3 font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Candidatos</h1>
      <p className="mt-2 text-[var(--suave)] max-w-[46ch]">Todas as candidaturas a presidente, vice, governador, senador e deputado federal nas eleições gerais de 1994 a 2026, segundo o TSE.</p>

      <form action="/candidatos" className="mt-5 space-y-2" role="search">
        <input name="q" type="search" defaultValue={sp.q} placeholder="Nome do candidato" aria-label="Nome do candidato"
          className="w-full rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-3.5 text-base outline-none focus-visible:outline-2 focus-visible:outline-[var(--acento)]" />
        <div className="flex flex-wrap gap-2">
          <select name="cargo" defaultValue={cargo} className={select} aria-label="Cargo">
            <option value="">Todos os cargos</option>
            {CARGOS_CAND.map((c) => <option key={c} value={c}>{cargoBonito(c)}</option>)}
          </select>
          <select name="ano" defaultValue={sp.ano ?? ""} className={select} aria-label="Eleição">
            <option value="">Todas as eleições</option>
            {ANOS_GERAIS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select name="uf" defaultValue={sp.uf ?? ""} className={select} aria-label="Estado">
            <option value="">Todos os estados</option>
            {UFS.map((u) => <option key={u} value={u}>{u === "BR" ? "Brasil (presidente)" : u}</option>)}
          </select>
          <select name="partido" defaultValue={sp.partido ?? ""} className={select} aria-label="Partido">
            <option value="">Todos os partidos</option>
            {(partidos ?? []).map((p) => <option key={p.slug} value={p.slug}>{p.sigla}</option>)}
          </select>
          <button className="rounded-full bg-[var(--tinta)] text-[var(--papel)] px-5 py-2 text-sm font-medium cursor-pointer">Filtrar</button>
        </div>
      </form>

      <p className="mt-5 text-sm text-[var(--suave)]"><span className="num">{r.total.toLocaleString("pt-BR")}</span> candidaturas{cargo ? ` para ${cargoBonito(cargo).toLowerCase()}` : ""}</p>
      {r.total === 0 && <p className="mt-6 text-[var(--suave)]">Nenhuma candidatura com esses filtros. Os dados do TSE podem ainda estar sendo carregados.</p>}

      {Object.entries(porAno).sort((a, b) => Number(b[0]) - Number(a[0])).map(([a, lista]) => (
        <section key={a} className="mt-8" aria-label={`Eleição de ${a}`}>
          <h2 className="text-[1.1rem] font-semibold">Eleição de {a}</h2>
          <ul className="mt-3 grid grid-cols-1 min-[440px]:grid-cols-2 gap-2.5">
            {lista.map((c) => (
              <li key={c.sq_candidato} className="flex items-center gap-3 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-3 py-3">
                <FotoPolitico src={c.foto_url} nome={c.nome_urna || c.nome} tamanho={48} />
                <span className="min-w-0">
                  <span className="block font-medium leading-snug">{c.nome_urna || c.nome}</span>
                  <span className="block text-sm text-[var(--suave)]">
                    {cargoBonito(c.cargo)}{c.uf && c.uf !== "BR" ? `-${c.uf}` : ""}{c.partido_sigla ? `, ${c.partido_sigla}` : ""}{c.numero ? ` (${c.numero})` : ""}
                  </span>
                  <span className="block text-xs text-[var(--suave)]">{situacaoBonita(c.situacao)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {r.total > r.porPagina && (
        <nav aria-label="Páginas" className="mt-8 flex items-center justify-between text-sm">
          {r.pagina > 1 ? <Link href={url(r.pagina - 1)} className="rounded-full border border-[var(--fio)] px-4 py-2">Anteriores</Link> : <span />}
          <span className="text-[var(--suave)]">Página {r.pagina} de {Math.ceil(r.total / r.porPagina)}</span>
          {r.pagina * r.porPagina < r.total ? <Link href={url(r.pagina + 1)} className="rounded-full border border-[var(--fio)] px-4 py-2">Próximas</Link> : <span />}
        </nav>
      )}

      <p className="mt-8 text-xs leading-relaxed text-[var(--suave)]">
        Fonte: <a className="underline underline-offset-2" href="https://dadosabertos.tse.jus.br/dataset/" target="_blank" rel="noopener noreferrer">Portal de Dados Abertos do TSE</a> (arquivos "consulta_cand"). A situação mostra o resultado final da candidatura. Fotos: oficiais da Câmara/Senado ou Wikimedia, quando disponíveis.
      </p>
    </div>
  );
}
