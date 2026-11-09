import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Boletim } from "@/lib/supabase";
import { formatarData, formatarHora } from "@/lib/supabase";

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function textoDe(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textoDe).join("");
  if (node && typeof node === "object" && "props" in node)
    return textoDe((node as { props: { children?: React.ReactNode } }).props.children);
  return "";
}

/** Separa o cabeçalho (título, Data, Horário) do corpo com as 7 seções. */
function prepararMarkdown(md: string) {
  const horario = md.match(/hor[aá]rio:\**\s*([0-2]?\d[:h][0-5]\d)/i)?.[1]?.replace("h", ":") ?? "06:00";
  const inicio = md.search(/^##\s/m);
  const corpo = inicio >= 0 ? md.slice(inicio) : md;
  const secoes = [...corpo.matchAll(/^##\s+(.+)$/gm)].map((m) => {
    const titulo = m[1].replace(/[*_`]/g, "").trim();
    return { titulo, id: slug(titulo) };
  });
  return { horario, corpo, secoes };
}

function rotuloCurto(titulo: string) {
  const semNumero = titulo.replace(/^\d+\.\s*/, "");
  const curto: Record<string, string> = {
    "resumo do dia": "Resumo",
    "politica brasileira": "Brasil",
    "politica internacional": "Mundo",
    "bastidores e movimentacoes politicas": "Bastidores",
    "indicadores e dados oficiais": "Indicadores",
    "o que merece atencao hoje?": "Hoje",
    "o que merece atencao hoje": "Hoje",
    "analise do dia": "Análise",
  };
  const chave = semNumero.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return curto[chave] ?? semNumero;
}

const componentes: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  h2: ({ children }) => {
    const t = textoDe(children);
    return (
      <h2 id={slug(t.replace(/[*_`]/g, "").trim())} className="scroll-mt-28">
        {children}
      </h2>
    );
  },
  table: ({ children }) => (
    <div className="tabela">
      <table>{children}</table>
    </div>
  ),
};

export default function BoletimView({ boletim, atual = false }: { boletim: Boletim; atual?: boolean }) {
  const { horario, corpo, secoes } = prepararMarkdown(boletim.conteudo_md);
  const fontes = Array.isArray(boletim.fontes) ? boletim.fontes : [];

  return (
    <article>
      <header className="pt-6 pb-5 border-b border-[var(--linha)]">
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[var(--suave)]">
          {atual ? "Edição de hoje" : "Edição arquivada"}
        </p>
        <h1 className="mt-2 font-serif text-[1.65rem] leading-tight font-semibold text-balance">
          {boletim.titulo_destaque}
        </h1>
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--suave)]">
          <div className="flex gap-1.5">
            <dt>Data:</dt>
            <dd className="text-[var(--texto)] capitalize-first">
              <time dateTime={boletim.data}>{formatarData(boletim.data)}</time>
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Horário:</dt>
            <dd className="text-[var(--texto)]">{horario}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Publicado às</dt>
            <dd className="text-[var(--texto)]">{formatarHora(boletim.criado_em)}</dd>
          </div>
        </dl>
      </header>

      {secoes.length > 0 && (
        <nav
          aria-label="Seções do boletim"
          className="sticky top-[3.25rem] z-10 -mx-4 px-4 py-2 bg-[var(--fundo)]/95 backdrop-blur border-b border-[var(--linha)]"
        >
          <ol className="flex gap-2 overflow-x-auto no-scrollbar text-sm">
            {secoes.map((s, i) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--linha)] px-3 py-1.5 text-[var(--suave)] hover:text-[var(--texto)] hover:border-[var(--suave)]"
                >
                  <span className="tabular-nums text-xs opacity-70">{i + 1}</span>
                  {rotuloCurto(s.titulo)}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="prosa mt-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentes}>
          {corpo}
        </ReactMarkdown>
      </div>

      {fontes.length > 0 && (
        <section className="mt-10 pt-6 border-t border-[var(--linha)]">
          <h2 className="text-xs font-semibold tracking-[0.14em] uppercase text-[var(--suave)]">
            Fontes consultadas ({fontes.length})
          </h2>
          <ol className="mt-3 space-y-2 text-sm list-decimal pl-5 marker:text-[var(--suave)]">
            {fontes.map((f, i) => (
              <li key={i} className="pl-1">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[var(--linha)] underline-offset-4 hover:decoration-[var(--texto)] break-words"
                >
                  {f.titulo}
                </a>
                <span className="block text-xs text-[var(--suave)] truncate">
                  {(() => {
                    try {
                      return new URL(f.url).hostname.replace(/^www\./, "");
                    } catch {
                      return f.url;
                    }
                  })()}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="mt-10 mb-4 flex justify-between text-sm">
        <Link href="/arquivo" className="text-[var(--suave)] hover:text-[var(--texto)]">
          ← Boletins anteriores
        </Link>
        <Link href="/glossario" className="text-[var(--suave)] hover:text-[var(--texto)]">
          Glossário →
        </Link>
      </footer>
    </article>
  );
}
