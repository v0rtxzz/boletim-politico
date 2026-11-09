import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import RegistrarSW from "@/components/RegistrarSW";

const sans = Inter({ subsets: ["latin"], variable: "--fonte-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--fonte-serif", display: "swap" });

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
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#141413" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh">
        <header className="sticky top-0 z-20 bg-[var(--fundo)]/95 backdrop-blur border-b border-[var(--linha)] pt-[env(safe-area-inset-top)]">
          <div className="mx-auto max-w-2xl px-4 h-[3.25rem] flex items-center justify-between">
            <Link href="/" className="font-serif font-semibold text-[1.05rem] tracking-tight">
              Boletim Político
            </Link>
            <nav className="flex gap-4 text-sm text-[var(--suave)]">
              <Link href="/" className="hover:text-[var(--texto)]">Hoje</Link>
              <Link href="/arquivo" className="hover:text-[var(--texto)]">Arquivo</Link>
              <Link href="/glossario" className="hover:text-[var(--texto)]">Glossário</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">{children}</main>
        <RegistrarSW />
      </body>
    </html>
  );
}
