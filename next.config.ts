import type { NextConfig } from "next";

// Dónde viven las fotos: el almacenamiento de tu proyecto de Supabase (sale de la misma variable de entorno
// que ya usa la página) y, como respaldo, cualquier proyecto *.supabase.co.
function supabaseHost(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
}
const host = supabaseHost();

const nextConfig: NextConfig = {
  images: {
    // Si el plan gratis de Vercel agota las optimizaciones del mes, basta con crear en Vercel la variable
    // NEXT_PUBLIC_UNOPTIMIZED_IMAGES=1 y volver a desplegar: las fotos siguen cargando perezosas y con su
    // tamaño reservado, pero sin pasar por el optimizador.
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === "1",
    // Pocos tamaños a propósito: cada tamaño distinto cuenta como una optimización aparte.
    deviceSizes: [480, 640, 828, 1080],
    imageSizes: [32, 48, 64, 96, 128, 256],
    // Una foto optimizada se guarda 30 días en caché (las fotos de Supabase no cambian de dirección).
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      ...(host
        ? [{ protocol: "https" as const, hostname: host, pathname: "/storage/v1/object/public/**" }]
        : []),
      { protocol: "https" as const, hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
