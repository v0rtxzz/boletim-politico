import type { Metadata } from "next";
import Link from "next/link";
import { listarPartidos } from "@/lib/partidos";
import { formatarData } from "@/lib/supabase";

export const metadata: Metadata = { title: "Partidos" };
export const dynamic = "force-dynamic";

const dataHora = (ts: string) =>
  new Date(ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function Partidos() {
  const partidos = await listarPartidos();
  const ref = partidos.find((p) => p.registro_atualizado_em) ?? partidos[0];

  return (
    <div className="pt-4">
      <h1 className="font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Partidos</h1>
      <p className="mt-2 text-[var(--suave)] max-w-[44ch]">
        Notícias dos boletins em que o partido ou um filiado teve papel relevante. Todos os partidos registrados no TSE, em ordem alfabética.
      </p>

      {partidos.length === 0 ? (
        <p className="mt-10 text-[var(--suave)]">A lista oficial de partidos ainda está sendo carregada.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
          {partidos.map((p) => (
            <li key={p.slug}>
              <Link href={`/partidos/${p.slug}`} className="flex h-full flex-col rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-4 hover:bg-[var(--acento-fundo)] transition-colors">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-serif [font-variation-settings:'opsz'_48] text-[1.55rem] leading-none font-semibold">{p.sigla}</span>
                  {p.numero && <span className="num text-sm text-[var(--suave)]">nº {p.numero}</span>}
                </span>
                <span className="mt-1.5 text-sm leading-snug text-[var(--suave)]">{p.nome}</span>
                <span className="mt-3 text-sm num">
                  {p.bancada_camara ?? "–"} deputados, {p.bancada_senado ?? "–"} senadores
                </span>
                <span className="mt-auto pt-2 text-xs text-[var(--suave)]">
                  {p.ultima ? `Última notícia: ${formatarData(p.ultima, false)}` : "Sem notícias nos boletins ainda"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {ref && (
        <p className="mt-8 text-xs leading-relaxed text-[var(--suave)]">
          Fontes oficiais: registro no{" "}
          <a href={ref.fonte_registro ?? "#"} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">TSE</a>
          {ref.registro_atualizado_em && <> (atualizado em {dataHora(ref.registro_atualizado_em)})</>};
          deputados em exercício pela{" "}
          <a href={ref.fonte_camara ?? "#"} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">API de Dados Abertos da Câmara</a>
          {ref.camara_atualizado_em && <> (atualizado em {dataHora(ref.camara_atualizado_em)})</>};
          senadores em exercício pela{" "}
          <a href={ref.fonte_senado ?? "#"} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">API de Dados Abertos do Senado</a>
          {ref.senado_atualizado_em && <> (atualizado em {dataHora(ref.senado_atualizado_em)})</>}.
        </p>
      )}
    </div>
  );
}
