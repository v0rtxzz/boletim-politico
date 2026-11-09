import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Boletim } from "@/lib/supabase";
import { formatarHora } from "@/lib/supabase";
import { semAcento } from "@/lib/texto";
import { dividirBoletim } from "@/lib/blocos";
import ProgressoLeitura from "./ProgressoLeitura";
import LeitorVoz from "./LeitorVoz";
import { IconeExterno } from "./Icones";
import BotaoCompartilhar from "./BotaoCompartilhar";
import RastreioLeitura from "./RastreioLeitura";
import IndiceLeitura from "./IndiceLeitura";

const ROTULOS_CAMPO = ["o que aconteceu", "contexto", "consequencia", "consequencias", "fonte", "fontes", "impacto"];
const SELOS: Record<string, string> = {
  confirmado: "selo-confirmado",
  "em apuracao / nao confirmado": "selo-apuracao",
  "em apuracao": "selo-apuracao",
  "nao confirmado": "selo-apuracao",
  analise: "selo-analise",
};

function textoHast(n: unknown): string {
  const no = n as { type?: string; value?: string; children?: unknown[] };
  if (no?.type === "text") return no.value ?? "";
  return (no?.children ?? []).map(textoHast).join("");
}
const chave = (s: string) => semAcento(s).replace(/:\s*$/, "").trim();

function primeiroForte(no: unknown): string | null {
  const n = no as { children?: { type: string; tagName?: string; children?: unknown[] }[] };
  const filhos = (n.children ?? []).filter((c) => !(c.type === "text" && !textoHast(c).trim()));
  const f = filhos[0];
  if (!f) return null;
  if (f.type === "element" && f.tagName === "strong") return textoHast(f);
  if (f.type === "element" && f.tagName === "p") return primeiroForte(f);
  return null;
}

type Mapa = Record<number, number>;
const bloco = (mapa: Mapa, node: unknown) => {
  const off = (node as { position?: { start?: { offset?: number } } })?.position?.start?.offset;
  return off !== undefined && mapa[off] !== undefined ? mapa[off] : undefined;
};

/** Componentes do Markdown; cada trecho legível recebe data-bloco (índice na leitura em voz). */
function criarComponentes(mapa: Mapa): Components {
  return {
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    strong: ({ node, children }) => {
      const k = chave(textoHast(node));
      if (ROTULOS_CAMPO.includes(k)) return <span className="rotulo">{textoHast(node).replace(/:\s*$/, "")}</span>;
      if (SELOS[k]) return <span className={`selo ${SELOS[k]}`}>{textoHast(node).replace(/:\s*$/, "")}</span>;
      return <strong>{children}</strong>;
    },
    li: ({ node, children }) => {
      const forte = primeiroForte(node);
      const k = forte ? chave(forte) : "";
      const ehCampo = ROTULOS_CAMPO.includes(k);
      const cls = ehCampo
        ? `campo${k.startsWith("fonte") ? " campo-fonte" : ""}`
        : SELOS[k] ? "com-selo" : undefined;
      return <li className={cls} data-bloco={bloco(mapa, node)}>{children}</li>;
    },
    p: ({ node, children }) => <p data-bloco={bloco(mapa, node)}>{children}</p>,
    h3: ({ node, children }) => {
      const b = bloco(mapa, node);
      return (
        <h3 data-bloco={b} id={b !== undefined ? `item-${b}` : undefined}>
          <span className="titulo-item">{children}</span>
          <BotaoCompartilhar />
        </h3>
      );
    },
    h4: ({ node, children }) => <h4 data-bloco={bloco(mapa, node)}>{children}</h4>,
    blockquote: ({ node, children }) => <blockquote data-bloco={bloco(mapa, node)}>{children}</blockquote>,
    tr: ({ node, children }) => <tr data-bloco={bloco(mapa, node)}>{children}</tr>,
    table: ({ children }) => (
      <div className="tabela">
        <table>{children}</table>
      </div>
    ),
  };
}

function formatarDiaPartes(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const opt = { timeZone: "UTC" } as const;
  return {
    dia: String(d).padStart(2, "0"),
    semana: dt.toLocaleDateString("pt-BR", { ...opt, weekday: "long" }),
    mesAno: dt.toLocaleDateString("pt-BR", { ...opt, month: "long", year: "numeric" }),
  };
}

export default function BoletimView({ boletim, atual = false }: { boletim: Boletim; atual?: boolean }) {
  const { horario, secoes, minutos, trechos, mapas, titulos } = dividirBoletim(boletim.conteudo_md, boletim.titulo_destaque);
  const fontes = Array.isArray(boletim.fontes) ? boletim.fontes : [];
  const { dia, semana, mesAno } = formatarDiaPartes(boletim.data);
  const numeradas = secoes.filter((s) => s.numero);
  // Para o índice de progresso: onde cada seção começa e termina (em trechos).
  const indice = secoes
    .map((s, i) => ({ id: s.id, numero: s.numero, nome: s.nome, inicio: titulos[i], fim: (titulos[i + 1] ?? trechos.length) - 1 }))
    .filter((s) => s.numero);

  return (
    <article data-data={boletim.data}>
      <RastreioLeitura data={boletim.data} titulo={boletim.titulo_destaque} total={trechos.length} />
      <ProgressoLeitura secoes={numeradas.map(({ id, numero, nome }) => ({ id, numero, nome }))} />

      <header className="pt-4 pb-8">
        <div className="flex items-end gap-4">
          <time dateTime={boletim.data} className="dia-numeral entrada-dia num" aria-label={`${semana}, ${dia} de ${mesAno}`}>
            {dia}
          </time>
          <div className="entrada-resto pb-1.5 leading-tight">
            <p className="text-[1.05rem] font-medium primeira-maiuscula">{semana}</p>
            <p className="text-[var(--suave)]">{mesAno}</p>
            <p className="mt-2 text-sm text-[var(--suave)]">
              {atual ? "Edição de hoje" : "Edição"} das {horario}
            </p>
          </div>
        </div>

        <h1 data-bloco={0} className="entrada-resto mt-7 font-serif [font-variation-settings:'opsz'_60] text-[2rem] sm:text-[2.4rem] leading-[1.08] font-medium tracking-[-0.02em] text-balance">
          {boletim.titulo_destaque}
        </h1>

        <p className="entrada-resto mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--suave)]">
          <span>Publicado às {formatarHora(boletim.criado_em)}</span>
          <span><span className="num">{minutos}</span> min de leitura</span>
          {fontes.length > 0 && <a href="#fontes" className="underline underline-offset-4 decoration-[var(--fio)] hover:decoration-[var(--tinta)]"><span className="num">{fontes.length}</span> fontes</a>}
        </p>

        <LeitorVoz data={boletim.data} trechos={trechos.map(({ texto, secao }) => ({ texto, secao }))} />
      </header>

      {indice.length > 0 && <IndiceLeitura data={boletim.data} secoes={indice} total={trechos.length} />}

      <div id="corpo-boletim">
        {secoes.map((s, i) => {
          const analise = semAcento(s.nome).startsWith("analise do dia");
          const termos = semAcento(s.nome).startsWith("termos explicados");
          const resumo = semAcento(s.nome).startsWith("resumo do dia");
          return (
            <section key={s.id} id={s.id} aria-labelledby={`t-${s.id}`}
              className={analise
                ? "mt-14 -mx-5 px-5 py-8 sm:mx-0 sm:px-8 sm:rounded-2xl bg-[var(--acento-fundo)]"
                : termos
                  ? "mt-14 pt-8 border-t border-[var(--fio)]"
                  : "mt-14"}>
              <h2 id={`t-${s.id}`} data-bloco={titulos[i]} className="flex items-baseline gap-3">
                {s.numero && <span className="num font-serif [font-variation-settings:'opsz'_72] text-[2.6rem] leading-none font-light text-[var(--suave)]">{s.numero}</span>}
                <span className={termos ? "text-lg font-semibold" : "text-[1.35rem] font-semibold tracking-[-0.01em]"}>{s.nome}</span>
              </h2>
              {analise && (
                <p className="mt-3 text-sm text-[var(--suave)]">Interpretação do analista, com base nos fatos relatados acima.</p>
              )}
              <div className={`prosa mt-4 ${resumo ? "resumo" : ""} ${termos ? "text-[1.05rem]" : ""}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={criarComponentes(mapas[i])}>
                  {s.md}
                </ReactMarkdown>
              </div>
            </section>
          );
        })}
      </div>

      {fontes.length > 0 && (
        <details id="fontes" className="group mt-14 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)]">
          <summary className="flex items-center justify-between cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
            <span className="font-semibold">Fontes consultadas <span className="num font-normal text-[var(--suave)]">({fontes.length})</span></span>
            <span aria-hidden className="text-[var(--suave)] transition-transform duration-200 group-open:rotate-45 text-2xl leading-none">+</span>
          </summary>
          <ol className="px-5 pb-4">
            {fontes.map((f, i) => {
              let host = f.url;
              try { host = new URL(f.url).hostname.replace(/^www\./, ""); } catch {}
              return (
                <li key={i} className="border-t border-[var(--fio)] first:border-t-0">
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 py-3 group/f">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[0.95rem] leading-snug group-hover/f:underline underline-offset-4">{f.titulo}</span>
                      <span className="block mt-0.5 text-xs text-[var(--suave)] truncate">{host}</span>
                    </span>
                    <IconeExterno className="mt-1 shrink-0 text-[var(--suave)]" />
                  </a>
                </li>
              );
            })}
          </ol>
        </details>
      )}

      <footer className="mt-12 grid grid-cols-2 gap-3 text-[0.95rem]">
        <Link href="/arquivo" className="rounded-xl border border-[var(--fio)] px-4 py-3.5 hover:bg-[var(--superficie)] transition-colors">
          <span className="block text-xs text-[var(--suave)]">Edições anteriores</span>
          Arquivo
        </Link>
        <Link href="/glossario" className="rounded-xl border border-[var(--fio)] px-4 py-3.5 text-right hover:bg-[var(--superficie)] transition-colors">
          <span className="block text-xs text-[var(--suave)]">Termos explicados</span>
          Glossário
        </Link>
      </footer>
    </article>
  );
}
