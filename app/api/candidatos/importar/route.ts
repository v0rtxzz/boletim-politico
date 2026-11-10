import { NextResponse } from "next/server";
import { gravarCandidaturas, gravarVotos, lerCandidaturas, lerVotos } from "@/lib/importar-tse";
import { supabase } from "@/lib/supabase";

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
  if (u.searchParams.has("corte")) {
    const { data, error } = await supabase.rpc("aplicar_corte_candidaturas", { p_segredo: process.env.CRON_SECRET });
    return error ? NextResponse.json({ erro: error.message }, { status: 500 }) : NextResponse.json({ corte: data });
  }
  if (!(ano >= 1994 && ano <= 2030 && ano % 2 === 0)) return NextResponse.json({ erro: "ano de eleição inválido" }, { status: 400 });
  try {
    if (u.searchParams.has("votos")) {
      const ufs = u.searchParams.get("ufs")?.toUpperCase().split(",").filter(Boolean);
      const votos = await lerVotos(ano, ufs?.length ? ufs : undefined);
      return NextResponse.json({ ano, candidaturas_com_votos: votos.length, atualizados: await gravarVotos(ano, votos) });
    }
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
