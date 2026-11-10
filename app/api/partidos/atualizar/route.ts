import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { gravarImportados, importarCamara } from "@/lib/importar-politicos";
import { FONTE_CAMARA, FONTE_SENADO, FONTE_TSE, PAGINA_TSE, buscarBancadaCamara, buscarBancadaSenado, buscarRegistroTSE } from "@/lib/partidos-oficial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const tentar = async <T,>(f: () => Promise<T>) => {
  try { return { ok: true as const, v: await f() }; } catch (e) { return { ok: false as const, erro: (e as Error).message }; }
};

/**
 * Atualiza registro e bancadas dos partidos com fontes oficiais.
 * - Agendado (vercel.json) com Authorization: Bearer CRON_SECRET → grava no banco.
 * - ?simular=1 → só lê as fontes e mostra o resultado (não grava). Aceita &nomes=Fulano,Beltrano
 *   para conferir a filiação atual de parlamentares nas listas oficiais.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const simular = url.searchParams.has("simular");
  const autorizado = !!process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!simular && !autorizado) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });

  const pTse = tentar(buscarRegistroTSE);
  const [camara, senado] = await Promise.all([tentar(buscarBancadaCamara), tentar(buscarBancadaSenado)]);

  // Parlamentares em exercício (com foto oficial): gravados já, sem esperar o arquivo do TSE (lento).
  const politicos: Record<string, unknown> = {};
  if (!simular && autorizado) {
    for (const [casa, res, fonte] of [["camara", camara, FONTE_CAMARA], ["senado", senado, FONTE_SENADO]] as const) {
      if (!res.ok) continue;
      const { data: n, error: e } = await supabase.rpc("atualizar_politicos", { p_segredo: process.env.CRON_SECRET, p_casa: casa, p_fonte: fonte, p_lista: res.v.politicos });
      politicos[casa] = e ? `erro: ${e.message}` : n;
      await supabase.rpc("importar_mandatos_partido", { p_segredo: process.env.CRON_SECRET, p_lista: res.v.politicos.map((x) => ({
        id: x.id, casa, legislatura: 57, periodo: "2023–2027", partido_sigla: x.partido_sigla, partido_slug: x.partido_slug, uf: x.uf })) });
    }
  }
  const tse = await pTse;

  // Diagnóstico: consulta o portal de dados abertos do TSE (API pública CKAN) atrás do cadastro de partidos.
  if (url.searchParams.has("sondar")) {
    const q = url.searchParams.get("sondar") || "partidos";
    try {
      const r = await fetch(`https://dadosabertos.tse.jus.br/api/3/action/package_search?q=${encodeURIComponent(q)}&rows=20`,
        { headers: { "User-Agent": "BoletimPolitico/1.0 (+https://boletim-politico.vercel.app)", Accept: "application/json" }, cache: "no-store" });
      const j = await r.json().catch(() => null) as { result?: { results?: { name: string; title: string; resources?: { name: string; url: string; format: string }[] }[] } } | null;
      return NextResponse.json({
        status: r.status,
        datasets: j?.result?.results?.map((d) => ({ name: d.name, title: d.title, recursos: d.resources?.slice(0, 8).map((x) => ({ nome: x.name, url: x.url, formato: x.format })) })),
      });
    } catch (e) { return NextResponse.json({ erro: (e as Error).message }); }
  }

  if (simular) {
    const procurados = (url.searchParams.get("nomes") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const sa = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const achar = (lista?: { nome: string; sigla: string }[]) =>
      procurados.map((n) => ({ procurado: n, achados: (lista ?? []).filter((x) => sa(x.nome).includes(sa(n))) }));
    return NextResponse.json({
      tse: tse.ok ? { total: tse.v.partidos.length, partidos: tse.v.partidos, diagnostico: tse.v.diagnostico } : tse,
      camara: camara.ok ? { total: camara.v.total, bancadas: camara.v.bancadas, filiacoes: achar(camara.v.nomes) } : camara,
      senado: senado.ok ? { total: senado.v.total, bancadas: senado.v.bancadas, filiacoes: achar(senado.v.nomes) } : senado,
    });
  }

  const { data, error } = await supabase.rpc("atualizar_partidos", {
    p_segredo: process.env.CRON_SECRET,
    p_fonte_registro: PAGINA_TSE,
    p_registro: tse.ok && tse.v.partidos.length >= 15 ? tse.v.partidos : null,
    p_camara: camara.ok ? { fonte: FONTE_CAMARA, bancadas: camara.v.bancadas } : null,
    p_senado: senado.ok ? { fonte: FONTE_SENADO, bancadas: senado.v.bancadas } : null,
  });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  // Importação gradual de ex-deputados (da legislatura mais recente para a mais antiga), dentro do tempo restante.
  const importacao: string[] = [];
  const inicio = Date.now();
  while (Date.now() - inicio < 120_000) {
    const { data: prox } = await supabase.rpc("progresso_importacao", { p_segredo: process.env.CRON_SECRET });
    const n = Number(prox);
    if (!n || n < 1) break;
    try {
      const r = await gravarImportados("camara", await importarCamara(n, n));
      importacao.push(`${n}ª: ${r.pessoas}`);
      await supabase.rpc("progresso_importacao", { p_segredo: process.env.CRON_SECRET, p_valor: n - 1 });
    } catch (e) { importacao.push(`${n}ª: ${(e as Error).message.slice(0, 80)}`); break; }
  }
  // Candidaturas ganham a foto oficial de quem também foi parlamentar (inclusive ex-deputados recém-importados).
  await supabase.rpc("casar_fotos_candidaturas", { p_segredo: process.env.CRON_SECRET });
  const falhas = { tse: tse.ok ? null : tse.erro, camara: camara.ok ? null : camara.erro, senado: senado.ok ? null : senado.erro };
  console.log("partidos atualizados", data, falhas);
  return NextResponse.json({ resultado: data, politicos, importacao, falhas });
}
