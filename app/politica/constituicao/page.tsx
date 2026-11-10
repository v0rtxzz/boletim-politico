import type { Metadata } from "next";
import Link from "next/link";
import TopicosCivicos from "@/components/TopicosCivicos";
import { CONSTITUICAO, FONTE_CF } from "@/lib/conteudo-civico";

export const metadata: Metadata = { title: "Constituição explicada", description: "A Constituição de 1988 explicada de forma simples e resumida." };

export default function Constituicao() {
  return (
    <div className="pt-4">
      <Link href="/politica" className="text-sm text-[var(--suave)] hover:text-[var(--tinta)]">Política brasileira</Link>
      <h1 className="mt-3 font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Constituição explicada</h1>
      <p className="mt-3 font-serif text-[calc(1.1rem*var(--escala))] leading-relaxed">
        Um resumo em linguagem simples da Constituição Federal de 1988, organizado por tema. Toque em cada parte para abrir.
      </p>
      <TopicosCivicos topicos={CONSTITUICAO} />
      <p className="mt-8 text-xs leading-relaxed text-[var(--suave)]">
        Resumo didático; não substitui o texto legal. Texto oficial e atualizado no{" "}
        <a href={FONTE_CF} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Portal da Legislação do Planalto</a>.
        Selecione qualquer termo para consultá-lo no glossário.
      </p>
    </div>
  );
}
