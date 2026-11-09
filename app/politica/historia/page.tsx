import type { Metadata } from "next";
import Link from "next/link";
import FotoPolitico from "@/components/FotoPolitico";
import { CHEFES, CONTEXTO_PERIODO, FONTE_HISTORIA, PERIODOS_HISTORIA } from "@/lib/historia";
import { fotoWiki } from "@/lib/wiki";

export const metadata: Metadata = { title: "Chefes de Estado do Brasil" };
export const revalidate = 86400;

export default async function Historia() {
  const fotos = new Map<string, string | null>();
  await Promise.all([...new Set(CHEFES.map((c) => c.wiki))].map(async (w) => fotos.set(w, await fotoWiki(w, 200))));

  return (
    <div className="pt-4">
      <Link href="/politica" className="text-sm text-[var(--suave)] hover:text-[var(--tinta)]">Política brasileira</Link>
      <h1 className="mt-3 font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Chefes de Estado do Brasil</h1>
      <p className="mt-3 text-[var(--suave)] max-w-[46ch]">
        Todos os imperadores e todos que exerceram a Presidência da República, em ordem cronológica. Para cada um: período, como chegou ao cargo, como saiu e partido, quando havia.
      </p>
      <nav aria-label="Períodos" className="mt-5 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 text-sm">
        {PERIODOS_HISTORIA.map((p) => (
          <a key={p} href={`#${p.replace(/\s+/g, "-")}`} className="shrink-0 rounded-full border border-[var(--fio)] px-3.5 py-2 hover:bg-[var(--acento-fundo)]">{p}</a>
        ))}
      </nav>

      {PERIODOS_HISTORIA.map((per) => (
        <section key={per} id={per.replace(/\s+/g, "-")} className="mt-10 scroll-mt-20" aria-label={per}>
          <h2 className="text-[1.25rem] font-semibold tracking-[-0.01em]">{per}</h2>
          <p className="mt-1 text-sm text-[var(--suave)]">{CONTEXTO_PERIODO[per]}</p>
          <ol className="mt-4 space-y-3">
            {CHEFES.filter((c) => c.periodoGeral === per).map((c) => (
              <li key={c.slug} className="rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-4">
                <div className="flex items-start gap-4">
                  <FotoPolitico src={fotos.get(c.wiki) ?? null} nome={c.nome} tamanho={64} />
                  <div className="min-w-0">
                    <h3 className="font-serif [font-variation-settings:'opsz'_36] text-[1.2rem] leading-tight font-semibold">{c.nome}</h3>
                    <p className="text-sm text-[var(--suave)] num">{c.periodo}{c.partido ? `, ${c.partido}` : ""}</p>
                    <dl className="mt-2 space-y-1 text-sm">
                      <div><dt className="inline font-medium">Como chegou: </dt><dd className="inline">{c.chegada}</dd></div>
                      <div><dt className="inline font-medium">Como saiu: </dt><dd className="inline">{c.saida}</dd></div>
                    </dl>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <p className="mt-8 text-xs leading-relaxed text-[var(--suave)]">
        Referência: <a href={FONTE_HISTORIA} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Biblioteca da Presidência da República</a>. Juntas militares e regências não estão listadas individualmente. Fotos: Wikimedia Commons, via Wikipédia.
      </p>
    </div>
  );
}
