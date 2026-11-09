import { createHash } from "node:crypto";
import { head, put } from "@vercel/blob";
import * as lame from "@breezystack/lamejs";
import type { Trecho } from "./blocos";

/**
 * Áudio neural do boletim: cada trecho é sintetizado separadamente (OpenAI TTS, PCM 24 kHz),
 * concatenado com pausas naturais e codificado em MP3. O manifesto guarda o instante
 * em que cada trecho começa, para o destaque e a navegação no player.
 */

const MODELO = process.env.TTS_MODELO ?? "gpt-4o-mini-tts";
const VOZ = process.env.TTS_VOZ ?? "coral";
const INSTRUCOES =
  "Fale em português do Brasil, com sotaque brasileiro neutro. Tom de apresentador de rádio jornalístico: " +
  "calmo, claro, sério e imparcial, com ritmo natural e entonação fluida. Leia siglas de forma natural. " +
  "Não dramatize nem opine.";
const TAXA = 24000;
// O pacote expõe o codificador de formas diferentes conforme o empacotador (ESM, CJS ou global).
type Codificador = { encodeBuffer(b: Int16Array): Int8Array | Uint8Array; flush(): Int8Array | Uint8Array };
const Mp3Encoder: new (canais: number, taxa: number, kbps: number) => Codificador =
  (lame as unknown as { Mp3Encoder?: never }).Mp3Encoder ??
  (lame as unknown as { default?: { Mp3Encoder: never } }).default?.Mp3Encoder ??
  (globalThis as unknown as { lamejs: { Mp3Encoder: never } }).lamejs?.Mp3Encoder;
const VERSAO = 1;

export type Manifesto = { url: string; offsets: number[]; duracao: number; voz: string; criado: string };

export const ttsConfigurado = () => Boolean(process.env.OPENAI_API_KEY && process.env.BLOB_READ_WRITE_TOKEN);

export function chaveAudio(data: string, trechos: Trecho[]) {
  const h = createHash("sha256").update(JSON.stringify({ VERSAO, MODELO, VOZ, t: trechos.map((t) => t.texto) })).digest("hex").slice(0, 16);
  return `audio/${data}/${h}`;
}

export async function obterManifesto(data: string, trechos: Trecho[]): Promise<Manifesto | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const meta = await head(`${chaveAudio(data, trechos)}.json`);
    const r = await fetch(meta.url, { cache: "no-store" });
    return r.ok ? ((await r.json()) as Manifesto) : null;
  } catch {
    return null;
  }
}

function dividirTexto(t: string, max = 3500): string[] {
  if (t.length <= max) return [t];
  const frases = t.match(/[^.!?]+[.!?]*\s*/g) ?? [t];
  const out: string[] = [];
  let atual = "";
  for (const f of frases) {
    if ((atual + f).length > max && atual) { out.push(atual); atual = ""; }
    atual += f;
  }
  if (atual) out.push(atual);
  return out;
}

export async function sintetizar(texto: string): Promise<Int16Array> {
  const partes: Int16Array[] = [];
  for (const pedaco of dividirTexto(texto)) {
    let ultimoErro = "";
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const r = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODELO, voice: VOZ, input: pedaco, instructions: INSTRUCOES, response_format: "pcm" }),
      });
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        partes.push(new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 2)));
        ultimoErro = "";
        break;
      }
      ultimoErro = `${r.status} ${(await r.text()).slice(0, 200)}`;
      if (r.status === 401 || r.status === 400) break;
      await new Promise((ok) => setTimeout(ok, 1500 * (tentativa + 1)));
    }
    if (ultimoErro) throw new Error(`OpenAI TTS falhou: ${ultimoErro}`);
  }
  const total = partes.reduce((n, p) => n + p.length, 0);
  const junto = new Int16Array(total);
  let pos = 0;
  for (const p of partes) { junto.set(p, pos); pos += p.length; }
  return junto;
}

async function emParalelo<T, R>(itens: T[], limite: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const res: R[] = new Array(itens.length);
  let prox = 0;
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, async () => {
    while (prox < itens.length) { const i = prox++; res[i] = await fn(itens[i], i); }
  }));
  return res;
}

/** Junta os trechos com pausas, codifica em MP3 e devolve o início (s) de cada trecho. */
export function montarAudio(trechos: Pick<Trecho, "pausaAntes">[], pcms: Int16Array[]) {
  const offsets: number[] = [];
  const pedacos: Int16Array[] = [];
  let amostras = 0;
  trechos.forEach((t, i) => {
    const pausa = new Int16Array(Math.round(t.pausaAntes * TAXA));
    pedacos.push(pausa);
    amostras += pausa.length;
    offsets.push(+(amostras / TAXA).toFixed(3));
    pedacos.push(pcms[i]);
    amostras += pcms[i].length;
  });
  pedacos.push(new Int16Array(TAXA)); // 1 s de silêncio no fim
  amostras += TAXA;

  const enc = new Mp3Encoder(1, TAXA, 64);
  const saida: Uint8Array[] = [];
  const BLOCO = 1152 * 20;
  for (const p of pedacos) {
    for (let i = 0; i < p.length; i += BLOCO) {
      const mp3 = enc.encodeBuffer(p.subarray(i, i + BLOCO));
      if (mp3.length) saida.push(new Uint8Array(mp3));
    }
  }
  const fim = enc.flush();
  if (fim.length) saida.push(new Uint8Array(fim));
  const mp3 = Buffer.concat(saida);

  return { mp3, offsets, duracao: +(amostras / TAXA).toFixed(2) };
}

export async function gerarAudio(data: string, trechos: Trecho[]): Promise<Manifesto> {
  const existente = await obterManifesto(data, trechos);
  if (existente) return existente;

  const pcms = await emParalelo(trechos, 6, (t) => sintetizar(t.texto));

  const { mp3, offsets, duracao } = montarAudio(trechos, pcms);

  const base = chaveAudio(data, trechos);
  const arquivo = await put(`${base}.mp3`, mp3, {
    access: "public", contentType: "audio/mpeg", addRandomSuffix: false, allowOverwrite: true,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  const manifesto: Manifesto = { url: arquivo.url, offsets, duracao, voz: `${MODELO}/${VOZ}`, criado: new Date().toISOString() };
  await put(`${base}.json`, JSON.stringify(manifesto), {
    access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60,
  });
  return manifesto;
}
