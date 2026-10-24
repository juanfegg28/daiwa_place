// Se monta UNA vez en el layout raíz (app/layout.tsx). Es un componente de SERVIDOR a propósito:
// el CSS de los diseños (keyframes de decoraciones, tarjetas y fondos, ≈41 KB) viaja en el HTML y NO dentro del JavaScript del navegador.
// Solo incluye lo lanzado: el CSS de la 1.5.0 no se envía a nadie.
import { RELEASED_CSS } from './kit'

export default function CosmeticsStyles() {
  return <style data-cos="base" dangerouslySetInnerHTML={{ __html: RELEASED_CSS }} />
}
