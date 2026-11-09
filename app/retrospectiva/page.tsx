import type { Metadata } from "next";
import Link from "next/link";
import SeloTipo from "@/components/SeloTipo";
import { IconeExterno } from "@/components/Icones";
import { supabase, formatarData } from "@/lib/supabase";
import { TEMAS, type Tema, type TipoNoticia } from "@/lib/partidos";

export const metadata: Metadata = { title: "Retrospectiva" };
export const dynamic = "force-dynamic";

type N = { id: number; data: string; titulo: string; resumo: string; tipo: TipoNoticia; temas: Tema[]; fontes: { titulo: string; url: string }[];
  noticias_partidos: { partido_slug: string; politico: string | null; papel: string }[] };

export default async function Retrospectiva() {
  const desde = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  const { data } = await supabase.from("noticias")
    .select("id, data, titulo, resumo, tipo, temas, fontes, noticias_partidos(partido_slug, politico, papel)")
    .eq("origem", "retrospectiva").gte("data", desde).order("data", { ascending: false });
  const itens = (data ?? []) as unknown as N[];
  const { data: ps } = await supabase.from("partidos").select("slug, sigla");
  const sigla = new Map((ps ?? []).map((p) => [p.slug as string, p.sigla as string]));

  const porMes = new Map<string, N[]>();
  for (const n of itens) {
    const [y, m] = n.data.split("-").map(Number);
    const k = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });
    porMes.set(k, [...(porMes.get(k) ?? []), n]);
  }

  return (
    <div className="pt-4">
      <Link href="/arquivo" className="text-sm text-[var(--suave)] hover:text-[var(--tinta)]">Arquivo</Link>
      <h1 className="mt-3 font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Retrospectiva: 12 meses</h1>
      <p className="mt-3 text-[var(--suave)] max-w-[46ch]">
        Uma seleção de acontecimentos políticos importantes do último ano, cada um com fonte. Não é uma lista completa: entram só fatos confirmados em veículo reconhecido ou fonte oficial.
      </p>

      {[...porMes.entries()].map(([mes, lista]) => (
        <section key={mes} className="mt-10" aria-label={mes}>
          <h2 className="text-[0.95rem] font-semibold primeira-maiuscula">{mes}</h2>
          <ol className="mt-3 relative border-l-2 border-[var(--fio)] ml-2 space-y-5">
            {lista.map((n) => (
              <li key={n.id} className="pl-5 relative">
                <span className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-[var(--tinta)]" aria-hidden />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <time dateTime={n.data} className="text-sm text-[var(--suave)]">{formatarData(n.data, false)}</time>
                  <span className="prosa !text-base !leading-none !m-0"><SeloTipo tipo={n.tipo} /></span>
                </div>
                <h3 className="mt-1.5 font-serif [font-variation-settings:'opsz'_36] text-[1.2rem] leading-snug font-semibold text-balance">{n.titulo}</h3>
                <p className="mt-1.5 font-serif text-[calc(1.02rem*var(--escala))] leading-relaxed">{n.resumo}</p>
                {n.tipo === "investigacao" && <p className="mt-1.5 text-sm font-medium">Investigação ou acusação não é condenação.</p>}
                {(n.noticias_partidos.length > 0 || n.temas.length > 0) && (
                  <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {[...new Set(n.noticias_partidos.map((r) => r.partido_slug))].map((s) => (
                      <Link key={s} href={`/partidos/${s}`} className="rounded-full border border-[var(--fio)] px-2.5 py-1 hover:bg-[var(--acento-fundo)]">{sigla.get(s) ?? s.toUpperCase()}</Link>
                    ))}
                    {n.temas.map((t) => <span key={t} className="rounded-full bg-[var(--acento-fundo)] px-2.5 py-1">{TEMAS[t]}</span>)}
                  </p>
                )}
                <div className="mt-2 flex flex-col gap-1 text-sm">
                  {n.fontes.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-[var(--suave)] hover:text-[var(--tinta)]">
                      <IconeExterno className="mt-[3px] shrink-0" /><span className="underline underline-offset-2 decoration-[var(--fio)]">{f.titulo}</span>
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
