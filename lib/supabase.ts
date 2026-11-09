import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente somente-leitura (chave pública + RLS). A escrita é feita pelo agente
// diário com privilégios de serviço, nunca pelo site.
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export type Fonte = { titulo: string; url: string };

export type Boletim = {
  id: number;
  data: string;
  titulo_destaque: string;
  conteudo_md: string;
  fontes: Fonte[];
  criado_em: string;
};

export type Termo = {
  id: number;
  termo: string;
  definicao: string;
  exemplo: string | null;
  boletins: { data: string } | null;
};

export async function getUltimoBoletim(): Promise<Boletim | null> {
  const { data, error } = await supabase
    .from("boletins")
    .select("*")
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Boletim | null;
}

export async function getBoletimPorData(dia: string): Promise<Boletim | null> {
  const { data, error } = await supabase
    .from("boletins")
    .select("*")
    .eq("data", dia)
    .maybeSingle();
  if (error) throw error;
  return data as Boletim | null;
}

export async function listarBoletins(busca?: string) {
  let q = supabase
    .from("boletins")
    .select("id, data, titulo_destaque")
    .order("data", { ascending: false })
    .limit(400);
  const termo = busca?.trim().replace(/[%,()*]/g, " ");
  if (termo) {
    q = q.or(`titulo_destaque.ilike.%${termo}%,conteudo_md.ilike.%${termo}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Pick<Boletim, "id" | "data" | "titulo_destaque">[];
}

export async function listarGlossario(): Promise<Termo[]> {
  const { data, error } = await supabase
    .from("glossario")
    .select("id, termo, definicao, exemplo, boletins(data)")
    .order("termo", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Termo[];
}

const TZ = "America/Sao_Paulo";

export function formatarData(iso: string, longo = true) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return dt.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    weekday: longo ? "long" : undefined,
    day: "numeric",
    month: longo ? "long" : "short",
    year: "numeric",
  });
}

export function formatarHora(ts: string) {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}
