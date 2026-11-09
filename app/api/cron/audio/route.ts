import { NextResponse } from "next/server";
import { getUltimoBoletim } from "@/lib/supabase";
import { dividirBoletim } from "@/lib/blocos";
import { gerarAudio, ttsConfigurado } from "@/lib/audio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Agendado (vercel.json): deixa o áudio do boletim do dia pronto antes de você abrir. */
export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  if (!ttsConfigurado()) return NextResponse.json({ status: "indisponivel" });
  const b = await getUltimoBoletim();
  if (!b) return NextResponse.json({ status: "sem boletim" });
  const m = await gerarAudio(b.data, dividirBoletim(b.conteudo_md, b.titulo_destaque).trechos);
  return NextResponse.json({ status: "pronto", data: b.data, duracao: m.duracao });
}
