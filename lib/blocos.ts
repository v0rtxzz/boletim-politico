import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { toString } from "mdast-util-to-string";
import type { ListItem, Root, RootContent, TableRow } from "mdast";
import { semAcento, tituloSecao } from "./texto";

/**
 * Divide o boletim em "trechos" de leitura (título, parágrafos, itens, linhas de tabela).
 * É a fonte única usada pela página (para marcar cada trecho com data-bloco),
 * pelo leitor de voz (destaque e navegação) e pelo gerador de áudio neural.
 */

export type SecaoMd = { id: string; numero: string | null; nome: string; md: string };
export type Trecho = { texto: string; secao: string; pausaAntes: number };
export type Divisao = {
  horario: string;
  minutos: number;
  secoes: SecaoMd[];
  trechos: Trecho[];
  /** Por seção: deslocamento (offset no md da seção) → índice do trecho. */
  mapas: Record<number, number>[];
  /** Índice do trecho do título de cada seção. */
  titulos: number[];
};

const ROTULOS_FONTE = ["fonte", "fontes"];

export function limparFala(t: string) {
  return t
    .replace(/\s*·\s*/g, ", ")
    .replace(/\s+[—–]\s+/g, ", ")
    .replace(/\bSTF\b/g, "S T F")
    .replace(/\bSTJ\b/g, "S T J")
    .replace(/\bTSE\b/g, "T S E")
    .replace(/\bTCU\b/g, "T C U")
    .replace(/\bPGR\b/g, "P G R")
    .replace(/\bEUA\b/g, "Estados Unidos")
    .replace(/\bONU\b/g, "ONU")
    .replace(/(\d)\s?%/g, "$1 por cento")
    .replace(/\bR\$\s?/g, "R$ ")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const comPonto = (t: string) => (/[.!?:]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);

function rotuloInicial(item: ListItem): { rotulo: string; resto: string } | null {
  const p = item.children[0];
  if (!p || p.type !== "paragraph") return null;
  const f = p.children[0];
  if (!f || f.type !== "strong") return null;
  const rotulo = toString(f).replace(/:\s*$/, "").trim();
  const resto = toString(item).slice(toString(f).length).replace(/^\s*:?\s*/, "");
  return { rotulo, resto };
}

const parser = unified().use(remarkParse).use(remarkGfm);

export function dividirBoletim(md: string, titulo: string): Divisao {
  const horario =
    md.match(/hor[aá]rio:\**\s*([0-2]?\d[:h][0-5]\d)/i)?.[1]?.replace("h", ":") ?? "06:00";
  const palavras = md.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").split(/\s+/).length;

  const secoes: SecaoMd[] = [];
  for (const parte of md.split(/^(?=##\s)/m)) {
    const m = parte.match(/^##\s+(.+)\n?/);
    if (!m) continue;
    secoes.push({ ...tituloSecao(m[1]), md: parte.slice(m[0].length) });
  }

  const trechos: Trecho[] = [{ texto: limparFala(`Boletim Político Diário. ${comPonto(titulo)}`), secao: "Abertura", pausaAntes: 0 }];
  const mapas: Record<number, number>[] = [];
  const titulos: number[] = [];

  secoes.forEach((s) => {
    const nomeSecao = s.nome;
    titulos.push(trechos.length);
    trechos.push({
      texto: limparFala(s.numero ? `Seção ${s.numero}. ${comPonto(s.nome)}` : comPonto(s.nome)),
      secao: nomeSecao,
      pausaAntes: 0.9,
    });
    const mapa: Record<number, number> = {};
    const arvore = parser.parse(s.md) as Root;
    const add = (no: RootContent, texto: string, pausa = 0.35) => {
      const off = no.position?.start.offset;
      const t = limparFala(texto);
      if (off === undefined || !t || t === ".") return;
      mapa[off] = trechos.length;
      trechos.push({ texto: t, secao: nomeSecao, pausaAntes: pausa });
    };
    for (const no of arvore.children) {
      switch (no.type) {
        case "paragraph":
        case "blockquote":
          add(no, comPonto(toString(no)));
          break;
        case "heading":
          add(no, comPonto(toString(no)), 0.6);
          break;
        case "list":
          for (const item of no.children) {
            const r = rotuloInicial(item);
            if (r && ROTULOS_FONTE.includes(semAcento(r.rotulo))) continue; // links de fonte não são lidos
            add(item, r ? `${r.rotulo}. ${comPonto(r.resto)}` : comPonto(toString(item)), 0.3);
          }
          break;
        case "table":
          no.children.forEach((linha: TableRow) =>
            add(linha as unknown as RootContent, comPonto(linha.children.map((c) => toString(c)).filter(Boolean).join(", ")), 0.25),
          );
          break;
      }
    }
    mapas.push(mapa);
  });

  return { horario, secoes, trechos, mapas, titulos, minutos: Math.max(1, Math.round(palavras / 220)) };
}

const normal = (t: string) => semAcento(t).replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Âncora da notícia dentro do boletim: "#item-N" quando é um título (###),
 * senão a âncora da seção. Usado para links "ler no boletim".
 */
export function ancoraNoticia(md: string, tituloBoletim: string, tituloNoticia: string, secao: string | null): string {
  const d = dividirBoletim(md, tituloBoletim);
  const alvo = normal(limparFala(tituloNoticia));
  for (let s = 0; s < d.secoes.length; s++) {
    const arvore = parser.parse(d.secoes[s].md) as Root;
    for (const no of arvore.children) {
      if (no.type !== "heading" || no.depth !== 3) continue;
      if (normal(limparFala(toString(no))) === alvo) {
        const idx = d.mapas[s][no.position!.start.offset!];
        if (idx !== undefined) return `item-${idx}`;
      }
    }
  }
  if (secao) {
    const sec = d.secoes.find((x) => normal(x.nome) === normal(secao.replace(/^\d+\.\s*/, "")) || normal(`${x.numero} ${x.nome}`) === normal(secao));
    if (sec) return sec.id;
  }
  return "";
}
