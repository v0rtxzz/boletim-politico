import { NextResponse } from "next/server";
import { gravarImportados, importarCamara, importarSenado } from "@/lib/importar-politicos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const u = new URL(req.url);
  const casa = u.searchParams.get("casa");
  const de = Number(u.searchParams.get("de")), ate = Number(u.searchParams.get("ate"));
  if (!(casa === "camara" || casa === "senado") || !(de >= 1 && ate >= de && ate - de <= 20)) {
    return NextResponse.json({ erro: "parâmetros inválidos" }, { status: 400 });
  }
  try {
    const itens = casa === "camara" ? await importarCamara(de, ate) : await importarSenado(de, ate);
    const r = await gravarImportados(casa, itens);
    return NextResponse.json({ casa, de, ate, lidos: itens.length, ...r });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 502 });
  }
}

