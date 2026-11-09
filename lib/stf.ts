import { supabase } from "./supabase";
import { fotoWiki } from "./wiki";

export type Ministro = {
  slug: string; nome: string | null; cargo: string | null; indicado_por: string | null;
  data_nascimento: string | null; data_posse: string | null; observacao: string | null;
  wiki_titulo: string | null; fonte_url: string; verificado_em: string; ordem: number;
  foto: string | null;
};

export async function listarSTF(): Promise<Ministro[]> {
  const { data, error } = await supabase.from("stf_ministros").select("*").order("ordem");
  if (error) throw error;
  const lista = (data ?? []) as Omit<Ministro, "foto">[];
  const fotos = await Promise.all(lista.map((m) => fotoWiki(m.wiki_titulo)));
  return lista.map((m, i) => ({ ...m, foto: fotos[i] }));
}

/** "12 anos e 4 meses" desde a data (AAAA-MM-DD) até hoje. */
export function tempoDesde(iso: string, hoje = new Date()) {
  const [y, m, d] = iso.split("-").map(Number);
  let meses = (hoje.getFullYear() - y) * 12 + (hoje.getMonth() + 1 - m);
  if (hoje.getDate() < d) meses--;
  const a = Math.floor(meses / 12), r = meses % 12;
  const pa = a ? `${a} ${a === 1 ? "ano" : "anos"}` : "";
  const pm = r ? `${r} ${r === 1 ? "mês" : "meses"}` : "";
  return [pa, pm].filter(Boolean).join(" e ") || "menos de 1 mês";
}

/** Data em que completa 75 anos (aposentadoria compulsória). */
export function limite75(nascimento: string) {
  const [y, m, d] = nascimento.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y + 75}`;
}
export const anosRestantes = (nascimento: string, hoje = new Date()) => {
  const [y, m, d] = nascimento.split("-").map(Number);
  return Math.max(0, (new Date(y + 75, m - 1, d).getTime() - hoje.getTime()) / (365.25 * 864e5));
};
export const dataBR = (iso: string) => iso.split("-").reverse().join("/");
