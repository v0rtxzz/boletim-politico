/** Foto pela Wikipédia (imagens do Wikimedia Commons). Só a imagem é usada, nunca o texto. Cache de 7 dias. */
export async function fotoWiki(titulo: string | null, largura = 320): Promise<string | null> {
  if (!titulo) return null;
  try {
    const r = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`, {
      headers: { "User-Agent": "BoletimPolitico/1.0 (+https://boletim-politico.vercel.app)" },
      next: { revalidate: 7 * 86400 },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { thumbnail?: { source: string } };
    return j.thumbnail?.source?.replace(/\/\d+px-/, `/${largura}px-`) ?? null;
  } catch { return null; }
}
