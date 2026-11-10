import { supabase } from "@/lib/supabase";
import { slugPartido } from "@/lib/partidos-oficial";


/**
 * Importa ex-parlamentares das bases oficiais (com foto oficial), em lotes de legislaturas:
 *   /api/politicos/importar?casa=camara&de=50&ate=57
 *   /api/politicos/importar?casa=senado&de=40&ate=57
 * Exige Authorization: Bearer CRON_SECRET.
 */
const UA = { "User-Agent": "BoletimPolitico/1.0 (+https://boletim-politico.vercel.app)", Accept: "application/json" };
const CAMARA = "https://dadosabertos.camara.leg.br/api/v2";
const SENADO = "https://legis.senado.leg.br/dadosabertos";

async function pegar(url: string) {
  for (let t = 0; t < 4; t++) {
    const r = await fetch(url, { headers: UA, cache: "no-store" });
    if (r.ok) return r.json();
    if (r.status < 500) throw new Error(`${r.status} em ${url}`);
    await new Promise((ok) => setTimeout(ok, 2500 * (t + 1)));
  }
  throw new Error(`falha repetida em ${url}`);
}
const lista = <T,>(x: T | T[] | undefined | null): T[] => (Array.isArray(x) ? x : x ? [x] : []);
const ano = (d?: string) => d?.slice(0, 4) ?? "";

type Item = { id: string; id_oficial: number; nome: string; partido_sigla: string; partido_slug: string; uf: string; foto_url: string; pagina_url: string; legislatura: number; periodo: string };

export async function importarCamara(de: number, ate: number) {
  const legs = (await pegar(`${CAMARA}/legislaturas?itens=100`)).dados as { id: number; dataInicio: string; dataFim: string }[];
  const periodo = new Map(legs.map((l) => [l.id, `${ano(l.dataInicio)}–${ano(l.dataFim)}`]));
  const itens: Item[] = [];
  for (let leg = de; leg <= ate; leg++) {
    let url: string | null = `${CAMARA}/deputados?idLegislatura=${leg}&itens=100&pagina=1`;
    for (let g = 0; url && g < 15; g++) {
      const j = (await pegar(url)) as { dados: { id: number; nome: string; siglaPartido: string; siglaUf: string; urlFoto: string }[]; links?: { rel: string; href: string }[] };
      for (const d of j.dados) itens.push({
        id: `dep-${d.id}`, id_oficial: d.id, nome: d.nome, partido_sigla: d.siglaPartido ?? "", partido_slug: d.siglaPartido ? slugPartido(d.siglaPartido) : "",
        uf: d.siglaUf ?? "", foto_url: (d.urlFoto ?? "").replace(/^http:/, "https:"), pagina_url: `https://www.camara.leg.br/deputados/${d.id}`,
        legislatura: leg, periodo: periodo.get(leg) ?? "",
      });
      url = j.links?.find((l) => l.rel === "next")?.href ?? null;
    }
  }
  return itens;
}

type P = { IdentificacaoParlamentar: { CodigoParlamentar: string; NomeParlamentar: string; SiglaPartidoParlamentar?: string; UfParlamentar?: string; UrlFotoParlamentar?: string; UrlPaginaParlamentar?: string };
  Mandatos?: { Mandato?: unknown } };
export async function importarSenado(de: number, ate: number) {
  const itens: Item[] = [];
  for (let leg = de; leg <= ate; leg++) {
    const j = await pegar(`${SENADO}/senador/lista/legislatura/${leg}.json`);
    const ps = lista<P>(j?.ListaParlamentarLegislatura?.Parlamentares?.Parlamentar);
    for (const p of ps) {
      const i = p.IdentificacaoParlamentar;
      itens.push({
        id: `sen-${i.CodigoParlamentar}`, id_oficial: Number(i.CodigoParlamentar), nome: i.NomeParlamentar,
        partido_sigla: i.SiglaPartidoParlamentar ?? "", partido_slug: i.SiglaPartidoParlamentar ? slugPartido(i.SiglaPartidoParlamentar) : "",
        uf: i.UfParlamentar ?? "", foto_url: (i.UrlFotoParlamentar ?? "").replace(/^http:/, "https:"),
        pagina_url: (i.UrlPaginaParlamentar ?? `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${i.CodigoParlamentar}`).replace(/^http:/, "https:"),
        legislatura: leg, periodo: `${leg}ª legislatura`,
      });
    }
  }
  return itens;
}

export async function gravarImportados(casa: "camara" | "senado", itens: Item[]) {
  {
    // Partido de cada pessoa em CADA legislatura (para "pessoas do partido em todas as épocas").
    const mandatos = itens.map((it) => ({ id: it.id, casa, legislatura: it.legislatura, periodo: it.periodo, partido_sigla: it.partido_sigla, partido_slug: it.partido_slug, uf: it.uf }));
    // Uma linha por pessoa: fica a da legislatura mais recente do lote.
    const porId = new Map<string, Item>();
    for (const it of itens) { const a = porId.get(it.id); if (!a || it.legislatura >= a.legislatura) porId.set(it.id, it); }
    const unicos = [...porId.values()];
    let gravados = 0;
    for (let i = 0; i < unicos.length; i += 1000) {
      const { data, error } = await supabase.rpc("importar_politicos", {
        p_segredo: process.env.CRON_SECRET, p_casa: casa,
        p_fonte: casa === "camara" ? `${CAMARA}/deputados` : `${SENADO}/senador/lista/legislatura`, p_lista: unicos.slice(i, i + 1000),
      });
      if (error) throw new Error(error.message);
      gravados += data as number;
    }
    for (let i = 0; i < mandatos.length; i += 2000) {
      const { error } = await supabase.rpc("importar_mandatos_partido", { p_segredo: process.env.CRON_SECRET, p_lista: mandatos.slice(i, i + 2000) });
      if (error) throw new Error(error.message);
    }
    return { pessoas: unicos.length, gravados, mandatos: mandatos.length };
  }
}
