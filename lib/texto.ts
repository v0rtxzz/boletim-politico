export function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function semAcento(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** "1. RESUMO DO DIA" -> { numero: "1", nome: "Resumo do dia" } */
export function tituloSecao(bruto: string) {
  const limpo = bruto.replace(/[*_`]/g, "").trim();
  const m = limpo.match(/^(\d+)\.\s*(.+)$/);
  const nome = (m ? m[2] : limpo).trim();
  const ehCaixaAlta = nome === nome.toUpperCase();
  const normal = ehCaixaAlta
    ? nome.charAt(0) + nome.slice(1).toLowerCase()
    : nome;
  return { numero: m?.[1] ?? null, nome: normal, id: slug(limpo) };
}
