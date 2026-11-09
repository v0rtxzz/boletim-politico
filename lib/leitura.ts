/**
 * Progresso de leitura, guardado só no aparelho (localStorage).
 * bloco = trecho em que você estava; max = trecho mais avançado que você alcançou.
 */
export type Leitura = { data: string; titulo: string; bloco: number; max: number; total: number; secao: string; quando: number };

const PREFIXO = "leitura:";
export const EVENTO = "leitura-atualizada";

export function lerLeitura(data: string): Leitura | null {
  try {
    const v = JSON.parse(localStorage.getItem(PREFIXO + data) ?? "null");
    return v && typeof v.bloco === "number" ? { max: v.bloco, total: 0, secao: "", titulo: "", ...v, data } : null;
  } catch { return null; }
}

export function salvarLeitura(l: Leitura) {
  try {
    localStorage.setItem(PREFIXO + l.data, JSON.stringify(l));
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: l }));
  } catch {}
}

export function apagarLeitura(data: string) {
  try {
    localStorage.removeItem(PREFIXO + data);
    window.dispatchEvent(new CustomEvent(EVENTO));
  } catch {}
}

export function listarLeituras(): Leitura[] {
  const out: Leitura[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(PREFIXO)) continue;
      const l = lerLeitura(k.slice(PREFIXO.length));
      if (l) out.push(l);
    }
  } catch {}
  return out.sort((a, b) => b.quando - a.quando);
}

/** Fração lida (0–1), pelo ponto mais avançado alcançado. */
export const fracao = (l: Leitura) => (l.total > 1 ? Math.min(1, (l.max + 1) / l.total) : 0);
export const terminado = (l: Leitura) => fracao(l) >= 0.95;

export function haQuanto(ms: number) {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}
