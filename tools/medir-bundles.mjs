// v1.10.0 · Mide el JavaScript que descarga cada ruta (lo que Next 16 ya no imprime al compilar).
// Uso:  npm run build   →   node tools/medir-bundles.mjs [salida.json]
// Lee .next/diagnostics/route-bundle-stats.json (lo genera `next build`) y calcula, por ruta, el tamaño de los
// chunks JS de la primera carga: sin comprimir, gzip y brotli (lo que viaja de verdad por la red en Vercel).
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'

const root = process.cwd()
const statsPath = path.join(root, '.next', 'diagnostics', 'route-bundle-stats.json')
if (!fs.existsSync(statsPath)) {
  console.error('No encuentro .next/diagnostics/route-bundle-stats.json. Ejecuta primero `npm run build`.')
  process.exit(1)
}
const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'))
const cache = new Map()
function sizes(rel) {
  if (cache.has(rel)) return cache.get(rel)
  const buf = fs.readFileSync(path.join(root, rel))
  const r = {
    raw: buf.length,
    gzip: zlib.gzipSync(buf, { level: 9 }).length,
    br: zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
  }
  cache.set(rel, r)
  return r
}
const rows = stats.map((r) => {
  const t = { raw: 0, gzip: 0, br: 0 }
  for (const c of r.firstLoadChunkPaths) {
    if (!c.endsWith('.js')) continue
    const s = sizes(c)
    t.raw += s.raw; t.gzip += s.gzip; t.br += s.br
  }
  return { route: r.route, chunks: r.firstLoadChunkPaths.filter((c) => c.endsWith('.js')).length, ...t }
}).sort((a, b) => b.raw - a.raw)

// JS compartido por TODAS las rutas (intersección de chunks) = el costo mínimo de abrir cualquier página
const sets = stats.map((r) => new Set(r.firstLoadChunkPaths.filter((c) => c.endsWith('.js'))))
const shared = [...sets[0]].filter((c) => sets.every((s) => s.has(c)))
const sharedT = shared.reduce((a, c) => { const s = sizes(c); return { raw: a.raw + s.raw, gzip: a.gzip + s.gzip, br: a.br + s.br } }, { raw: 0, gzip: 0, br: 0 })

// Todo el JS estático publicado (todas las rutas y chunks diferidos)
const dir = path.join(root, '.next', 'static', 'chunks')
let all = { files: 0, raw: 0, gzip: 0, br: 0 }
for (const f of fs.readdirSync(dir)) if (f.endsWith('.js')) { const s = sizes(path.join('.next', 'static', 'chunks', f)); all = { files: all.files + 1, raw: all.raw + s.raw, gzip: all.gzip + s.gzip, br: all.br + s.br } }

const kb = (n) => (n / 1024).toFixed(1)
const out = { generado: new Date().toISOString(), compartidoPorTodas: { chunks: shared.length, ...sharedT }, totalJsEstatico: all, rutas: rows }
const dest = process.argv[2]
if (dest) fs.writeFileSync(dest, JSON.stringify(out, null, 2))
console.log(`JS compartido por todas las rutas: ${kb(sharedT.raw)} KB sin comprimir · ${kb(sharedT.gzip)} KB gzip · ${kb(sharedT.br)} KB brotli (${shared.length} chunks)`)
console.log(`JS estático total publicado: ${all.files} archivos · ${kb(all.raw)} KB · ${kb(all.gzip)} KB gzip`)
console.log('\nRuta'.padEnd(36) + 'chunks'.padStart(7) + 'KB raw'.padStart(10) + 'KB gzip'.padStart(10) + 'KB brotli'.padStart(11))
for (const r of rows) console.log(r.route.padEnd(36) + String(r.chunks).padStart(7) + kb(r.raw).padStart(10) + kb(r.gzip).padStart(10) + kb(r.br).padStart(11))
