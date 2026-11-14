import type { Metadata, Viewport } from "next";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "./lib/theme";
import MusicProvider from './components/MusicProvider'
import CosmeticsStyles from './components/cosmetics/CosmeticsStyles'
import PwaRegister from './components/PwaRegister'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from './lib/og'
import { geistSans, geistMono, cinzel } from './lib/fonts'

// v1.10.0 · Geist, Geist Mono y Cinzel ahora se alojan en el propio proyecto con next/font/local (ver app/lib/fonts.ts y app/fonts/LICENCIAS.md):
// sin pedir nada a Google ni al compilar ni en el navegador. Se conserva la corrección de la v1.9.0 (Cinzel NO usa next/font/google).

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0c0c0f',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  applicationName: SITE_NAME,
  description: SITE_DESCRIPTION,
  // v1.5.11 · al «Añadir a pantalla de inicio» en iPhone abre como app (sin barra de Safari)
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'black-translucent' },
  // Tarjeta de enlace por defecto (Discord, WhatsApp, redes): título, descripción y la luna
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    locale: 'es_ES',
  },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION, images: [DEFAULT_OG_IMAGE] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
    >
      <head>
        {/* Aplica el modo claro/oscuro y el acento guardados ANTES de pintar, para no parpadear */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* v1.4.0: animaciones de decoraciones, tarjetas y fondos de la tienda (solo lo lanzado) */}
        <CosmeticsStyles />
      </head>
      <body className="min-h-full flex flex-col bg-ink-950 text-neutral-100" suppressHydrationWarning>
        <PwaRegister />
        <MusicProvider>{children}</MusicProvider>
      </body>
    </html>
  );
}
