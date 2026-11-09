import { NextResponse } from "next/server";
import { getBoletimPorData } from "@/lib/supabase";
import { dividirBoletim } from "@/lib/blocos";
import { gerarAudio, obterManifesto, ttsConfigurado } from "@/lib/audio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Ctx = { params: Promise<{ data: string }> };

async function carregar(data: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const b = await getBoletimPorData(data);
  return b ? dividirBoletim(b.conteudo_md, b.titulo_destaque).trechos : null;
}

/** Diz se já existe áudio neural para o boletim (e onde), sem gerar nada. */
export async function GET(_: Request, { params }: Ctx) {
  const { data } = await params;
  const trechos = await carregar(data);
  if (!trechos) return NextResponse.json({ status: "inexistente" }, { status: 404 });
  const m = await obterManifesto(data, trechos);
  if (m) return NextResponse.json({ status: "pronto", ...m, trechos: trechos.length });
  return NextResponse.json({ status: ttsConfigurado() ? "gerar" : "indisponivel" });
}

/** Gera o áudio neural (só para boletins existentes; o resultado fica em cache). */
export async function POST(_: Request, { params }: Ctx) {
  const { data } = await params;
  if (!ttsConfigurado()) return NextResponse.json({ status: "indisponivel" }, { status: 503 });
  const trechos = await carregar(data);
  if (!trechos) return NextResponse.json({ status: "inexistente" }, { status: 404 });
  try {
    const m = await gerarAudio(data, trechos);
    return NextResponse.json({ status: "pronto", ...m, trechos: trechos.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "erro", erro: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
