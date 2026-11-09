"use client";
import { useEffect, useRef, useState } from "react";

/** Botão "Aa": ajusta o tamanho do texto de leitura (salvo no aparelho). */
const NIVEIS = [
  { id: "p", rotulo: "Pequeno", amostra: "0.85rem" },
  { id: "m", rotulo: "Padrão", amostra: "1rem" },
  { id: "g", rotulo: "Grande", amostra: "1.15rem" },
  { id: "gg", rotulo: "Maior", amostra: "1.3rem" },
] as const;

export default function PreferenciasTexto() {
  const [aberto, setAberto] = useState(false);
  const [nivel, setNivel] = useState("m");
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => { setNivel(document.documentElement.dataset.texto ?? "m"); }, []);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!caixa.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);

  const escolher = (id: string) => {
    setNivel(id);
    document.documentElement.dataset.texto = id;
    try { localStorage.setItem("texto", id); } catch {}
  };

  return (
    <div className="relative" ref={caixa}>
      <button type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto} aria-haspopup="dialog" aria-label="Tamanho do texto"
        className="w-11 h-11 grid place-items-center rounded-full text-[var(--suave)] hover:text-[var(--tinta)] hover:bg-[var(--acento-fundo)] transition-colors cursor-pointer font-serif text-[1.15rem] leading-none">
        <span aria-hidden><span className="text-[0.8em]">A</span>a</span>
      </button>
      {aberto && (
        <div role="dialog" aria-label="Tamanho do texto"
          className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-2.5rem))] rounded-2xl bg-[var(--superficie)] border border-[var(--fio)] shadow-[0_12px_40px_-8px_rgb(0_0_0/0.35)] p-3 player-entrada">
          <p className="px-1 pb-2 text-sm font-semibold">Tamanho do texto</p>
          <div role="radiogroup" aria-label="Tamanho do texto" className="grid grid-cols-4 gap-1.5">
            {NIVEIS.map((n) => (
              <button key={n.id} type="button" role="radio" aria-checked={nivel === n.id} onClick={() => escolher(n.id)}
                className={`flex flex-col items-center justify-end gap-1 h-16 rounded-xl border cursor-pointer transition-colors ${nivel === n.id ? "border-[var(--tinta)] bg-[var(--acento-fundo)]" : "border-[var(--fio)] hover:bg-[var(--acento-fundo)]"}`}>
                <span className="font-serif leading-none" style={{ fontSize: n.amostra }}>Aa</span>
                <span className="text-[0.68rem] text-[var(--suave)] pb-1.5">{n.rotulo}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
