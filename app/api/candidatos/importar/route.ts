import { NextResponse } from "next/server";
import { gravarCandidaturas, lerCandidaturas } from "@/lib/importar-tse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** /api/candidatos/importar?ano=2022  (Authorization: Bearer CRON_SECRET). &simular=1 só lê e mostra. */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const u = new URL(req.url);
  const ano = Number(u.searchParams.get("ano"));
  if (!(ano >= 1994 && ano <= 2030 && ano % 4 === 2)) return NextResponse.json({ erro: "ano de eleição geral inválido" }, { status: 400 });
  try {
    const { candidaturas, diag } = await lerCandidaturas(ano);
    if (u.searchParams.has("simular")) {
      return NextResponse.json({ ano, total: candidaturas.length, diag, amostra: candidaturas.filter((c) => c.cargo === "PRESIDENTE").slice(0, 20) });
    }
    const gravados = await gravarCandidaturas(candidaturas);
    const porCargo = candidaturas.reduce<Record<string, number>>((a, c) => { a[c.cargo] = (a[c.cargo] ?? 0) + 1; return a; }, {});
    return NextResponse.json({ ano, gravados, porCargo });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 502 });
  }
}
