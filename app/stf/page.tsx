import type { Metadata } from "next";
import Link from "next/link";
import FotoPolitico from "@/components/FotoPolitico";
import SeloTipo from "@/components/SeloTipo";
import { anosRestantes, dataBR, limite75, listarSTF, tempoDesde } from "@/lib/stf";
import { supabase, formatarData } from "@/lib/supabase";
import type { TipoNoticia } from "@/lib/partidos";

export const metadata: Metadata = { title: "STF" };
export const dynamic = "force-dynamic";

async function noticiasJustica() {
  const { data } = await supabase.from("noticias").select("id, data, titulo, resumo, tipo, origem").contains("temas", ["justica"]).order("data", { ascending: false }).limit(6);
  return (data ?? []) as { id: number; data: string; titulo: string; resumo: string; tipo: TipoNoticia; origem: string }[];
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10" aria-label={titulo}>
      <h2 className="text-[1.25rem] font-semibold tracking-[-0.01em]">{titulo}</h2>
      <div className="mt-3 font-serif text-[calc(1.08rem*var(--escala))] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default async function STF() {
  const [ministros, noticias] = await Promise.all([listarSTF(), noticiasJustica()]);
  const ativos = ministros.filter((m) => m.nome);
  const vagas = ministros.filter((m) => !m.nome);
  const porIndicador = Object.entries(ativos.reduce<Record<string, string[]>>((acc, m) => {
    (acc[m.indicado_por ?? "?"] ??= []).push(m.nome!);
    return acc;
  }, {})).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  const verificado = ministros[0]?.verificado_em;

  return (
    <div className="pt-4">
      <Link href="/politica" className="text-sm text-[var(--suave)] hover:text-[var(--tinta)]">Política brasileira</Link>
      <h1 className="mt-3 font-serif [font-variation-settings:'opsz'_60] text-[2.2rem] leading-none font-medium tracking-[-0.02em]">Supremo Tribunal Federal</h1>
      <p className="mt-3 font-serif text-[calc(1.1rem*var(--escala))] leading-relaxed">
        O STF é a mais alta corte do país e tem a função principal de guardar a Constituição. São 11 cadeiras.
        Hoje há <strong>{ativos.length} ministros</strong>{vagas.length ? <> e <strong>{vagas.length} cadeira vaga</strong></> : null}.
      </p>

      <nav aria-label="Nesta página" className="mt-5 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 text-sm">
        {[["#ministros", "Ministros"], ["#como-funciona", "Como funciona"], ["#indicacao", "Como se chega lá"], ["#noticias-stf", "Nos boletins"]].map(([h, t]) => (
          <a key={h} href={h} className="shrink-0 rounded-full border border-[var(--fio)] px-3.5 py-2 hover:bg-[var(--acento-fundo)]">{t}</a>
        ))}
      </nav>

      <section id="ministros" className="mt-8 scroll-mt-20" aria-label="Ministros">
        <h2 className="text-[1.25rem] font-semibold tracking-[-0.01em]">Ministros, por antiguidade</h2>
        <p className="mt-1 text-sm text-[var(--suave)]">Do mais antigo para o mais recente no tribunal.</p>
        <ol className="mt-4 space-y-3">
          {ativos.map((m) => {
            const restam = m.data_nascimento ? anosRestantes(m.data_nascimento) : null;
            return (
              <li key={m.slug} className="rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-4">
                <div className="flex items-start gap-4">
                  <FotoPolitico src={m.foto} nome={m.nome!} tamanho={72} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif [font-variation-settings:'opsz'_36] text-[1.3rem] leading-tight font-semibold">{m.nome}</h3>
                    {m.cargo && <p className="mt-1 inline-flex rounded-full bg-[var(--acento-fundo)] px-2.5 py-0.5 text-xs font-medium">{m.cargo}</p>}
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                      <dt className="text-[var(--suave)]">Indicado por</dt><dd>{m.indicado_por}</dd>
                      {m.data_posse && <><dt className="text-[var(--suave)]">No STF há</dt><dd>{tempoDesde(m.data_posse)} <span className="text-[var(--suave)]">(posse em {dataBR(m.data_posse)})</span></dd></>}
                      {m.data_nascimento && <><dt className="text-[var(--suave)]">Pode ficar até</dt><dd>{limite75(m.data_nascimento)} <span className="text-[var(--suave)]">(75 anos{restam !== null ? `; faltam cerca de ${Math.floor(restam)} ${Math.floor(restam) === 1 ? "ano" : "anos"}` : ""})</span></dd></>}
                    </dl>
                    {m.observacao && <p className="mt-2 text-sm text-[var(--suave)]">{m.observacao}</p>}
                  </div>
                </div>
              </li>
            );
          })}
          {vagas.map((v) => (
            <li key={v.slug} className="rounded-2xl border-2 border-dashed border-[var(--fio)] px-4 py-4">
              <h3 className="font-semibold">Cadeira vaga</h3>
              <p className="mt-1.5 text-sm leading-relaxed">{v.observacao}</p>
              <a href={v.fonte_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline underline-offset-2 text-[var(--suave)]">Fonte</a>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-2xl bg-[var(--acento-fundo)] px-4 py-4">
          <h3 className="font-semibold">Quem indicou a composição atual</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {porIndicador.map(([pres, nomes]) => (
              <li key={pres}><span className="font-medium">{pres}</span>: {nomes.join(", ")} <span className="text-[var(--suave)] num">({nomes.length})</span></li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[var(--suave)]">Ministros não têm mandato fixo e não representam quem os indicou: depois da posse, ficam até a aposentadoria (no máximo aos 75 anos), salvo renúncia ou afastamento.</p>
        </div>
      </section>

      <div id="como-funciona" className="scroll-mt-20">
        <Bloco titulo="Como funciona">
          <p><strong>Plenário:</strong> reúne todos os ministros e julga os casos de maior impacto, como ações que questionam se uma lei é compatível com a Constituição (ADI, ADC, ADO e ADPF).</p>
          <p><strong>Turmas:</strong> são dois colegiados de cinco ministros cada, que julgam parte dos processos, como recursos e ações penais. O presidente do STF não integra as turmas. A composição de cada turma muda com o tempo; confira a <a className="underline underline-offset-2" href="https://portal.stf.jus.br/ostf/" target="_blank" rel="noopener noreferrer">página oficial do STF</a>.</p>
          <p><strong>Presidência:</strong> o presidente e o vice são eleitos pelos próprios ministros para mandatos de dois anos, normalmente seguindo a ordem de antiguidade. O presidente do STF também preside o Conselho Nacional de Justiça (CNJ).</p>
          <p><strong>O que o STF julga:</strong> além do controle de constitucionalidade, julga recursos extraordinários (com efeito para casos semelhantes quando há "repercussão geral") e, em crimes comuns, autoridades como o presidente da República, ministros de Estado e parlamentares federais.</p>
        </Bloco>
      </div>

      <div id="indicacao" className="scroll-mt-20">
        <Bloco titulo="Como alguém se torna ministro">
          <ol className="list-decimal pl-5 space-y-2">
            <li>O <strong>presidente da República indica</strong> um nome com mais de 35 e menos de 70 anos, de notável saber jurídico e reputação ilibada.</li>
            <li>A <strong>Comissão de Constituição e Justiça (CCJ) do Senado</strong> faz a sabatina e vota.</li>
            <li>O <strong>plenário do Senado</strong> vota em sessão secreta. São necessários pelo menos <strong>41 votos favoráveis</strong> (maioria absoluta dos 81 senadores).</li>
            <li>Aprovado, o indicado é <strong>nomeado</strong> pelo presidente e toma posse no STF.</li>
          </ol>
          <p>A <strong>aposentadoria compulsória aos 75 anos</strong> vale desde a Emenda Constitucional 88, de 2015. Antes, o limite era 70 anos.</p>
        </Bloco>
      </div>

      <section id="noticias-stf" className="mt-10 scroll-mt-20" aria-label="Nos boletins">
        <h2 className="text-[1.25rem] font-semibold tracking-[-0.01em]">Justiça nos boletins</h2>
        {noticias.length === 0 ? <p className="mt-2 text-[var(--suave)]">Sem notícias sobre o tema ainda.</p> : (
          <ul className="mt-3 space-y-2.5">
            {noticias.map((n) => (
              <li key={n.id}>
                <Link href={n.origem === "boletim" ? `/boletim/${n.data}` : "/retrospectiva"} className="block rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-4 py-3.5 hover:bg-[var(--acento-fundo)] transition-colors">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-[var(--suave)]">{formatarData(n.data, false)}</span>
                    <span className="prosa !text-base !leading-none !m-0"><SeloTipo tipo={n.tipo} /></span>
                  </span>
                  <span className="mt-1 block font-serif text-[1.08rem] leading-snug font-semibold">{n.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-xs leading-relaxed text-[var(--suave)]">
        Composição, cargos, datas de posse e de nascimento verificados em {verificado ? dataBR(verificado) : "—"} em fontes oficiais e jornalísticas (links em cada dado no banco). Tempo no cargo e limite de 75 anos são calculados a partir dessas datas. Fotos: Wikimedia Commons, via Wikipédia.
        {" "}<a className="underline underline-offset-2" href="https://cms.stf.jus.br/post-sobreostf/composicao-atual/" target="_blank" rel="noopener noreferrer">Composição atual no site do STF</a>.
      </p>
    </div>
  );
}
