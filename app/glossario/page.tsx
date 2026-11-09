import type { Metadata } from "next";
import GlossarioLista from "@/components/GlossarioLista";
import { formatarData, listarGlossario } from "@/lib/supabase";

export const metadata: Metadata = { title: "Glossário" };
export const dynamic = "force-dynamic";

export default async function Glossario({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const termos = await listarGlossario();
  termos.sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR", { sensitivity: "base" }));
  const dados = termos.map((t) => ({
    id: t.id, termo: t.termo, definicao: t.definicao, exemplo: t.exemplo,
    data: t.boletins?.data ?? null,
    dataTexto: t.boletins?.data ? formatarData(t.boletins.data, false) : null,
  }));

  return (
    <div className="pt-4">
      <h1 className="font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Glossário</h1>
      <p className="mt-2 text-[var(--suave)] max-w-[40ch]">Termos políticos, jurídicos e econômicos que apareceram nos boletins, explicados sem jargão.</p>
      {dados.length === 0 ? (
        <p className="mt-10 text-[var(--suave)]">Os termos são adicionados automaticamente a cada boletim publicado.</p>
      ) : (
        <GlossarioLista termos={dados} busca={q} />
      )}
    </div>
  );
}
