import { sendNotification, setVapidDetails, type PushSubscription } from "web-push";

export type Aviso = { title: string; body: string; url: string; tag?: string };

let configurado = false;
function configurar() {
  if (configurado) return;
  setVapidDetails(
    "https://boletim-politico.vercel.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configurado = true;
}

export const pushConfigurado = () => Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

/** Envia um aviso. Retorna "expirada" quando o aparelho cancelou a inscrição (deve ser removida). */
export async function enviarPush(sub: PushSubscription, aviso: Aviso): Promise<"ok" | "expirada" | "erro"> {
  configurar();
  try {
    await sendNotification(sub, JSON.stringify(aviso), { TTL: 60 * 60 * 12, urgency: "high" });
    return "ok";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "expirada";
    console.error("push falhou", status, (e as Error).message);
    return "erro";
  }
}

const SERVICOS = /^https:\/\/(web\.push\.apple\.com|fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com)\//;
export function inscricaoValida(s: unknown): s is PushSubscription {
  const x = s as PushSubscription;
  return typeof x?.endpoint === "string" && SERVICOS.test(x.endpoint) && typeof x.keys?.p256dh === "string" && typeof x.keys?.auth === "string";
}
