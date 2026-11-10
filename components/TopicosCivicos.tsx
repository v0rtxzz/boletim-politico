import { IconeExterno } from "@/components/Icones";

type T = { id: string; titulo: string; artigos?: string; link?: string; itens: string[] };

/** Lista de tópicos recolhíveis, com índice no topo. */
export default function TopicosCivicos({ topicos }: { topicos: T[] }) {
  return (
    <>
      <nav aria-label="Nesta página" className="mt-5 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 text-sm">
        {topicos.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="shrink-0 rounded-full border border-[var(--fio)] px-3.5 py-2 hover:bg-[var(--acento-fundo)]">{t.titulo}</a>
        ))}
      </nav>
      <div className="mt-6 space-y-3">
        {topicos.map((t, i) => (
          <details key={t.id} id={t.id} open={i === 0} className="group scroll-mt-20 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)]">
            <summary className="cursor-pointer list-none flex items-start justify-between gap-3 px-4 py-4">
              <span>
                <span className="block font-serif [font-variation-settings:'opsz'_36] text-[1.2rem] font-semibold leading-snug">{t.titulo}</span>
                {t.artigos && <span className="block mt-0.5 text-sm text-[var(--suave)]">{t.artigos}</span>}
              </span>
              <span aria-hidden className="mt-1 text-[var(--suave)] transition-transform group-open:rotate-45 text-xl leading-none">+</span>
            </summary>
            <div className="px-4 pb-4">
              <ul className="space-y-2.5 font-serif text-[calc(1.05rem*var(--escala))] leading-relaxed">
                {t.itens.map((x, j) => <li key={j} className="pl-4 relative before:absolute before:left-0 before:top-[0.7em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--suave)]">{x}</li>)}
              </ul>
              {t.link && (
                <a href={t.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--suave)] hover:text-[var(--tinta)]">
                  <IconeExterno className="shrink-0" /><span className="underline underline-offset-2">Ler o texto oficial</span>
                </a>
              )}
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
