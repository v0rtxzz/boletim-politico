import type { Metadata } from "next";
import Link from "next/link";
import { formatarData, listarBoletins } from "@/lib/supabase";

export const metadata: Metadata = { title: "Arquivo" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function Arquivo({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const boletins = await listarBoletins(q);

  const porMes = new Map<string, typeof boletins>();
  for (const b of boletins) {
    const [y, m] = b.data.split("-").map(Number);
    const chave = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    });
    porMes.set(chave, [...(porMes.get(chave) ?? []), b]);
  }

  return (
    <div className="pt-6">
      <h1 className="font-serif text-[1.65rem] font-semibold">Arquivo</h1>
      <form action="/arquivo" role="search" className="mt-4 flex gap-2">
        <label htmlFor="q" className="sr-only">Buscar nos boletins</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar por tema, nome, instituição…"
          className="flex-1 min-w-0 rounded-lg border border-[var(--linha)] bg-[var(--superficie)] px-3 py-2.5 text-base outline-none focus:border-[var(--suave)]"
        />
        <button className="rounded-lg border border-[var(--linha)] px-4 text-sm font-medium hover:border-[var(--suave)]">
          Buscar
        </button>
      </form>
      {q && (
        <p className="mt-3 text-sm text-[var(--suave)]">
          {boletins.length} {boletins.length === 1 ? "resultado" : "resultados"} para “{q}”.{" "}
          <Link href="/arquivo" className="underline underline-offset-4">Limpar</Link>
        </p>
      )}

      {boletins.length === 0 ? (
        <p className="mt-10 text-center text-[var(--suave)]">Nenhum boletim encontrado.</p>
      ) : (
        [...porMes.entries()].map(([mes, itens]) => (
          <section key={mes} className="mt-8">
            <h2 className="text-xs font-semibold tracking-[0.14em] uppercase text-[var(--suave)] capitalize-first">{mes}</h2>
            <ul className="mt-2 divide-y divide-[var(--linha)] border-y border-[var(--linha)]">
              {itens.map((b) => (
                <li key={b.id}>
                  <Link href={`/boletim/${b.data}`} className="block py-3.5 group">
                    <span className="block text-sm text-[var(--suave)] capitalize-first">{formatarData(b.data)}</span>
                    <span className="block mt-0.5 font-serif text-[1.1rem] leading-snug group-hover:underline underline-offset-4 decoration-[var(--linha)]">
                      {b.titulo_destaque}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
