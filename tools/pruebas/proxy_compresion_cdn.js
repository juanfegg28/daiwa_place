// Proxy que imita la compresión automática de la CDN de Vercel (brotli/gzip para texto) delante de «next start»
const http = require('http'), zlib = require('zlib')
const [, , listen, target] = process.argv
const COMPRESSIBLE = /(text\/|javascript|json|xml|svg|css)/i
http.createServer((req, res) => {
  const up = http.request({ host: '127.0.0.1', port: Number(target), path: req.url, method: req.method, headers: { ...req.headers, 'accept-encoding': 'identity' } }, (r) => {
    const headers = { ...r.headers }
    const ae = String(req.headers['accept-encoding'] || '')
    const ct = String(headers['content-type'] || '')
    if (COMPRESSIBLE.test(ct) && !headers['content-encoding']) {
      const br = /\bbr\b/.test(ae)
      delete headers['content-length']; delete headers['transfer-encoding']
      headers['content-encoding'] = br ? 'br' : 'gzip'; headers['vary'] = 'Accept-Encoding'
      res.writeHead(r.statusCode, headers)
      r.pipe(br ? zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }) : zlib.createGzip({ level: 6 })).pipe(res)
    } else { res.writeHead(r.statusCode, headers); r.pipe(res) }
  })
  up.on('error', () => { res.statusCode = 502; res.end() })
  req.pipe(up)
}).listen(Number(listen), '127.0.0.1')
