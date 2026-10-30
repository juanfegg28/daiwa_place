// @ts-nocheck
// Mide cuánto sobresale cada marco por DEBAJO de la foto (rasteriza sus capas) y genera app/components/cosmetics/decoPad.ts
// Uso (desde la raíz del proyecto, con resvg instalado aparte): npx tsx tools/gen_deco_pad.ts
import fs from 'fs'
import { Resvg } from '@resvg/resvg-js'
import { AVATAR_DECOS } from '../app/components/cosmetics/_kit/avatar/index.js'
import { renderLayers } from '../app/components/cosmetics/_kit/avatar/render.js'

const out: Record<string, number> = {}
for (const d of AVATAR_DECOS) {
  let depth = 0
  for (const pal of d.palettes.slice(0, 1)) {
    const L = renderLayers(d, { paletteId: pal.id, uid: 'gp' })
    for (const layer of [L.back, L.front]) {
      if (!layer) continue
      const [vx, vy, vw, vh] = layer.match(/viewBox="([-\d. ]+)"/)![1].trim().split(/\s+/).map(Number)
      const root = layer.match(/<svg[^>]*>/)![0]
      const clean = root.replace(/ (width|height)="[^"]*"/g, '').replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}"`)
      const svg = layer.replace(root, clean)
      let r
      try { r = new Resvg(svg, { fitTo: { mode: 'original' } }).render() } catch (e) { depth = Math.max(depth, 33); continue }
      const px = r.pixels // (cada lectura de r.pixels copia el búfer: se lee una sola vez)
      for (let j = 0; j < r.height; j++) for (let i = 0; i < r.width; i++) {
        if (px[(j * r.width + i) * 4 + 3] < 60) continue
        const x = i + vx, y = j + vy
        if (y > 255 && Math.abs(x - 144) < 100) depth = Math.max(depth, y - 255)
      }
    }
  }
  const ratio = Math.ceil((depth / 222) * 100) / 100
  if (ratio > 0.03) out[d.slug] = ratio
}
const body = Object.entries(out).map(([k, v]) => `  '${k}': ${v},`).join('\n')
fs.writeFileSync('app/components/cosmetics/decoPad.ts', `// GENERADO por tools/gen_deco_pad.ts · slug → cuánto sobresale el marco por debajo de la foto (fracción del tamaño del avatar).
// v1.5.10 · sirve para reservar espacio bajo el avatar y que ningún marco tape el nombre. Ligero a propósito: no carga el kit pesado.
const OVER: Record<string, number> = {
${body}
}

export function decoOverhang(id: string | null | undefined): number {
  return id ? (OVER[id] ?? 0) : 0
}
`)
console.log(Object.keys(out).length, 'marcos con sobresalido')
