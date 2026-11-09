// Service worker do Boletim:
// - páginas: rede primeiro (com limite de espera), cópia salva para leitura offline;
// - arquivos estáticos: cache primeiro (têm nome único por versão);
// - pré-download do boletim do dia, arquivo e glossário quando o app abre;
// - notificações push.
const CACHE = "boletim-v5";
const ESPERA_REDE_MS = 4000;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

function comLimite(promessa, ms) {
  return new Promise((ok, erro) => {
    const t = setTimeout(() => erro(new Error("tempo esgotado")), ms);
    promessa.then((r) => { clearTimeout(t); ok(r); }, (e) => { clearTimeout(t); erro(e); });
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  // Dados de navegação interna do Next (RSC): sem cache; se falhar, o Next recarrega a página inteira.
  if (url.searchParams.has("_rsc") || req.headers.get("RSC") === "1") return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.match(req).then((r) => r || fetch(req).then((res) => {
        if (res.ok) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); }
        return res;
      }))
    );
    return;
  }

  e.respondWith(
    comLimite(fetch(req), req.mode === "navigate" ? ESPERA_REDE_MS : 10000)
      .then((res) => {
        if (res.ok) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: req.mode === "navigate" })
          .then((r) => r || (req.mode === "navigate" ? caches.match("/") : undefined))
          .then((r) => r || new Response("Sem conexão e sem cópia salva desta página.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }))
      )
  );
});

// Pré-download: salva as páginas pedidas e também os arquivos (JS/CSS/fontes) que cada uma usa,
// para que funcionem offline mesmo sem nunca terem sido abertas antes.
async function salvarPagina(cache, u) {
  try {
    const res = await fetch(u, { cache: "no-store" });
    if (!res.ok) return;
    const tipo = res.headers.get("content-type") || "";
    await cache.put(u, res.clone());
    if (!tipo.includes("text/html")) return;
    const html = await res.text();
    const estaticos = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])];
    await Promise.all(estaticos.map(async (a) => {
      if (await cache.match(a)) return;
      const r = await fetch(a).catch(() => null);
      if (r && r.ok) await cache.put(a, r);
    }));
  } catch {}
}

self.addEventListener("message", (e) => {
  if (!e.data || e.data.tipo !== "pre-salvar") return;
  const urls = [...new Set(e.data.urls || [])].filter((u) => typeof u === "string" && u.startsWith("/"));
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(urls.map((u) => salvarPagina(c, u)))));
});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  const url = d.url || "/";
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || "Boletim Político", {
      body: d.body || "O boletim do dia está disponível.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: d.tag || "boletim",
      data: { url },
    }),
    // Já deixa o boletim novo salvo para leitura offline.
    caches.open(CACHE).then((c) => Promise.all([url, "/"].map((u) => salvarPagina(c, u)))),
  ]));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const destino = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) {
        if ("focus" in j) { j.navigate(destino).catch(() => {}); return j.focus(); }
      }
      return self.clients.openWindow(destino);
    })
  );
});
