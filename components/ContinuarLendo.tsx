"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EVENTO, apagarLeitura, fracao, haQuanto, listarLeituras, terminado, type Leitura } from "@/lib/leitura";

const dataCurta = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
};

/** Área "Continuar lendo": boletins começados e não terminados (salvos neste aparelho). */
export default function ContinuarLendo() {
  const [lista, setLista] = useState<Leitura[]>([]);
  useEffect(() => {
    const atualizar = () =>
      setLista(listarLeituras().filter((l) => l.max > 1 && !terminado(l) && Date.now() - l.quando < 30 * 864e5).slice(0, 5));
    atualizar();
    window.addEventListener(EVENTO, atualizar);
    return () => window.removeEventListener(EVENTO, atualizar);
  }, []);

  if (lista.length === 0) return null;

  return (
    <section aria-labelledby="t-continuar" className="mt-8">
      <h2 id="t-continuar" className="text-[0.95rem] font-semibold">Continuar lendo</h2>
      <ul className="mt-3 grid gap-3">
        {lista.map((l) => {
          const pct = Math.round(fracao(l) * 100);
          return (
            <li key={l.data} className="relative rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)]">
              <Link href={`/boletim/${l.data}?continuar=1`} className="block px-4 pt-4 pb-3.5 pr-12 rounded-2xl hover:bg-[var(--acento-fundo)] transition-colors">
                <span className="block text-sm text-[var(--suave)] primeira-maiuscula">{dataCurta(l.data)}, lido {haQuanto(l.quando)}</span>
                {l.titulo && <span className="block mt-1 font-serif text-[1.08rem] leading-snug line-clamp-2">{l.titulo}</span>}
                <span className="mt-3 flex items-center gap-3">
                  <span className="flex-1 h-1.5 rounded-full bg-[var(--fio)] overflow-hidden" aria-hidden>
                    <span className="block h-full rounded-full bg-[var(--acento)]" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="num text-sm text-[var(--suave)]">{pct}%</span>
                </span>
                <span className="mt-2 block text-sm">Parou em <span className="font-medium">{l.secao}</span></span>
              </Link>
              <button type="button" onClick={() => apagarLeitura(l.data)} aria-label={`Remover ${dataCurta(l.data)} de Continuar lendo`}
                className="absolute top-2 right-2 w-10 h-10 grid place-items-center rounded-full text-[var(--suave)] hover:text-[var(--tinta)] hover:bg-[var(--acento-fundo)] cursor-pointer">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" /></svg>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
