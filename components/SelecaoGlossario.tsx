"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Termo = { termo: string; definicao: string; exemplo: string | null };

/**
 * Selecione um trecho de texto (até 60 caracteres) em qualquer página: aparece o botão
 * "Consultar no glossário", que mostra a definição ali mesmo ou leva à busca do glossário.
 */
export default function SelecaoGlossario() {
  const [sel, setSel] = useState("");
  const [aberto, setAberto] = useState(false);
  const [res, setRes] = useState<Termo[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const ler = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const s = window.getSelection();
        const t = (s?.toString() ?? "").replace(/\s+/g, " ").trim();
        const dentro = s?.anchorNode && (s.anchorNode.parentElement?.closest("main") ?? null);
        if (t.length >= 2 && t.length <= 60 && dentro && !s?.anchorNode?.parentElement?.closest("input, textarea, [data-sem-glossario]")) setSel(t);
        else if (!aberto) setSel("");
      }, 250);
    };
    document.addEventListener("selectionchange", ler);
    return () => document.removeEventListener("selectionchange", ler);
  }, [aberto]);

  const consultar = async () => {
    setAberto(true); setRes(null);
    try {
      const r = await fetch(`/api/glossario?q=${encodeURIComponent(sel)}`);
      setRes(((await r.json()) as { termos: Termo[] }).termos);
    } catch { setRes([]); }
  };
  const fechar = () => { setAberto(false); setSel(""); setRes(null); window.getSelection()?.removeAllRanges(); };

  if (!sel) return null;
  if (!aberto) {
    return (
      <button type="button" onClick={consultar} data-sem-glossario
        className="fixed z-50 left-1/2 -translate-x-1/2 bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:bottom-6 max-w-[90vw] rounded-full bg-[var(--tinta)] text-[var(--papel)] px-5 py-3 text-sm font-medium shadow-[0_12px_40px_-8px_rgb(0_0_0/0.45)] cursor-pointer player-entrada truncate">
        Consultar “{sel.length > 24 ? sel.slice(0, 24) + "…" : sel}” no glossário
      </button>
    );
  }
  return (
    <div role="dialog" aria-label="Glossário" data-sem-glossario
      className="fixed z-50 inset-x-3 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] sm:bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[32rem] max-h-[60vh] overflow-y-auto rounded-2xl bg-[var(--superficie)] border border-[var(--fio)] shadow-[0_12px_40px_-8px_rgb(0_0_0/0.4)] p-4 player-entrada">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[var(--suave)]">Glossário: “{sel}”</p>
        <button type="button" onClick={fechar} aria-label="Fechar" className="-mr-2 -mt-2 w-10 h-10 grid place-items-center rounded-full hover:bg-[var(--acento-fundo)] cursor-pointer">✕</button>
      </div>
      {res === null && <p className="mt-2 text-sm">Procurando…</p>}
      {res?.length === 0 && (
        <p className="mt-2 text-sm">Esse termo ainda não está no glossário. Os termos são acrescentados conforme aparecem nos boletins.</p>
      )}
      {res && res.length > 0 && (
        <dl className="mt-1 divide-y divide-[var(--fio)]">
          {res.slice(0, 3).map((t) => (
            <div key={t.termo} className="py-3">
              <dt className="font-serif text-[1.15rem] font-semibold">{t.termo}</dt>
              <dd className="mt-1 font-serif leading-relaxed">{t.definicao}</dd>
            </div>
          ))}
        </dl>
      )}
      <Link href={`/glossario?q=${encodeURIComponent(sel)}`} onClick={fechar} className="mt-2 inline-block text-sm underline underline-offset-4">Abrir no glossário</Link>
    </div>
  );
}
