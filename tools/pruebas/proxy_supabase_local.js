// Proxy minimo que imita lo que Supabase expone en una sola URL: /rest/v1 -> PostgREST real, /auth/v1/user y /auth/v1/admin/users/:id simulados
const http = require('http')
const calls = []
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    const body = Buffer.concat(chunks)
    if (url.pathname === '/__calls') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(calls)) }
    if (url.pathname === '/auth/v1/user') {
      const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
      try {
        const p = JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString())
        if (!p.sub) throw new Error('sin sub')
        res.setHeader('content-type', 'application/json')
        return res.end(JSON.stringify({ id: p.sub, aud: 'authenticated', role: 'authenticated', email: p.sub + '@gmail.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }))
      } catch { res.statusCode = 401; res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ code: 401, msg: 'invalid token' })) }
    }
    const m = /^\/auth\/v1\/admin\/users\/([0-9a-f-]{36})$/.exec(url.pathname)
    if (m && req.method === 'PUT') {
      calls.push({ type: 'updateUserById', id: m[1], body: JSON.parse(body.toString() || '{}') })
      res.setHeader('content-type', 'application/json')
      return res.end(JSON.stringify({ id: m[1], aud: 'authenticated', role: 'authenticated', email: m[1] + '@gmail.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }))
    }
    if (url.pathname.startsWith('/rest/v1/')) {
      const target = http.request({ host: '127.0.0.1', port: 3000, path: url.pathname.replace('/rest/v1', '') + url.search, method: req.method, headers: { ...req.headers, host: '127.0.0.1:3000' } }, (r) => {
        res.writeHead(r.statusCode, r.headers); r.pipe(res)
      })
      target.on('error', () => { res.statusCode = 502; res.end('bad gateway') })
      target.end(body)
      return
    }
    res.statusCode = 404; res.end('no')
  })
}).listen(54321, '127.0.0.1')
