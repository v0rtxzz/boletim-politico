"use client";
import { useEffect, useState } from "react";
import { fracao, lerLeitura, terminado } from "@/lib/leitura";

/** Indica, na lista do Arquivo, se a edição já foi lida ou quanto foi lido. */
export default function SeloLeitura({ data }: { data: string }) {
  const [txt, setTxt] = useState<string | null>(null);
  useEffect(() => {
    const l = lerLeitura(data);
    if (!l || l.max <= 1) return;
    setTxt(terminado(l) ? "Lido" : `${Math.round(fracao(l) * 100)}% lido`);
  }, [data]);
  if (!txt) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--suave)]">
      {txt === "Lido" && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
      {txt}
    </span>
  );
}
