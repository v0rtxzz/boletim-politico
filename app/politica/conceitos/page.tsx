import type { Metadata } from "next";
import Link from "next/link";
import TopicosCivicos from "@/components/TopicosCivicos";
import { CONCEITOS } from "@/lib/conteudo-civico";

export const metadata: Metadata = { title: "Esquerda, centro e direita", description: "Os principais termos do espectro político explicados de forma neutra." };

export default function Conceitos() {
  return (
    <div className="pt-4">
      <Link href="/politica" className="text-sm text-[var(--suave)] hover:text-[var(--tinta)]">Política brasileira</Link>
      <h1 className="mt-3 font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Esquerda, centro e direita</h1>
      <p className="mt-3 font-serif text-[calc(1.1rem*var(--escala))] leading-relaxed">
        O que significam os termos mais usados para descrever posições políticas, com o que defendem e as críticas que recebem.
      </p>
      <TopicosCivicos topicos={CONCEITOS.map((c) => ({ id: c.id, titulo: c.titulo, itens: c.texto }))} />
      <p className="mt-8 text-xs leading-relaxed text-[var(--suave)]">
        Definições resumidas a partir do uso corrente na ciência política. Os termos são aproximações e seu uso é debatido.
      </p>
    </div>
  );
}
