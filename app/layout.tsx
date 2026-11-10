import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "./lib/theme";
import MusicProvider from './components/MusicProvider'
import CosmeticsStyles from './components/cosmetics/CosmeticsStyles'
import PwaRegister from './components/PwaRegister'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from './lib/og'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// v1.9.0 · arreglo de despliegue: Cinzel YA NO se pide con next/font/google. Con Turbopack (Next 16) el build de Vercel
// fallaba con «next/font/google queries have exactly one entry» / «Can't resolve @vercel/turbopack-next/internal/font/google/font»
// al procesar los archivos de esta fuente. Ahora se carga con un <link> a Google Fonts (ver <head>, mismos pesos 500/600/700)
// y la variable --font-cinzel se define en globals.css (es la misma que usaban `font-display`, las historias y los stickers).
const CINZEL_CSS = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&display=swap";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Aplica el modo claro/oscuro y el acento guardados ANTES de pintar, para no parpadear */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Cinzel (títulos): se carga desde Google Fonts en el navegador, no durante el build */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={CINZEL_CSS} />
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
