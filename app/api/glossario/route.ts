import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Consulta rápida ao glossário (usada pela seleção de texto). Correspondência exata primeiro, depois parcial. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().replace(/[%,()*]/g, " ").slice(0, 60);
  if (q.length < 2) return NextResponse.json({ termos: [] });
  const { data } = await supabase.from("glossario").select("termo, definicao, exemplo").or(`termo.ilike.%${q}%,definicao.ilike.%${q}%`).limit(6);
  const alvo = q.toLowerCase();
  const termos = (data ?? []).sort((a, b) => {
    const pa = a.termo.toLowerCase().startsWith(alvo) ? 0 : a.termo.toLowerCase().includes(alvo) ? 1 : 2;
    const pb = b.termo.toLowerCase().startsWith(alvo) ? 0 : b.termo.toLowerCase().includes(alvo) ? 1 : 2;
    return pa - pb;
  });
  return NextResponse.json({ termos }, { headers: { "Cache-Control": "public, max-age=300" } });
}
