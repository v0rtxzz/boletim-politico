import Link from "next/link";
import type { Metadata } from "next";
import BuscaPoliticos from "@/components/BuscaPoliticos";
import { listarPoliticos } from "@/lib/politicos";

export const metadata: Metadata = { title: "Políticos" };
export const dynamic = "force-dynamic";

const dataHora = (ts: string) =>
  new Date(ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function Politicos() {
  const politicos = await listarPoliticos();
  const partidos = [...new Set(politicos.map((p) => p.partido_sigla).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const atualizado = politicos.reduce((m, p) => (p.atualizado_em > m ? p.atualizado_em : m), "");

  return (
    <div className="pt-4">
      <Link href="/politica" className="text-sm text-[var(--suave)] hover:text-[var(--tinta)]">Política brasileira</Link>
      <h1 className="mt-3 font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Políticos</h1>
      <p className="mt-2 text-[var(--suave)] max-w-[46ch]">
        Deputados federais e senadores em exercício. Toque em um nome para ver o histórico de partidos e mandatos e as notícias dos boletins.
      </p>
      <div className="mt-6">
        {politicos.length === 0
          ? <p className="text-[var(--suave)]">A lista oficial está sendo carregada. Volte em alguns minutos.</p>
          : <BuscaPoliticos politicos={politicos.map(({ id, casa, nome, partido_sigla, uf, foto_url }) => ({ id, casa, nome, partido_sigla, uf, foto_url }))} partidos={partidos} />}
      </div>
      {atualizado && (
        <p className="mt-8 text-xs leading-relaxed text-[var(--suave)]">
          Fontes: <a className="underline underline-offset-2" href="https://dadosabertos.camara.leg.br/api/v2/deputados" target="_blank" rel="noopener noreferrer">Câmara dos Deputados</a> e{" "}
          <a className="underline underline-offset-2" href="https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json" target="_blank" rel="noopener noreferrer">Senado Federal</a> (dados abertos e fotos oficiais), atualizado em {dataHora(atualizado)}.
        </p>
      )}
    </div>
  );
}
