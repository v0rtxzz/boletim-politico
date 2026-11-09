"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { semAcento } from "@/lib/texto";
import { IconeBusca } from "./Icones";

type Termo = { id: number; termo: string; definicao: string; exemplo: string | null; data: string | null; dataTexto: string | null };

const inicial = (t: string) => semAcento(t).charAt(0).toUpperCase();

export default function GlossarioLista({ termos }: { termos: Termo[] }) {
  const [filtro, setFiltro] = useState("");
  const visiveis = useMemo(() => {
    const f = semAcento(filtro.trim());
    return f ? termos.filter((t) => semAcento(`${t.termo} ${t.definicao}`).includes(f)) : termos;
  }, [filtro, termos]);
  const letras = [...new Set(visiveis.map((t) => inicial(t.termo)))];

  return (
    <>
      <div className="mt-6 relative">
        <label htmlFor="filtro" className="sr-only">Filtrar termos</label>
        <IconeBusca className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--suave)] pointer-events-none" />
        <input id="filtro" type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)}
          placeholder={`Filtrar ${termos.length} termos`}
          className="w-full rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] pl-12 pr-4 py-3.5 text-base outline-none placeholder:text-[var(--suave)] focus-visible:outline-2 focus-visible:outline-[var(--acento)]" />
      </div>

      {!filtro && letras.length > 1 && (
        <nav aria-label="Índice alfabético" className="mt-4 flex gap-1 overflow-x-auto no-scrollbar -mx-5 px-5">
          {letras.map((l) => (
            <a key={l} href={`#letra-${l}`} className="shrink-0 w-10 h-10 grid place-items-center rounded-xl text-[0.95rem] text-[var(--suave)] hover:text-[var(--tinta)] hover:bg-[var(--acento-fundo)] transition-colors">{l}</a>
          ))}
        </nav>
      )}

      {visiveis.length === 0 && (
        <p className="mt-10 text-[var(--suave)]">Nenhum termo corresponde a “{filtro}”.</p>
      )}

      {letras.map((l) => (
        <section key={l} id={`letra-${l}`} className="mt-10 scroll-mt-6" aria-label={`Letra ${l}`}>
          <h2 className="num font-serif [font-variation-settings:'opsz'_72] text-[2.4rem] leading-none font-light text-[var(--suave)]">{l}</h2>
          <dl className="mt-3 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] overflow-hidden">
            {visiveis.filter((t) => inicial(t.termo) === l).map((t) => (
              <div key={t.id} className="px-5 py-5 border-t border-[var(--fio)] first:border-t-0">
                <dt className="font-serif [font-variation-settings:'opsz'_36] text-[calc(1.3rem*var(--escala))] leading-tight font-semibold">{t.termo}</dt>
                <dd className="mt-2 font-serif text-[calc(1.08rem*var(--escala))] leading-relaxed">{t.definicao}</dd>
                {t.exemplo && (
                  <dd className="mt-3 text-[0.95rem] leading-relaxed text-[var(--suave)] border-l-2 border-[var(--fio)] pl-3">
                    <span className="font-medium text-[var(--tinta)]">No noticiário: </span>{t.exemplo}
                  </dd>
                )}
                {t.data && (
                  <dd className="mt-3 text-sm text-[var(--suave)]">
                    Apareceu pela primeira vez em <Link href={`/boletim/${t.data}`} className="underline underline-offset-4 text-[var(--tinta)]">{t.dataTexto}</Link>
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </section>
      ))}
    </>
  );
}
