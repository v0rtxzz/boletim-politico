import type { Metadata } from "next";
import Link from "next/link";
import FotoPolitico from "@/components/FotoPolitico";
import { IconeBusca } from "@/components/Icones";
import { buscarTudo, type Resultado } from "@/lib/busca";

export const metadata: Metadata = { title: "Política brasileira" };
export const dynamic = "force-dynamic";

const AREAS = [
  { href: "/partidos", titulo: "Partidos", texto: "Os partidos registrados no TSE, suas bancadas e as notícias em que aparecem." },
  { href: "/politicos", titulo: "Políticos", texto: "Congresso atual e ex-parlamentares desde o Império, com foto, histórico de partidos e mandatos." },
  { href: "/candidatos", titulo: "Candidatos", texto: "Candidaturas desde 1994 com votos, e os prefeitos e vereadores eleitos em 2024." },
  { href: "/stf", titulo: "STF", texto: "Os ministros do Supremo, quem indicou cada um, há quanto tempo estão lá e como o tribunal funciona." },
  { href: "/politica/historia", titulo: "Chefes de Estado", texto: "Imperadores e presidentes do Brasil: período, como chegaram e como saíram do cargo." },
  { href: "/politica/constituicao", titulo: "Constituição explicada", texto: "A Constituição de 1988 resumida em linguagem simples, tema por tema." },
  { href: "/politica/conceitos", titulo: "Esquerda, centro e direita", texto: "Os termos do espectro político explicados, com o que defendem e as críticas." },
  { href: "/retrospectiva", titulo: "Retrospectiva", texto: "Acontecimentos importantes dos últimos 12 meses, com fonte." },
  { href: "/glossario", titulo: "Glossário", texto: "Termos políticos, jurídicos e econômicos explicados sem jargão." },
];

type Props = { searchParams: Promise<{ q?: string }> };

export default async function Politica({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const resultados = q ? await buscarTudo(q) : [];
  const grupos = resultados.reduce<Record<string, Resultado[]>>((acc, r) => { (acc[r.grupo] ??= []).push(r); return acc; }, {});

  return (
    <div className="pt-4">
      <h1 className="font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Política brasileira</h1>
      <p className="mt-2 text-[var(--suave)] max-w-[44ch]">Partidos, políticos, STF, história e glossário em um só lugar. Busque qualquer coisa.</p>

      <form action="/politica" role="search" className="mt-5 relative">
        <label htmlFor="q" className="sr-only">Buscar em toda a área</label>
        <IconeBusca className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--suave)] pointer-events-none" />
        <input id="q" name="q" type="search" defaultValue={q} enterKeyHint="search" placeholder="Nome, partido, ministro, termo, tema…"
          className="w-full rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] pl-12 pr-4 py-3.5 text-base outline-none placeholder:text-[var(--suave)] focus-visible:outline-2 focus-visible:outline-[var(--acento)]" />
      </form>

      {q ? (
        <div className="mt-6">
          <p className="text-sm text-[var(--suave)]">
            <span className="num">{resultados.length}</span> {resultados.length === 1 ? "resultado" : "resultados"} para “{q}”. <Link href="/politica" className="underline underline-offset-4 text-[var(--tinta)]">Limpar</Link>
          </p>
          {resultados.length === 0 && <p className="mt-6 text-[var(--suave)]">Nada encontrado. Tente uma palavra mais curta ou outra grafia.</p>}
          {Object.entries(grupos).map(([g, lista]) => (
            <section key={g} className="mt-6" aria-label={g}>
              <h2 className="text-[0.95rem] font-semibold">{g}</h2>
              <ul className="mt-2 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] overflow-hidden">
                {lista.map((r, i) => (
                  <li key={i} className="border-t border-[var(--fio)] first:border-t-0">
                    <Link href={r.href} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--acento-fundo)] transition-colors">
                      {r.foto !== undefined && <FotoPolitico src={r.foto} nome={r.titulo} tamanho={40} />}
                      <span className="min-w-0">
                        <span className="block font-medium leading-snug">{r.titulo}</span>
                        {r.sub && <span className="block text-sm text-[var(--suave)] line-clamp-2">{r.sub}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
          {AREAS.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="flex h-full flex-col rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-4 hover:bg-[var(--acento-fundo)] transition-colors">
                <span className="font-serif [font-variation-settings:'opsz'_36] text-[1.3rem] font-semibold">{a.titulo}</span>
                <span className="mt-1 text-sm leading-snug text-[var(--suave)]">{a.texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-[var(--suave)]">Dica: em qualquer texto do site, selecione uma palavra para consultá-la no glossário.</p>
    </div>
  );
}
