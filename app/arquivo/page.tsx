import type { Metadata } from "next";
import Link from "next/link";
import { listarBoletins } from "@/lib/supabase";
import { IconeBusca } from "@/components/Icones";

export const metadata: Metadata = { title: "Arquivo" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

function partes(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return {
    dia: String(d).padStart(2, "0"),
    semana: dt.toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long" }),
    mes: dt.toLocaleDateString("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" }),
  };
}

export default async function Arquivo({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const boletins = await listarBoletins(q);

  const porMes = new Map<string, typeof boletins>();
  for (const b of boletins) {
    const k = partes(b.data).mes;
    porMes.set(k, [...(porMes.get(k) ?? []), b]);
  }

  return (
    <div className="pt-4">
      <h1 className="font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Arquivo</h1>
      <p className="mt-2 text-[var(--suave)]">Todas as edições, da mais recente para a mais antiga.</p>

      <form action="/arquivo" role="search" className="mt-6 relative">
        <label htmlFor="q" className="sr-only">Buscar nos boletins</label>
        <IconeBusca className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--suave)] pointer-events-none" />
        <input id="q" name="q" type="search" defaultValue={q} enterKeyHint="search"
          placeholder="Buscar: tema, pessoa, instituição"
          className="w-full rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] pl-12 pr-4 py-3.5 text-base outline-none placeholder:text-[var(--suave)] focus-visible:outline-2 focus-visible:outline-[var(--acento)]" />
      </form>

      {q && (
        <p className="mt-4 text-sm text-[var(--suave)]">
          <span className="num">{boletins.length}</span> {boletins.length === 1 ? "edição menciona" : "edições mencionam"} “{q}”.{" "}
          <Link href="/arquivo" className="underline underline-offset-4 text-[var(--tinta)]">Limpar busca</Link>
        </p>
      )}

      {boletins.length === 0 ? (
        <div className="mt-12">
          <p className="font-serif text-xl">{q ? "Nenhuma edição encontrada." : "Ainda não há edições publicadas."}</p>
          <p className="mt-1 text-[var(--suave)]">{q ? "Tente um termo mais curto ou outra grafia." : "O primeiro boletim aparece aqui após a publicação."}</p>
        </div>
      ) : (
        [...porMes.entries()].map(([mes, itens]) => (
          <section key={mes} className="mt-10" aria-label={mes}>
            <h2 className="text-[0.95rem] font-semibold primeira-maiuscula">{mes}</h2>
            <ul className="mt-3 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] overflow-hidden">
              {itens.map((b) => {
                const p = partes(b.data);
                return (
                  <li key={b.id} className="border-t border-[var(--fio)] first:border-t-0">
                    <Link href={`/boletim/${b.data}`} className="flex gap-4 px-4 py-4 hover:bg-[var(--acento-fundo)] transition-colors">
                      <span className="num font-serif [font-variation-settings:'opsz'_72] text-[2.3rem] leading-[0.9] font-light w-12 shrink-0">{p.dia}</span>
                      <span className="min-w-0">
                        <span className="block text-sm text-[var(--suave)] primeira-maiuscula">{p.semana}</span>
                        <span className="block mt-0.5 font-serif text-[1.12rem] leading-snug text-pretty">{b.titulo_destaque}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
