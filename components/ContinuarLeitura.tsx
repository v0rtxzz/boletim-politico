"use client";
import { useEffect, useState } from "react";

/**
 * Lembra até onde você leu cada boletim (no próprio aparelho) e oferece voltar a esse ponto.
 * Não rola sozinho: só sugere, para não desorientar quem abre a página.
 */
type Marca = { bloco: number; quando: number };
const chave = (data: string) => `leitura:${data}`;

function ler(data: string): Marca | null {
  try { const v = localStorage.getItem(chave(data)); return v ? JSON.parse(v) : null; } catch { return null; }
}

function primeiroVisivel(): number | null {
  const els = document.querySelectorAll<HTMLElement>("#corpo-boletim [data-bloco]");
  for (const el of els) {
    if (el.getBoundingClientRect().top >= 90) return Number(el.dataset.bloco);
  }
  return null;
}

export default function ContinuarLeitura({ data }: { data: string }) {
  const [oferta, setOferta] = useState<{ bloco: number; secao: string } | null>(null);

  // Ao abrir: se havia leitura em andamento (menos de 7 dias), oferece continuar.
  useEffect(() => {
    if (location.hash) return;
    const m = ler(data);
    if (!m || m.bloco < 3 || Date.now() - m.quando > 7 * 864e5) return;
    const el = document.querySelector<HTMLElement>(`[data-bloco="${m.bloco}"]`);
    if (!el) return;
    // Se o navegador já reabriu a página perto desse ponto, não precisa oferecer.
    const top = el.getBoundingClientRect().top;
    if (top > -200 && top < window.innerHeight * 0.6) return;
    const secao = el.closest("section")?.querySelector("h2 span:last-child")?.textContent ?? "";
    setOferta({ bloco: m.bloco, secao });
  }, [data]);

  // Guarda o ponto de leitura enquanto você rola.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const inicio = window.scrollY;
    const montadoEm = Date.now();
    const salvar = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        // Ignora a rolagem automática que o navegador faz ao reabrir a página.
        if (Date.now() - montadoEm < 1500) return;
        const b = primeiroVisivel();
        if (b === null) return;
        if (Math.abs(window.scrollY - inicio) > 400) setOferta(null);
        try { localStorage.setItem(chave(data), JSON.stringify({ bloco: b, quando: Date.now() })); } catch {}
      }, 400);
    };
    window.addEventListener("scroll", salvar, { passive: true });
    return () => { window.removeEventListener("scroll", salvar); clearTimeout(t); };
  }, [data]);

  if (!oferta) return null;

  const ir = () => {
    const el = document.querySelector<HTMLElement>(`[data-bloco="${oferta.bloco}"]`);
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 110, behavior: reduzido ? "auto" : "smooth" });
    setOferta(null);
  };

  return (
    <div role="status"
      className="fixed z-30 inset-x-3 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] sm:bottom-5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[28rem] flex items-center gap-2 rounded-2xl bg-[var(--tinta)] text-[var(--papel)] pl-4 pr-1.5 py-1.5 shadow-[0_12px_40px_-8px_rgb(0_0_0/0.35)] player-entrada">
      <p className="flex-1 min-w-0 text-sm leading-tight">
        <span className="block font-medium">Continuar de onde parou?</span>
        {oferta.secao && <span className="block truncate opacity-75">{oferta.secao}</span>}
      </p>
      <button type="button" onClick={ir} className="rounded-xl bg-[var(--papel)] text-[var(--tinta)] px-4 py-2.5 text-sm font-semibold cursor-pointer">Continuar</button>
      <button type="button" onClick={() => setOferta(null)} aria-label="Dispensar" className="w-10 h-10 grid place-items-center rounded-xl opacity-80 hover:opacity-100 cursor-pointer">
        <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" /></svg>
      </button>
    </div>
  );
}
