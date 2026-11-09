"use client";
import { useEffect, useState } from "react";

type Secao = { id: string; numero: string | null; nome: string };

/** Barra fixa que mostra a seção em leitura e o progresso no boletim. */
export default function ProgressoLeitura({ secoes }: { secoes: Secao[] }) {
  const [atual, setAtual] = useState<Secao | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = document.getElementById("corpo-boletim");
    if (!alvo) return;
    let raf = 0;
    const medir = () => {
      raf = 0;
      const r = alvo.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const lido = Math.min(Math.max(-r.top + 120, 0), Math.max(total, 1));
      setProgresso(total > 0 ? lido / total : 0);
      setVisivel(r.top < 40);
      let vigente: Secao | null = null;
      for (const s of secoes) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < 140) vigente = s;
      }
      setAtual(vigente);
    };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(medir); };
    medir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => { window.removeEventListener("scroll", pedir); window.removeEventListener("resize", pedir); cancelAnimationFrame(raf); };
  }, [secoes]);

  return (
    <div aria-hidden={!visivel}
      className={`fixed inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)] bg-[color-mix(in_oklab,var(--papel)_90%,transparent)] backdrop-blur-xl border-b border-[var(--fio)] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${visivel ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}`}>
      <div className="mx-auto max-w-[42rem] px-5 h-12 flex items-center gap-3">
        <span className="num text-sm text-[var(--suave)] w-5">{atual?.numero ?? ""}</span>
        <span className="text-[0.95rem] font-medium truncate">{atual?.nome ?? "Boletim do dia"}</span>
        <a href="#indice" className="ml-auto text-sm text-[var(--suave)] hover:text-[var(--tinta)] px-2 py-2" tabIndex={visivel ? 0 : -1}>Índice</a>
      </div>
      <div className="h-[2px] bg-[var(--fio)]">
        <div className="h-full bg-[var(--acento)] origin-left" style={{ transform: `scaleX(${progresso})` }} />
      </div>
    </div>
  );
}
