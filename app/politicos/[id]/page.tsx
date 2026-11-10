import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FotoPolitico from "@/components/FotoPolitico";
import SeloTipo from "@/components/SeloTipo";
import { IconeExterno } from "@/components/Icones";
import { CARGO, dadosOficiais, getPolitico, noticiasDoPolitico } from "@/lib/politicos";
import { formatarData } from "@/lib/supabase";
import type { TipoNoticia } from "@/lib/partidos";
import { candidaturasDoPolitico, cargoBonito, situacaoBonita } from "@/lib/candidaturas";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getPolitico(id);
  return { title: p?.nome ?? "Político" };
}

function Linha({ rotulo, valor }: { rotulo: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div className="py-2.5 border-t border-[var(--fio)] first:border-t-0 flex justify-between gap-4">
      <dt className="text-sm text-[var(--suave)]">{rotulo}</dt>
      <dd className="text-sm text-right">{valor}</dd>
    </div>
  );
}

export default async function PaginaPolitico({ params }: Props) {
  const { id } = await params;
  if (!/^(dep|sen)-\d+$/.test(id)) notFound();
  const p = await getPolitico(id);
  if (!p) notFound();
  const [dados, noticias, cands] = await Promise.all([dadosOficiais(p), noticiasDoPolitico(p.nome), candidaturasDoPolitico(p.nome, p.uf)]);
  const casaNome = p.casa === "camara" ? "Câmara dos Deputados" : "Senado Federal";

  return (
    <div className="pt-4">
      <nav aria-label="Caminho" className="text-sm text-[var(--suave)]"><Link href="/politica" className="hover:text-[var(--tinta)]">Política brasileira</Link> <span aria-hidden>›</span> <Link href="/politicos" className="hover:text-[var(--tinta)]">Políticos</Link></nav>

      <header className="mt-4 flex items-center gap-4">
        <FotoPolitico src={p.foto_url} nome={p.nome} tamanho={96} />
        <div className="min-w-0">
          <h1 className="font-serif [font-variation-settings:'opsz'_48] text-[1.9rem] leading-tight font-semibold tracking-[-0.01em]">{p.nome}</h1>
          <p className="mt-1 text-[var(--suave)]">
            {p.em_exercicio ? CARGO[p.casa] : `Ex-${CARGO[p.casa].toLowerCase()}`}{p.uf ? ` por ${p.uf}` : ""}
            {!p.em_exercicio && p.periodo && <span className="block text-sm">Último mandato encontrado: {p.periodo}</span>}
          </p>
          {p.partido_sigla && (
            p.partido_slug
              ? <Link href={`/partidos/${p.partido_slug}`} title={p.em_exercicio ? undefined : "Partido no último mandato"} className="mt-2 inline-flex rounded-full border border-[var(--fio)] px-3 py-1 text-sm hover:bg-[var(--acento-fundo)]">{p.partido_sigla}</Link>
              : <span className="mt-2 inline-flex rounded-full border border-[var(--fio)] px-3 py-1 text-sm">{p.partido_sigla}</span>
          )}
        </div>
      </header>

      <section aria-labelledby="t-dados" className="mt-8">
        <h2 id="t-dados" className="text-[1.15rem] font-semibold">Dados oficiais</h2>
        {dados.erro && <p className="mt-2 text-sm text-[var(--suave)]">{dados.erro}</p>}
        <dl className="mt-3 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-1">
          <Linha rotulo="Nome civil" valor={dados.nomeCivil} />
          <Linha rotulo="Nascimento" valor={dados.nascimento} />
          <Linha rotulo="Naturalidade" valor={dados.naturalidade} />
          <Linha rotulo="Escolaridade" valor={dados.escolaridade} />
          <Linha rotulo="Casa" valor={casaNome} />
        </dl>
      </section>

      {dados.filiacoes.length > 0 && (
        <section aria-labelledby="t-filiacoes" className="mt-8">
          <h2 id="t-filiacoes" className="text-[1.15rem] font-semibold">Histórico de partidos</h2>
          <p className="mt-1 text-sm text-[var(--suave)]">
            {p.casa === "camara" ? "Partido registrado pela Câmara em cada período de mandato." : "Filiações registradas pelo Senado."}
          </p>
          <ol className="mt-3 relative border-l-2 border-[var(--fio)] ml-2 space-y-4">
            {dados.filiacoes.map((f, i) => (
              <li key={i} className="pl-5 relative">
                <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ${i === 0 && !f.fim ? "bg-[var(--tinta)]" : "border-2 border-[var(--suave)] bg-[var(--papel)]"}`} aria-hidden />
                <p className="font-medium">{f.partido}</p>
                <p className="text-sm text-[var(--suave)]">{f.inicio ? `desde ${f.inicio}` : ""}{f.fim ? ` até ${f.fim}` : i === 0 ? " (atual)" : ""}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {dados.mandatos.length > 0 && (
        <section aria-labelledby="t-mandatos" className="mt-8">
          <h2 id="t-mandatos" className="text-[1.15rem] font-semibold">Mandatos</h2>
          <ul className="mt-3 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-1">
            {dados.mandatos.map((m, i) => (
              <li key={i} className="py-2.5 border-t border-[var(--fio)] first:border-t-0 flex justify-between gap-4 text-sm">
                <span>{m.descricao}</span>
                <span className="text-[var(--suave)] text-right">{[m.inicio, m.fim].filter(Boolean).join(" a ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cands.length > 0 && (
        <section aria-labelledby="t-cands" className="mt-8">
          <h2 id="t-cands" className="text-[1.15rem] font-semibold">Candidaturas (TSE)</h2>
          <p className="mt-1 text-sm text-[var(--suave)]">Encontradas pelo nome de urna e estado nas eleições gerais desde 1994.</p>
          <ul className="mt-3 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-1">
            {cands.map((c) => (
              <li key={`${c.ano}-${c.sq_candidato}`} className="py-2.5 border-t border-[var(--fio)] first:border-t-0 flex justify-between gap-4 text-sm">
                <span><span className="num font-medium">{c.ano}</span> · {cargoBonito(c.cargo)}{c.uf && c.uf !== "BR" ? `-${c.uf}` : ""}{c.partido_sigla ? `, ${c.partido_sigla}` : ""}</span>
                <span className="text-[var(--suave)] text-right">{situacaoBonita(c.situacao)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="t-noticias" className="mt-8">
        <h2 id="t-noticias" className="text-[1.15rem] font-semibold">Nos boletins</h2>
        <p className="mt-1 text-sm text-[var(--suave)]">Notícias em que teve papel relevante, da mais recente para a mais antiga.</p>
        {noticias.length === 0 ? (
          <p className="mt-3 text-[var(--suave)]">Ainda não apareceu com papel relevante nos boletins.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {noticias.map((n) => (
              <li key={n.noticias.id} className="rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <time className="text-sm text-[var(--suave)] primeira-maiuscula" dateTime={n.noticias.data}>{formatarData(n.noticias.data)}</time>
                  <span className="prosa !text-base !leading-none !m-0"><SeloTipo tipo={n.noticias.tipo as TipoNoticia} /></span>
                </div>
                <h3 className="mt-2 font-serif text-[1.15rem] leading-snug font-semibold">{n.noticias.titulo}</h3>
                <p className="mt-1.5 text-sm"><span className="font-medium">Papel:</span> {n.papel}</p>
                {n.noticias.tipo === "investigacao" && <p className="mt-1.5 text-sm font-medium">Investigação ou acusação não é condenação.</p>}
                <div className="mt-3 flex flex-col gap-1 text-sm">
                  {n.noticias.origem === "boletim"
                    ? <Link href={`/boletim/${n.noticias.data}`} className="font-medium underline underline-offset-4">Ler no boletim</Link>
                    : <Link href="/retrospectiva" className="font-medium underline underline-offset-4">Ver na retrospectiva</Link>}
                  {n.noticias.fontes.slice(0, 2).map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-[var(--suave)] hover:text-[var(--tinta)]">
                      <IconeExterno className="mt-[3px] shrink-0" /><span className="underline underline-offset-2 decoration-[var(--fio)]">{f.titulo}</span>
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="mt-8 text-xs leading-relaxed text-[var(--suave)]">
        Fontes:{" "}
        <a href={dados.fonte} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">dados abertos da {casaNome}</a>
        {p.pagina_url && <> e <a href={p.pagina_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">página oficial do parlamentar</a></>}. Foto oficial da {casaNome}.
      </p>
    </div>
  );
}
