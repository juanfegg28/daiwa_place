import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
const [,, pagePath = '/login', runsArg = '5'] = process.argv
const RUNS = Number(runsArg)
const targets = { 'v1.9.0 (línea base)': 'http://127.0.0.1:3201', 'v1.10.0': 'http://127.0.0.1:3202' }
const exe = await chromium.executablePath()
const args = [...chromium.args.filter((a) => a !== '--single-process'), '--no-sandbox']
const browser = await puppeteer.launch({ args, executablePath: exe, headless: 'shell' })
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
async function one(base) {
  const ctx = await browser.createBrowserContext() // contexto nuevo = caché fría
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const cdp = await page.createCDPSession()
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: false })
  // aproximación del perfil «móvil» de Lighthouse: 1,6 Mbps, 150 ms de latencia, CPU 4× más lenta
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  let total = 0, js = 0, css = 0, reqs = 0, html = 0
  const types = new Map()
  cdp.on('Network.responseReceived', (e) => types.set(e.requestId, e.type))
  cdp.on('Network.loadingFinished', (e) => { const t = types.get(e.requestId); total += e.encodedDataLength; reqs++; if (t === 'Script') js += e.encodedDataLength; if (t === 'Stylesheet') css += e.encodedDataLength; if (t === 'Document') html += e.encodedDataLength })
  await page.evaluateOnNewDocument(() => {
    window.__m = { lcp: 0, cls: 0, fcp: 0, lt: [] }
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value }).observe({ type: 'layout-shift', buffered: true })
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime }).observe({ type: 'paint', buffered: true })
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lt.push([e.startTime, e.duration]) }).observe({ type: 'longtask', buffered: true })
  })
  await page.goto(base + pagePath, { waitUntil: 'load', timeout: 90000 })
  await new Promise((r) => setTimeout(r, 4000))
  const m = await page.evaluate(() => window.__m)
  const tbt = m.lt.filter(([s]) => s >= m.fcp).reduce((a, [, d]) => a + Math.max(0, d - 50), 0)
  await ctx.close()
  return { fcp: m.fcp, lcp: m.lcp, cls: m.cls, tbt, total, js, css, html, reqs }
}
const out = {}
for (const [name, base] of Object.entries(targets)) {
  const runs = []
  for (let i = 0; i < RUNS; i++) runs.push(await one(base))
  out[name] = runs
}
await browser.close()
const f = (n, d = 0) => n.toFixed(d)
console.log(`Página ${pagePath} · ${RUNS} cargas en frío cada una · móvil 390×844, 4× CPU, 1,6 Mbps / 150 ms (mediana)`)
console.log('versión'.padEnd(22) + 'FCP ms'.padStart(8) + 'LCP ms'.padStart(8) + 'CLS'.padStart(8) + 'TBT ms'.padStart(8) + 'KB total'.padStart(10) + 'KB JS'.padStart(8) + 'KB CSS'.padStart(8) + 'KB HTML'.padStart(9) + 'peticiones'.padStart(11))
const res = {}
for (const [name, runs] of Object.entries(out)) {
  const g = (k) => med(runs.map((r) => r[k]))
  res[name] = { fcp: g('fcp'), lcp: g('lcp'), cls: g('cls'), tbt: g('tbt'), total: g('total'), js: g('js'), css: g('css'), html: g('html'), reqs: g('reqs') }
  const r = res[name]
  console.log(name.padEnd(22) + f(r.fcp).padStart(8) + f(r.lcp).padStart(8) + f(r.cls, 3).padStart(8) + f(r.tbt).padStart(8) + f(r.total / 1024, 1).padStart(10) + f(r.js / 1024, 1).padStart(8) + f(r.css / 1024, 1).padStart(8) + f(r.html / 1024, 1).padStart(9) + String(r.reqs).padStart(11))
}
console.log('runs:', JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.map((r) => [Math.round(r.fcp), Math.round(r.lcp)])]))))
