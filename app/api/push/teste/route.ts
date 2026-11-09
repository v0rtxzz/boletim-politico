import { NextResponse } from "next/server";
import { enviarPush, inscricaoValida, pushConfigurado } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Envia um aviso de confirmação só para o aparelho que acabou de se inscrever. */
export async function POST(req: Request) {
  if (!pushConfigurado()) return NextResponse.json({ erro: "push não configurado" }, { status: 503 });
  const sub = await req.json().catch(() => null);
  if (!inscricaoValida(sub)) return NextResponse.json({ erro: "inscrição inválida" }, { status: 400 });
  const r = await enviarPush(sub, {
    title: "Notificações ativadas",
    body: "Você vai receber um aviso aqui assim que cada boletim for publicado.",
    url: "/",
    tag: "teste",
  });
  return NextResponse.json({ resultado: r }, { status: r === "ok" ? 200 : 502 });
}
