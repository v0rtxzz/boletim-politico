"use client";
import { useState } from "react";

/** Foto oficial (Câmara, Senado ou Wikimedia); se não carregar, mostra as iniciais. */
export default function FotoPolitico({ src, nome, tamanho = 64, className = "" }: { src: string | null; nome: string; tamanho?: number; className?: string }) {
  const [erro, setErro] = useState(!src);
  const iniciais = nome.split(/\s+/).filter((p) => p.length > 2 || /^[A-Z]/.test(p)).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <span className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--acento-fundo)] text-[var(--suave)] ${className}`} style={{ width: tamanho, height: tamanho }}>
      {!erro && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Foto de ${nome}`} width={tamanho} height={tamanho} loading="lazy" decoding="async" referrerPolicy="no-referrer"
          onError={() => setErro(true)} className="h-full w-full object-cover object-top" />
      ) : (
        <span aria-hidden style={{ fontSize: tamanho * 0.34 }} className="font-semibold">{iniciais}</span>
      )}
    </span>
  );
}
