import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { enviarPush, pushConfigurado } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Chamado pelo gatilho do Supabase quando um boletim novo é gravado. */
export async function POST(req: Request) {
  const segredo = process.env.PUSH_SECRET;
  if (!segredo || req.headers.get("x-segredo") !== segredo) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  if (!pushConfigurado()) return NextResponse.json({ erro: "push não configurado" }, { status: 503 });

  const { data, titulo } = (await req.json().catch(() => ({}))) as { data?: string; titulo?: string };
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return NextResponse.json({ erro: "data inválida" }, { status: 400 });
  const [, m, d] = data.split("-");

  const { data: inscricoes, error } = await supabase.rpc("listar_push", { p_segredo: segredo });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const aviso = { title: `Boletim de ${d}/${m}`, body: titulo ?? "O boletim político do dia está disponível.", url: `/boletim/${data}`, tag: `boletim-${data}` };
  const lista = (inscricoes ?? []) as { endpoint: string; p256dh: string; auth: string }[];
  const resultados = await Promise.all(lista.map(async (i) => {
    const r = await enviarPush({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, aviso);
    if (r === "expirada") await supabase.rpc("remover_push", { p_endpoint: i.endpoint });
    return r;
  }));
  const resumo = { enviados: resultados.filter((r) => r === "ok").length, expirados: resultados.filter((r) => r === "expirada").length, erros: resultados.filter((r) => r === "erro").length };
  console.log("push boletim", data, resumo);
  return NextResponse.json(resumo);
}
