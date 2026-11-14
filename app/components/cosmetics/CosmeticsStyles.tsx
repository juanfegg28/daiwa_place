// Se monta UNA vez en el layout raíz (app/layout.tsx). Es un componente de SERVIDOR a propósito.
// v1.10.0 · el CSS de los diseños (keyframes de decoraciones, tarjetas y fondos, ≈102 KB) ya NO va dentro del HTML de cada página:
// es un archivo estático con caché de un año (app/cosmetics.css/route.ts) que se pide SIN BLOQUEAR el pintado (hoja «print» que pasa a
// «all» al cargar). Medido en un navegador real con red móvil lenta: como <link> normal retrasaba el primer pintado de /login más de 1 s,
// porque la página tenía que esperar un CSS que ni siquiera usa. Las decoraciones solo aparecen después de cargar JavaScript y datos,
// cuando este archivo (pequeño comprimido) ya llegó. Solo incluye lo lanzado.
import { COSMETICS_CSS_HREF } from '../../lib/cosmeticsCss'

const LOADER = `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href=${JSON.stringify(COSMETICS_CSS_HREF)};l.media='print';l.onload=function(){l.media='all'};document.head.appendChild(l)})();`

export default function CosmeticsStyles() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: LOADER }} />
      <noscript>
        <link rel="stylesheet" href={COSMETICS_CSS_HREF} />
      </noscript>
    </>
  )
}
