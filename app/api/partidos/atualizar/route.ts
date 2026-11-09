import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { FONTE_CAMARA, FONTE_SENADO, FONTE_TSE, buscarBancadaCamara, buscarBancadaSenado, buscarRegistroTSE } from "@/lib/partidos-oficial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

  const [tse, camara, senado] = await Promise.all([
    tentar(buscarRegistroTSE), tentar(buscarBancadaCamara), tentar(buscarBancadaSenado),
  ]);

  if (simular) {
    const procurados = (url.searchParams.get("nomes") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const achar = (lista?: { nome: string; sigla: string }[]) =>
      procurados.map((n) => ({ procurado: n, achados: (lista ?? []).filter((x) => x.nome.toLowerCase().includes(n)) }));
    return NextResponse.json({
      tse: tse.ok ? { total: tse.v.partidos.length, partidos: tse.v.partidos, diagnostico: tse.v.diagnostico } : tse,
      camara: camara.ok ? { total: camara.v.total, bancadas: camara.v.bancadas, filiacoes: achar(camara.v.nomes) } : camara,
      senado: senado.ok ? { total: senado.v.total, bancadas: senado.v.bancadas, filiacoes: achar(senado.v.nomes) } : senado,
    });
  }

  const { data, error } = await supabase.rpc("atualizar_partidos", {
    p_segredo: process.env.CRON_SECRET,
    p_fonte_registro: FONTE_TSE,
    p_registro: tse.ok && tse.v.partidos.length >= 15 ? tse.v.partidos : null,
    p_camara: camara.ok ? { fonte: FONTE_CAMARA, bancadas: camara.v.bancadas } : null,
    p_senado: senado.ok ? { fonte: FONTE_SENADO, bancadas: senado.v.bancadas } : null,
  });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  const falhas = { tse: tse.ok ? null : tse.erro, camara: camara.ok ? null : camara.erro, senado: senado.ok ? null : senado.erro };
  console.log("partidos atualizados", data, falhas);
  return NextResponse.json({ resultado: data, falhas });
}
