import type { Metadata, Viewport } from "next";
import { Newsreader, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import RegistrarSW from "@/components/RegistrarSW";
import { BarraInferior, Topo } from "@/components/Navegacao";

const texto = Newsreader({ subsets: ["latin"], variable: "--fonte-texto", axes: ["opsz"], style: ["normal", "italic"], display: "swap" });
const ui = Schibsted_Grotesk({ subsets: ["latin"], variable: "--fonte-ui", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Boletim Político Diário", template: "%s · Boletim Político" },
  description: "Boletim político diário: Brasil e mundo, com fontes verificáveis.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Boletim", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1114" },
  ],
};

// Aplica o tema salvo antes da pintura, para não piscar.
const scriptTema = `try{var t=localStorage.getItem("tema");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${texto.variable} ${ui.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="min-h-dvh">
        <Topo />
        <main className="mx-auto max-w-[42rem] px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-16">{children}</main>
        <BarraInferior />
        <RegistrarSW />
      </body>
    </html>
  );
}
