// @ts-nocheck
// Efectos de entrada de MIEMBROS (Círculo Lunar): 3 efectos MÍTICOS en canvas. Misma API que entry/engine.js: create(env) → {update, draw}.
import { lt, dk, rgba } from '../core/color.js'
import { SP_PAL } from '../avatar/sp1.js'
import { TAU, A, cl, ease, easeIO, bump, glow, sparkle, petalPath, crescentPath, pearl } from './spFx.js'

const BASE = { rarity: 'mitico', price: 0, coll: 'supporters', custom: true, palettes: SP_PAL }
const pol = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]

// ══════════ ECLIPSE TOTAL LUNAR — la luna oscura tapa al sol: anillo de diamante, corona, protuberancias, estrellas y un barrido de luz
const eclipse = {
  ...BASE, slug: 'eclipse-total-lunar', name: 'Eclipse Total Lunar', dur: 7, tint: 0.3,
  create: (env) => {
    const R = env.R, W = env.W, H = env.H, P = env.P, cx = W / 2, cy = H * 0.42, Rm = Math.min(W, H) * 0.2
    const streamers = Array.from({ length: 20 }, (_, i) => ({ a: (i / 20) * TAU + A(-0.1, 0.1, R), L: A(1.2, 3.2, R) * (i % 3 === 0 ? 1.3 : 1), w: A(0.06, 0.16, R), ph: A(0, 6, R) }))
    const fine = Array.from({ length: 120 }, (_, i) => ({ a: (i / 120) * TAU + A(-0.02, 0.02, R), L: A(0.4, 1.3, R), ph: A(0, 6, R) }))
    const proms = [[-0.55, 0.34], [0.9, 0.24], [2.3, 0.3], [3.8, 0.4], [5.35, 0.28]]
    const stars = Array.from({ length: 40 }, () => ({ x: A(0, W, R), y: A(0, H, R), r: A(0.8, 2.6, R), ph: A(0, 6, R) }))
    const beads = Array.from({ length: 9 }, () => ({ o: A(-0.6, 0.6, R), s: A(0.7, 1.6, R), ph: A(0, 6, R) }))
    const T_C = 1.2, T_T = 3.5, T_O = 5.5, END = 7
    return {
      update() {},
      draw(c, t) {
        const veil = ease(cl((t - 0.05) / 1.1)) * (1 - ease(cl((t - 6.1) / 0.9)))
        if (veil <= 0.01) return
        const p = ease(cl((t - T_C) / (T_T - T_C))), q = easeIO(cl((t - T_O) / (END - T_O - 0.2)))
        const mx = cx - (1 - p) * 2.4 * Rm + q * 2.5 * Rm, my = cy + (1 - p) * 0.95 * Rm - q * 0.85 * Rm
        const tot = ease(cl((t - T_T + 0.45) / 0.9)) * (1 - ease(cl((t - T_O) / 0.55)))
        // cielo que se oscurece
        c.save(); c.globalAlpha = veil * (0.5 + 0.22 * tot); c.fillStyle = '#02010a'; c.fillRect(0, 0, W, H); c.restore()
        // estrellas del crepúsculo
        for (const s of stars) sparkle(c, s.x, s.y, s.r * 1.2, P.d3, tot * veil * (0.35 + 0.65 * Math.abs(Math.sin(t * 2.4 + s.ph))), s.ph)
        // halo del sol y disco
        const sunA = veil * (1 - ease(cl((t - 6.3) / 0.7)))
        c.save(); c.globalCompositeOperation = 'lighter'
        glow(c, cx, cy, Rm * 3.4, P.d1, 0.55 * sunA * (1 - tot * 0.55)); glow(c, cx, cy, Rm * 1.7, P.d3, 0.7 * sunA * (1 - tot * 0.5))
        c.restore()
        c.save(); c.globalAlpha = sunA
        const sg = c.createRadialGradient(cx, cy, 0, cx, cy, Rm); sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.6, P.d3); sg.addColorStop(1, P.d1)
        c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, Rm * 0.99, 0, TAU); c.fill(); c.restore()
        // corona (solo en la totalidad)
        if (tot > 0.01) {
          c.save(); c.globalCompositeOperation = 'lighter'
          glow(c, cx, cy, Rm * 4.2, P.d1, 0.4 * tot); glow(c, cx, cy, Rm * 2.3, P.d3, 0.5 * tot)
          for (const s of streamers) {
            const L = Rm * (0.9 + s.L * (0.72 + 0.28 * Math.sin(t * 1.1 + s.ph))) * tot, a0 = s.a + t * 0.03
            const g = c.createRadialGradient(cx, cy, Rm * 0.9, cx, cy, Rm + L)
            g.addColorStop(0, rgba(P.d3, 0.7)); g.addColorStop(0.35, rgba(P.d1, 0.3)); g.addColorStop(1, rgba(P.d1, 0))
            c.fillStyle = g; const [x0, y0] = pol(cx, cy, Rm * 0.96, a0 - s.w), [x1, y1] = pol(cx, cy, Rm + L, a0), [x2, y2] = pol(cx, cy, Rm * 0.96, a0 + s.w)
            c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(...pol(cx, cy, Rm + L * 0.55, a0 - s.w * 0.6), x1, y1); c.quadraticCurveTo(...pol(cx, cy, Rm + L * 0.55, a0 + s.w * 0.6), x2, y2); c.closePath(); c.fill()
          }
          c.lineWidth = 0.8
          for (const f of fine) {
            const L = Rm * (0.2 + f.L * (0.7 + 0.3 * Math.sin(t * 2 + f.ph))) * tot, a0 = f.a - t * 0.02
            const [x0, y0] = pol(cx, cy, Rm * 1.01, a0), [x1, y1] = pol(cx, cy, Rm * 1.01 + L, a0)
            const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgba(P.d3, 0.85)); g.addColorStop(1, rgba(P.d3, 0)); c.strokeStyle = g
            c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke()
          }
          // protuberancias
          for (const [a, s] of proms) {
            const fl = 0.8 + 0.2 * Math.sin(t * 5 + a * 3), h = Rm * s * 1.5 * fl * tot, [bx0, by0] = pol(cx, cy, Rm * 0.99, a - 0.11), [bx1, by1] = pol(cx, cy, Rm * 0.99, a + 0.11)
            c.fillStyle = rgba(P.d4, 0.85 * tot); c.strokeStyle = rgba(lt(P.d4, 0.5), 0.9 * tot); c.lineWidth = 1.1
            c.beginPath(); c.moveTo(bx0, by0); c.bezierCurveTo(...pol(cx, cy, Rm + h * 1.25, a - 0.2), ...pol(cx, cy, Rm + h * 1.25, a + 0.2), bx1, by1); c.closePath(); c.fill(); c.stroke()
          }
          c.restore()
        }
        // la luna oscura
        c.save(); c.globalAlpha = veil
        const mg = c.createRadialGradient(mx - Rm * 0.3, my - Rm * 0.3, Rm * 0.1, mx, my, Rm * 1.04); mg.addColorStop(0, '#0b0814'); mg.addColorStop(1, '#010005')
        c.fillStyle = mg; c.beginPath(); c.arc(mx, my, Rm * 1.035, 0, TAU); c.fill()
        c.strokeStyle = rgba(P.d4, 0.35 + 0.35 * tot); c.lineWidth = 1.6; c.beginPath(); c.arc(mx, my, Rm * 1.035, 0, TAU); c.stroke()
        c.fillStyle = 'rgba(255,255,255,.04)'; for (const [dx, dy, r] of [[-0.3, -0.2, 0.28], [0.35, 0.25, 0.22], [0.05, 0.45, 0.14], [-0.45, 0.3, 0.12]]) { c.beginPath(); c.arc(mx + dx * Rm, my + dy * Rm, r * Rm, 0, TAU); c.fill() }
        c.restore()
        // anillos de diamante (al entrar y al salir de la totalidad) + cuentas de Baily
        const d1 = bump(t, T_T - 0.45, T_T + 0.25), d2 = bump(t, T_O - 0.12, T_O + 0.6)
        for (const [k, ang] of [[d1, -0.72], [d2, 2.4]]) {
          if (k <= 0) continue
          const [x, y] = pol(cx, cy, Rm * 1.0, ang)
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * 0.8; c.strokeStyle = P.d3; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, Rm * 1.01, ang - 1.2, ang + 1.2); c.stroke(); c.restore()
          for (const b of beads) { const [bx, by] = pol(cx, cy, Rm * 1.0, ang + b.o); sparkle(c, bx, by, 1.6 * b.s, P.d3, k * (0.4 + 0.6 * Math.abs(Math.sin(t * 9 + b.ph)))) }
          sparkle(c, x, y, Rm * 0.26 * (0.8 + 0.2 * Math.sin(t * 9)), '#ffffff', k, t * 0.3)
          c.save(); c.globalCompositeOperation = 'lighter'
          for (let i = 1; i <= 3; i++) { const gx = cx + (cx - x) * i * 0.7, gy = cy + (cy - y) * i * 0.7; c.globalAlpha = k * 0.38; c.strokeStyle = i % 2 ? P.d4 : P.d3; c.lineWidth = 1.2; c.beginPath(); c.arc(gx, gy, Rm * (0.14 + i * 0.07), 0, TAU); c.stroke() }
          c.restore()
        }
        // onda de choque al completarse
        if (t > T_T - 0.1 && t < T_T + 1.5) { const k = (t - T_T + 0.1) / 1.6; c.save(); c.globalAlpha = (1 - k) * 0.85; c.strokeStyle = P.d3; c.lineWidth = 2.6 * (1 - k) + 0.5; c.beginPath(); c.arc(cx, cy, Rm * (1 + k * 3.4), 0, TAU); c.stroke(); c.restore() }
        // rayo de luz que barre el perfil al salir
        const sw = cl((t - 5.0) / 1.6)
        if (sw > 0 && sw < 1) {
          const x = -W * 0.25 + sw * W * 1.5, k = Math.sin(sw * Math.PI)
          c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, 0); c.transform(1, 0, -0.5, 1, 0, 0)
          const g = c.createLinearGradient(-W * 0.18, 0, W * 0.18, 0); g.addColorStop(0, rgba(P.d3, 0)); g.addColorStop(0.5, rgba(P.d3, 0.38 * k)); g.addColorStop(1, rgba(P.d3, 0))
          c.fillStyle = g; c.fillRect(-W * 0.18, -10, W * 0.36, H + 20)
          c.fillStyle = rgba('#ffffff', 0.5 * k); c.fillRect(-1, -10, 2, H + 20); c.restore()
        }
      },
    }
  },
}

// ══════════ MAREA DE PÉTALOS LUNARES — oleadas de pétalos, lunas crecientes y perlas que suben con la marea
const marea = {
  ...BASE, slug: 'marea-de-petalos-lunares', name: 'Marea de pétalos lunares', dur: 6.5, tint: 0.12,
  create: (env) => {
    const R = env.R, W = env.W, H = env.H, P = env.P
    const waves = [0.15, 1.35, 2.55, 3.75]
    const mk = (delay, k) => {
      const kind = k < 0.55 ? 0 : k < 0.8 ? 1 : 2
      return { kind, x: A(0.03, 0.97, R) * W, y: H + A(10, 70, R), vy: A(55, 120, R), sw: A(8, 30, R), f: A(0.8, 2, R), ph: A(0, 6, R), r: A(0, 6, R), vr: A(-1.6, 1.6, R), s: kind === 0 ? A(7, 15, R) : kind === 1 ? A(5, 11, R) : A(2.6, 5, R), d: delay, c: [P.d1, P.d3, lt(P.d1, 0.5), P.d4][Math.floor(R() * 4)], life: 0 }
    }
    const ps = []
    waves.forEach((w) => { for (let i = 0; i < 20; i++) { const x = R(); const q = mk(w + x * 0.8, R()); q.x = x * W * 0.94 + W * 0.03; ps.push(q) } })
    let acc = 0
    const tide = (t) => { let v = 0; for (const w of waves) v += bump(t, w, w + 1.8); return Math.min(1, v) }
    return {
      update(dt, t) {
        if (t > 4.2) { acc += dt * 6; while (acc >= 1 && ps.length < 160) { acc--; ps.push(mk(t, R())) } }
        for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; if (t < p.d) continue; p.life += dt; p.y -= p.vy * dt; p.x += Math.sin(t * p.f + p.ph) * p.sw * dt; p.r += p.vr * dt; if (p.y < -30) ps.splice(i, 1) }
      },
      draw(c, t) {
        // la marea (ola brillante que sube desde abajo)
        const lift = tide(t) * H * 0.24 + 6
        c.save()
        c.beginPath(); c.moveTo(0, H)
        for (let x = 0; x <= W; x += 6) c.lineTo(x, H - lift + Math.sin(x * 0.022 + t * 2.2) * 6 + Math.sin(x * 0.051 - t * 1.6) * 3)
        c.lineTo(W, H); c.closePath()
        const g = c.createLinearGradient(0, H - lift - 10, 0, H); g.addColorStop(0, rgba(P.d1, 0)); g.addColorStop(0.25, rgba(P.d1, 0.2)); g.addColorStop(1, rgba(P.d4, 0.52))
        c.fillStyle = g; c.fill()
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.d3, 0.65); c.lineWidth = 1.5; c.beginPath()
        for (let x = 0; x <= W; x += 6) { const y = H - lift + Math.sin(x * 0.022 + t * 2.2) * 6 + Math.sin(x * 0.051 - t * 1.6) * 3; c[x ? 'lineTo' : 'moveTo'](x, y) }
        c.stroke(); c.restore()
        for (const p of ps) {
          if (t < p.d) continue
          const top = cl(p.y / (H * 0.32)), a = Math.min(1, p.life / 0.5) * (0.25 + 0.75 * top)
          c.save(); c.globalAlpha = a; c.translate(p.x, p.y); c.rotate(p.r)
          if (p.kind === 0) {
            c.scale(0.45 + 0.55 * Math.abs(Math.cos(t * 1.7 + p.ph)), 1)
            const pg = c.createLinearGradient(0, 0, 0, -p.s); pg.addColorStop(0, p.c); pg.addColorStop(1, lt(p.c, 0.6))
            c.fillStyle = pg; petalPath(c, p.s); c.fill(); c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 0.6; c.stroke()
            c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, -p.s * 0.1); c.lineTo(0, -p.s * 0.8); c.stroke()
          } else if (p.kind === 1) {
            c.globalCompositeOperation = 'lighter'; glow(c, 0, 0, p.s * 2.6, p.c, 0.5)
            c.globalCompositeOperation = 'source-over'; const mg = c.createLinearGradient(-p.s, -p.s, p.s, p.s); mg.addColorStop(0, '#fff'); mg.addColorStop(1, p.c)
            c.fillStyle = mg; crescentPath(c, p.s); c.fill()
          } else { c.restore(); pearl(c, p.x, p.y, p.s, lt(P.d1, 0.7), a); continue }
          c.restore()
        }
        // destellos en la cresta
        const k = tide(t)
        if (k > 0.05) for (let i = 0; i < 9; i++) { const x = ((i * 0.113 + t * 0.07 + i * 0.37) % 1) * W; sparkle(c, x, H - lift + Math.sin(x * 0.022 + t * 2.2) * 6, 2 + (i % 3), P.d3, k * (0.4 + 0.6 * Math.abs(Math.sin(t * 4 + i * 1.7)))) }
      },
    }
  },
}

// ══════════ LLUVIA DE ESTRELLAS DE PLATA — estrellas fugaces con estela, polvo de plata y perlas que caen
const lluvia = {
  ...BASE, slug: 'lluvia-de-estrellas-de-plata', name: 'Lluvia de estrellas de plata', dur: 6, tint: 0.14,
  create: (env) => {
    const R = env.R, W = env.W, H = env.H, P = env.P
    const shooters = [], glitter = [], pearls = [], bg = Array.from({ length: 34 }, () => ({ x: A(0, W, R), y: A(0, H, R), r: A(0.8, 2.4, R), ph: A(0, 6, R) }))
    const spawn = (d, hero) => {
      const ang = A(0.72, 1.05, R), dirx = -Math.cos(ang), diry = Math.sin(ang), v = (hero ? 1.15 : A(0.6, 1.0, R)) * W * 1.1
      return { x: hero ? W * 0.98 : A(W * 0.35, W * 1.1, R), y: hero ? -H * 0.05 : A(-H * 0.2, H * 0.3, R), dx: dirx, dy: diry, v, L: hero ? W * 0.62 : A(0.16, 0.32, R) * W, w: hero ? 4.2 : A(1.2, 2.4, R), d, life: 0, ttl: hero ? 1.9 : A(0.8, 1.3, R), hero, c: [P.d3, '#ffffff', P.d1][Math.floor(R() * 3)] }
    }
    shooters.push(spawn(0.75, true))
    for (let i = 0; i < 12; i++) shooters.push(spawn(0.15 + i * 0.36 + A(0, 0.25, R), false))
    for (let i = 0; i < 16; i++) pearls.push({ x: A(0.04, 0.96, R) * W, y: -A(10, H * 0.5, R), vy: A(26, 58, R), sw: A(6, 20, R), f: A(0.8, 1.8, R), ph: A(0, 6, R), s: A(2.6, 5.4, R), d: A(0.4, 3.4, R), c: i % 3 ? lt(P.d1, 0.75) : lt(P.d4, 0.6) })
    let amb = 0
    return {
      update(dt, t) {
        if (t > 3.6) { amb += dt; if (amb > 0.8) { amb = 0; shooters.push(spawn(t, false)) } }
        for (let i = shooters.length - 1; i >= 0; i--) {
          const s = shooters[i]; if (t < s.d) continue
          s.life += dt; s.x += s.dx * s.v * dt; s.y += s.dy * s.v * dt
          if (glitter.length < 220 && s.life < s.ttl) for (let k = 0; k < (s.hero ? 3 : 1); k++) glitter.push({ x: s.x - s.dx * A(0, s.L * 0.3, R), y: s.y - s.dy * A(0, s.L * 0.3, R), vx: A(-14, 14, R), vy: A(6, 40, R), life: 0, ttl: A(0.7, 1.7, R), r: A(0.8, 2.2, R), ph: A(0, 6, R), c: [P.d3, '#ffffff', P.d4][Math.floor(R() * 3)] })
          if (s.life > s.ttl + 0.3) shooters.splice(i, 1)
        }
        for (let i = glitter.length - 1; i >= 0; i--) { const g = glitter[i]; g.life += dt; g.x += g.vx * dt; g.y += g.vy * dt; if (g.life > g.ttl) glitter.splice(i, 1) }
        for (const p of pearls) if (t >= p.d) { p.y += p.vy * dt; p.x += Math.sin(t * p.f + p.ph) * p.sw * dt; if (p.y > H + 12) { p.y = -10; p.x = A(0.04, 0.96, R) * W } }
      },
      draw(c, t) {
        const fade = 1 - cl((t - 5.4) / 0.8)
        for (const b of bg) sparkle(c, b.x, b.y, b.r, P.d3, 0.35 * Math.abs(Math.sin(t * 2.2 + b.ph)) * Math.min(1, t / 0.6))
        c.save(); c.globalCompositeOperation = 'lighter'
        for (const s of shooters) {
          if (t < s.d || s.life > s.ttl + 0.3) continue
          const a = (s.life < s.ttl ? Math.min(1, s.life / 0.12) : cl(1 - (s.life - s.ttl) / 0.3)) * fade
          const tx = s.x - s.dx * s.L, ty = s.y - s.dy * s.L, nx = -s.dy * s.w, ny = s.dx * s.w
          const g = c.createLinearGradient(s.x, s.y, tx, ty); g.addColorStop(0, rgba('#ffffff', 0.95 * a)); g.addColorStop(0.25, rgba(s.c, 0.6 * a)); g.addColorStop(1, rgba(P.d1, 0))
          c.fillStyle = g; c.beginPath(); c.moveTo(s.x + nx, s.y + ny); c.lineTo(tx, ty); c.lineTo(s.x - nx, s.y - ny); c.closePath(); c.fill()
          c.strokeStyle = rgba('#ffffff', 0.8 * a); c.lineWidth = Math.max(0.6, s.w * 0.28); c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.dx * s.L * 0.55, s.y - s.dy * s.L * 0.55); c.stroke()
          sparkle(c, s.x, s.y, s.hero ? 9 : 4.5, s.c, a, t * 2)
        }
        c.restore()
        for (const g of glitter) { const k = 1 - g.life / g.ttl; sparkle(c, g.x, g.y, g.r, g.c, k * (0.4 + 0.6 * Math.abs(Math.sin(g.life * 14 + g.ph))) * fade, g.ph) }
        for (const p of pearls) { if (t < p.d) continue; c.save(); c.globalCompositeOperation = 'lighter'; glow(c, p.x, p.y, p.s * 3.2, P.d3, 0.22 * fade); c.restore(); pearl(c, p.x, p.y, p.s, p.c, 0.95 * fade) }
      },
    }
  },
}

export const SP_ENTRY = [eclipse, marea, lluvia]
