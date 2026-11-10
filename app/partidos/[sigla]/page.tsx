import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PERIODOS, TEMAS, boletinsPorId, getPartido, noticiasDoPartido } from "@/lib/partidos";
import { ancoraNoticia } from "@/lib/blocos";
import { formatarData } from "@/lib/supabase";
import SeloTipo from "@/components/SeloTipo";
import { IconeExterno } from "@/components/Icones";
import BuscaPoliticos from "@/components/BuscaPoliticos";
import { politicosDoPartido } from "@/lib/politicos";
import { pessoasDoPartido } from "@/lib/candidaturas";
import FotoPolitico from "@/components/FotoPolitico";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ sigla: string }>; searchParams: Promise<{ periodo?: string; tema?: string; pessoa?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sigla } = await params;
  const p = await getPartido(sigla);
  return { title: p ? `${p.sigla}: notícias` : "Partido" };
}

const dataHora = (ts: string) =>
  new Date(ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Dado({ rotulo, valor, fonte, quando, nomeFonte }: { rotulo: string; valor: string; fonte: string | null; quando: string | null; nomeFonte: string }) {
  return (
    <div className="py-3 border-t border-[var(--fio)] first:border-t-0">
      <dt className="text-sm text-[var(--suave)]">{rotulo}</dt>
      <dd className="mt-0.5 text-[1.05rem] font-medium num">{valor}</dd>
      <dd className="mt-0.5 text-xs text-[var(--suave)]">
        Fonte:{" "}
        {fonte ? <a href={fonte} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{nomeFonte}</a> : nomeFonte}
        {quando ? `, atualizado em ${dataHora(quando)}` : ", ainda não atualizado"}
      </dd>
    </div>
  );
}

function Filtro({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} scroll={false} aria-current={ativo ? "true" : undefined}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors ${ativo ? "border-[var(--tinta)] bg-[var(--tinta)] text-[var(--papel)]" : "border-[var(--fio)] hover:bg-[var(--acento-fundo)]"}`}>
      {children}
    </Link>
  );
}

export default async function PaginaPartido({ params, searchParams }: Props) {
  const { sigla } = await params;
  const { periodo = "tudo", tema = "", pessoa = "" } = await searchParams;
  const p = await getPartido(sigla);
  if (!p) notFound();

  const [noticias, membros, historico] = await Promise.all([noticiasDoPartido(p.slug, periodo, tema), politicosDoPartido(p.slug), pessoasDoPartido(p.slug, pessoa)]);
  const boletins = await boletinsPorId([...new Set(noticias.map((n) => n.boletim_id).filter((x): x is number => x !== null))]);
  const url = (o: { periodo?: string; tema?: string }) => {
    const q = new URLSearchParams();
    const per = o.periodo ?? periodo, tm = o.tema ?? tema;
    if (per && per !== "tudo") q.set("periodo", per);
    if (tm) q.set("tema", tm);
    const s = q.toString();
    return `/partidos/${p.slug}${s ? `?${s}` : ""}`;
  };

  return (
    <div className="pt-4">
      <nav aria-label="Caminho" className="text-sm text-[var(--suave)]"><Link href="/politica" className="hover:text-[var(--tinta)]">Política brasileira</Link> <span aria-hidden>›</span> <Link href="/partidos" className="hover:text-[var(--tinta)]">Partidos</Link></nav>
      <h1 className="mt-3 flex items-baseline gap-3">
        <span className="font-serif [font-variation-settings:'opsz'_72] text-[2.6rem] leading-none font-semibold tracking-[-0.02em]">{p.sigla}</span>
        {p.numero && <span className="num text-[var(--suave)]">nº {p.numero}</span>}
      </h1>
      <p className="mt-1.5 text-[var(--suave)]">{p.nome}</p>
      {!p.registrado && (
        <p className="mt-3 rounded-xl bg-[var(--acento-fundo)] px-4 py-3 text-sm">Este partido não consta mais na lista atual de partidos registrados no TSE.</p>
      )}

      <dl className="mt-5 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-1">
        <Dado rotulo="Deputados federais em exercício" valor={p.bancada_camara?.toString() ?? "–"} fonte={p.fonte_camara} quando={p.camara_atualizado_em} nomeFonte="Câmara dos Deputados (Dados Abertos)" />
        <Dado rotulo="Senadores em exercício" valor={p.bancada_senado?.toString() ?? "–"} fonte={p.fonte_senado} quando={p.senado_atualizado_em} nomeFonte="Senado Federal (Dados Abertos)" />
        <Dado rotulo="Registro no TSE" valor={p.deferimento ? `Deferido em ${p.deferimento}` : p.registrado ? "Registrado" : "Fora da lista atual"} fonte={p.fonte_registro} quando={p.registro_atualizado_em} nomeFonte="Tribunal Superior Eleitoral" />
      </dl>

      <nav aria-label="Nesta página" className="mt-6 flex gap-2 text-sm overflow-x-auto no-scrollbar -mx-5 px-5">
        <a href="#politicos" className="rounded-full border border-[var(--fio)] px-3.5 py-2 hover:bg-[var(--acento-fundo)]">Políticos do partido</a>
        <a href="#todas-as-epocas" className="rounded-full border border-[var(--fio)] px-3.5 py-2 hover:bg-[var(--acento-fundo)]">Todas as épocas</a>
        <a href="#noticias" className="rounded-full border border-[var(--fio)] px-3.5 py-2 hover:bg-[var(--acento-fundo)]">Notícias</a>
      </nav>

      <section id="politicos" className="mt-10 scroll-mt-20" aria-labelledby="t-politicos">
        <h2 id="t-politicos" className="text-[1.35rem] font-semibold tracking-[-0.01em]">Políticos do partido</h2>
        <p className="mt-1 mb-4 text-sm text-[var(--suave)]">Deputados federais e senadores em exercício filiados ao {p.sigla}, segundo a Câmara e o Senado. Toque para ver o histórico.</p>
        {membros.length === 0
          ? <p className="text-[var(--suave)]">O partido não tem deputados federais nem senadores em exercício.</p>
          : <BuscaPoliticos politicos={membros.map(({ id, casa, nome, partido_sigla, uf, foto_url }) => ({ id, casa, nome, partido_sigla, uf, foto_url }))} ocultarPartido />}
      </section>

      <section id="todas-as-epocas" className="mt-12 scroll-mt-20" aria-labelledby="t-epocas">
        <h2 id="t-epocas" className="text-[1.35rem] font-semibold tracking-[-0.01em]">Pessoas do partido em todas as épocas</h2>
        <p className="mt-1 text-sm text-[var(--suave)]">Quem foi candidato pelo {p.sigla} (TSE, desde 1994) ou exerceu mandato no Congresso pelo partido. Busque qualquer nome.</p>
        <form action={`/partidos/${p.slug}#todas-as-epocas`} className="mt-3 flex gap-2" role="search">
          <input name="pessoa" type="search" defaultValue={pessoa} placeholder="Nome de alguém do partido" aria-label="Buscar pessoa do partido"
            className="flex-1 min-w-0 rounded-xl border border-[var(--fio)] bg-transparent px-3.5 py-2.5 text-base outline-none focus-visible:border-[var(--suave)]" />
          <button className="rounded-xl bg-[var(--tinta)] text-[var(--papel)] px-4 text-sm font-medium cursor-pointer">Buscar</button>
        </form>
        {historico.length === 0
          ? <p className="mt-3 text-[var(--suave)]">{pessoa ? `Ninguém com “${pessoa}” no histórico do ${p.sigla}.` : "Histórico em carregamento."}</p>
          : (
            <ul className="mt-3 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] overflow-hidden">
              {historico.map((h, i) => {
                const conteudo = (
                  <span className="flex items-center gap-3 px-4 py-3">
                    <FotoPolitico src={h.foto_url} nome={h.nome} tamanho={40} />
                    <span className="min-w-0"><span className="block font-medium leading-snug">{h.nome}</span>
                    <span className="block text-sm text-[var(--suave)]">{h.papel}{h.uf && h.uf !== "BR" ? `, ${h.uf}` : ""}</span></span>
                  </span>
                );
                return (
                  <li key={i} className="border-t border-[var(--fio)] first:border-t-0">
                    {h.politico_id ? <Link href={`/politicos/${h.politico_id}`} className="block hover:bg-[var(--acento-fundo)]">{conteudo}</Link> : conteudo}
                  </li>
                );
              })}
            </ul>
          )}
        {!pessoa && historico.length > 0 && <p className="mt-2 text-xs text-[var(--suave)]">Mostrando as 40 mais recentes. Use a busca para encontrar qualquer pessoa.</p>}
      </section>

      <h2 id="noticias" className="mt-12 scroll-mt-20 text-[1.35rem] font-semibold tracking-[-0.01em]">Notícias</h2>
      <p className="mt-1 text-sm text-[var(--suave)]">Em que o partido ou um filiado (na data da notícia) teve papel relevante. Da mais recente para a mais antiga.</p>

      <div className="mt-4 space-y-2">
        <nav aria-label="Filtrar por período" className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
          {Object.entries(PERIODOS).map(([k, v]) => <Filtro key={k} href={url({ periodo: k })} ativo={periodo === k || (k === "tudo" && !(periodo in PERIODOS))}>{v}</Filtro>)}
        </nav>
        <nav aria-label="Filtrar por tema" className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
          <Filtro href={url({ tema: "" })} ativo={!tema}>Todos os temas</Filtro>
          {Object.entries(TEMAS).map(([k, v]) => <Filtro key={k} href={url({ tema: k })} ativo={tema === k}>{v}</Filtro>)}
        </nav>
      </div>

      {noticias.length === 0 ? (
        <div className="mt-8">
          <p className="font-serif text-xl">Nenhuma notícia neste filtro.</p>
          <p className="mt-1 text-[var(--suave)]">Só entram notícias em que o partido ou um filiado teve papel relevante.</p>
        </div>
      ) : (
        <ol className="mt-6 space-y-4">
          {noticias.map((n) => {
            const b = n.boletim_id !== null ? boletins.get(n.boletim_id) : undefined;
            const ancora = b ? ancoraNoticia(b.conteudo_md, b.titulo_destaque, n.trecho_titulo ?? n.titulo, n.secao) : "";
            return (
              <li key={n.id} className="rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <time dateTime={n.data} className="text-sm text-[var(--suave)] primeira-maiuscula">{formatarData(n.data)}</time>
                  <span className="prosa !text-base !leading-none !m-0"><SeloTipo tipo={n.tipo} /></span>
                </div>
                <h3 className="mt-2 font-serif [font-variation-settings:'opsz'_36] text-[1.22rem] leading-snug font-semibold text-balance">{n.titulo}</h3>
                <p className="mt-2 font-serif text-[1.02rem] leading-relaxed">{n.resumo}</p>
                {n.tipo === "investigacao" && (
                  <p className="mt-2 text-sm font-medium">Investigação ou acusação não é condenação.</p>
                )}
                <ul className="mt-3 space-y-1 text-sm">
                  {n.envolvidos.map((e, i) => (
                    <li key={i} className="text-[var(--suave)]">
                      <span className="text-[var(--tinta)] font-medium">{e.politico ?? p.sigla}</span>: {e.papel}
                      {e.filiacao_fonte && <> (<a href={e.filiacao_fonte} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">filiação</a>)</>}
                    </li>
                  ))}
                </ul>
                {n.temas.length > 0 && (
                  <p className="mt-3 flex flex-wrap gap-1.5">
                    {n.temas.map((t) => <span key={t} className="rounded-full bg-[var(--acento-fundo)] px-2.5 py-1 text-xs">{TEMAS[t]}</span>)}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-[var(--fio)] flex flex-col gap-1.5 text-sm">
                  {n.origem === "boletim"
                    ? <Link href={`/boletim/${n.data}${ancora ? `#${ancora}` : ""}`} className="font-medium underline underline-offset-4">Ler no boletim de {formatarData(n.data, false)}</Link>
                    : <Link href="/retrospectiva" className="font-medium underline underline-offset-4">Ver na retrospectiva de 12 meses</Link>}
                  {n.fontes.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-[var(--suave)] hover:text-[var(--tinta)]">
                      <IconeExterno className="mt-[3px] shrink-0" />
                      <span className="underline underline-offset-2 decoration-[var(--fio)]">{f.titulo}</span>
                    </a>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
