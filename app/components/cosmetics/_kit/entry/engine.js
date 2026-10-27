// @ts-nocheck
// MOTOR DE EFECTOS DE ENTRADA AL PERFIL — canvas 2D, ~6 KB, determinista (semilla), sin dependencias.
//   • Entrada: hasta ~70 partículas durante ~4 s · Ambiente después: ≤ 14 partículas.
//   • prefers-reduced-motion: se dibuja UN solo fotograma final (estado estático) y no hay rAF.
//   • Uso: const h = startEntry(effect, canvas, {paletteId, loop:true}); h.stop()
import { rng } from '../core/util.js'
import { makePalette, mix, lt, dk, rot } from '../core/color.js'

const TAU = Math.PI * 2
const heart = (c, s) => { c.beginPath(); c.moveTo(0, s * 0.92); c.bezierCurveTo(-s * 1.15, s * 0.1, -s, -s * 0.95, -s * 0.46, -s * 0.95); c.bezierCurveTo(-s * 0.2, -s * 0.95, 0, -s * 0.72, 0, -s * 0.46); c.bezierCurveTo(0, -s * 0.72, s * 0.2, -s * 0.95, s * 0.46, -s * 0.95); c.bezierCurveTo(s, -s * 0.95, s * 1.15, s * 0.1, 0, s * 0.92); c.closePath() }
const star = (c, n, R, r) => { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i * Math.PI) / n - Math.PI / 2, rr = i % 2 ? r : R; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr) } c.closePath() }
const petal = (c, s) => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-s * 0.95, -s * 0.2, -s, -s * 0.8, -s * 0.28, -s); c.lineTo(0, -s * 0.88); c.lineTo(s * 0.28, -s); c.bezierCurveTo(s, -s * 0.8, s * 0.95, -s * 0.2, 0, 0); c.closePath() }
const glow = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1 }

// Sistema genérico de partículas: spawn(R,env,t) → p ; step(p,dt,t,env) → false para morir ; draw(c,p,env,t)
function system({ spawn, step, draw, rate = 30, ambient = 5, intro = 4, max = 70, burst = 0 }) {
  return (env) => {
    const ps = []
    let acc = 0, did = false
    return {
      update(dt, t) {
        if (burst && !did) { did = true; for (let i = 0; i < burst; i++) ps.push(spawn(env.R, env, t, i, burst)) }
        const rt = t < intro ? rate : ambient
        acc += rt * dt
        while (acc >= 1) { acc--; if (ps.length < (t < intro ? max : 14 + (burst ? 40 : 0))) ps.push(spawn(env.R, env, t, -1, 0)) }
        for (let i = ps.length - 1; i >= 0; i--) if (step(ps[i], dt, t, env) === false) ps.splice(i, 1)
      },
      draw(c, t) { for (const p of ps) draw(c, p, env, t) },
    }
  }
}
const A = (a, b, R) => a + (b - a) * R()

export const ENTRY_EFFECTS = []
const def = (o) => (ENTRY_EFFECTS.push(o), o)
const P4 = (rows) => rows.map(([id, name, d1, d2, d3, d4]) => ({ id, name, c: [d1, d2, d3, d4] }))

// ───────── Comunes
def({
  slug: 'confeti', name: 'Confeti', rarity: 'comun', price: 800, dur: 4.5, tint: 0,
  palettes: P4([['fiesta', 'Fiesta', '#FF4D8D', '#1B1030', '#FFE066', '#4DD2FF'], ['pastel', 'Pastel', '#FFB3D1', '#1B1030', '#B5E8FF', '#D8C2FF'], ['dorado', 'Dorado', '#F5C84C', '#1B1030', '#FFF1B8', '#FF9A4D'], ['neon', 'Neón', '#39FF88', '#10122B', '#FF3DF0', '#3DE0FF']]),
  create: system({ rate: 0, ambient: 0, burst: 64, intro: 4,
    spawn: (R, e, t, i, n) => ({ x: A(0, e.W, R), y: A(-40, -4, R), vx: A(-50, 50, R), vy: A(20, 70, R), r: A(0, 6, R), vr: A(-9, 9, R), w: A(5, 10, R), h: A(3, 6, R), c: [e.P.d1, e.P.d3, e.P.d4, e.P.lt(e.P.d1, 0.4)][i % 4], ph: A(0, 6, R), d: A(0, 1.4, R) }),
    step: (p, dt, t, e) => { if (t < p.d) return true; p.vy += 70 * dt; p.vx *= 0.995; p.vy = Math.min(p.vy, 78); p.x += (p.vx + Math.sin(t * 3 + p.ph) * 30) * dt; p.y += p.vy * dt; p.r += p.vr * dt; return p.y < e.H + 20 },
    draw: (c, p, e, t) => { if (t < p.d) return; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.scale(1, Math.cos(t * 6 + p.ph)); c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore() } }),
})
def({
  slug: 'nieve-suave', name: 'Nieve suave', rarity: 'comun', price: 900, dur: 0, tint: 0,
  palettes: P4([['blanca', 'Blanca', '#FFFFFF', '#0F1830', '#DDF0FF', '#9EC8FF'], ['rosa', 'Nieve rosa', '#FFD1E6', '#2A1030', '#FFFFFF', '#FF9AC8'], ['azul', 'Azul glaciar', '#BFE6FF', '#0A1830', '#FFFFFF', '#5CB8FF'], ['dorada', 'Dorada', '#FFE9A8', '#241808', '#FFFFFF', '#FFC84A']]),
  create: system({ rate: 20, ambient: 4, max: 70,
    spawn: (R, e) => ({ x: A(0, e.W, R), y: -8, r: A(1.2, 4, R), vy: A(22, 56, R), ph: A(0, 6, R), a: A(0.5, 1, R), big: R() < 0.15 }),
    step: (p, dt, t, e) => { p.y += p.vy * dt; p.x += Math.sin(t * 0.9 + p.ph) * 14 * dt; return p.y < e.H + 8 },
    draw: (c, p, e, t) => { c.globalAlpha = p.a; c.fillStyle = e.P.d1; if (p.big) { c.save(); c.translate(p.x, p.y); c.rotate(t * 0.3 + p.ph); c.strokeStyle = e.P.d1; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-p.r * 2.4, 0); c.lineTo(p.r * 2.4, 0); c.stroke() } c.restore() } else { c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill() } c.globalAlpha = 1 } }),
})
// ───────── Raros
def({
  slug: 'lluvia', name: 'Lluvia', rarity: 'raro', price: 1400, dur: 0, tint: 0.18,
  palettes: P4([['gris', 'Gris tormenta', '#BFD0E6', '#0B1220', '#FFFFFF', '#7FA6D8'], ['neon', 'Neón', '#7FE8FF', '#060A1C', '#FF7AD9', '#B48CFF'], ['calida', 'Cálida', '#FFD9A8', '#1C0F08', '#FFFFFF', '#FF9A6A'], ['verde', 'Verde', '#A8F0C8', '#061410', '#FFFFFF', '#5CD69A']]),
  create: (env) => {
    const rip = []
    const base = system({ rate: 70, ambient: 12, max: 90,
      spawn: (R, e) => ({ x: A(-30, e.W + 30, R), y: A(-30, -4, R), vy: A(520, 760, R), l: A(10, 22, R), a: A(0.25, 0.7, R), gy: A(e.H * 0.55, e.H - 4, R) }),
      step: (p, dt, t, e) => { p.y += p.vy * dt; p.x -= p.vy * 0.17 * dt; if (p.y > p.gy) { if (rip.length < 18) rip.push({ x: p.x, y: p.gy, r: 1, a: 0.6 }); return false } return true },
      draw: (c, p, e) => { c.globalAlpha = p.a; c.strokeStyle = e.P.d1; c.lineWidth = 1.1; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.l * 0.17, p.y - p.l); c.stroke(); c.globalAlpha = 1 } })(env)
    return { update(dt, t) { base.update(dt, t); for (let i = rip.length - 1; i >= 0; i--) { rip[i].r += 34 * dt; rip[i].a -= 1.2 * dt; if (rip[i].a <= 0) rip.splice(i, 1) } }, draw(c, t) { base.draw(c, t); c.strokeStyle = env.P.d1; c.lineWidth = 1; for (const r of rip) { c.globalAlpha = Math.max(0, r.a); c.beginPath(); c.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, TAU); c.stroke() } c.globalAlpha = 1 } }
  },
})
def({
  slug: 'corazones-flotando', name: 'Corazones flotando', rarity: 'raro', price: 1500, dur: 0, tint: 0,
  palettes: P4([['rosa', 'Rosa', '#FF5C9A', '#2A0A1E', '#FFC2DC', '#FF8AB8'], ['rojo', 'Rojo pasión', '#FF3B4E', '#240608', '#FFC4CA', '#FF8A5C'], ['lila', 'Lila', '#B88CFF', '#190C30', '#EBDDFF', '#FF9AD8'], ['menta', 'Menta', '#4FE0B8', '#06201A', '#C6FFEC', '#9AF0FF']]),
  create: system({ rate: 9, ambient: 3, max: 60,
    spawn: (R, e) => ({ x: A(10, e.W - 10, R), y: e.H + 14, s: A(5, 13, R), vy: A(34, 80, R), ph: A(0, 6, R), c: [e.P.d1, e.P.d4, e.P.d3][Math.floor(R() * 3)], rot: A(-0.4, 0.4, R) }),
    step: (p, dt, t) => { p.y -= p.vy * dt; p.x += Math.sin(t * 1.6 + p.ph) * 22 * dt; return p.y > -20 },
    draw: (c, p, e) => { c.save(); c.translate(p.x, p.y); c.rotate(p.rot + Math.sin(p.y * 0.03) * 0.2); c.globalAlpha = Math.min(1, p.y / (e.H * 0.35)) * 0.95; c.fillStyle = p.c; heart(c, p.s); c.fill(); c.globalAlpha = 0.5; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-p.s * 0.45, -p.s * 0.45, p.s * 0.2, p.s * 0.12, -0.6, 0, TAU); c.fill(); c.restore() } }),
})
def({
  slug: 'petalos-cayendo', name: 'Pétalos cayendo', rarity: 'raro', price: 1500, dur: 0, tint: 0,
  palettes: P4([['sakura', 'Sakura', '#FFB3CF', '#2A1030', '#FFE3EE', '#FF86B0'], ['lila', 'Glicina', '#C8A8FF', '#1A0F30', '#EFE4FF', '#9A78F0'], ['rojo', 'Rosa roja', '#E8344E', '#240810', '#FF9AA8', '#B01E38'], ['durazno', 'Durazno', '#FFC09A', '#2A1208', '#FFE6D4', '#FF9A6A']]),
  create: system({ rate: 12, ambient: 3, max: 60,
    spawn: (R, e) => ({ x: A(-10, e.W + 30, R), y: -14, s: A(7, 14, R), vy: A(30, 60, R), vx: A(-10, 30, R), r: A(0, 6, R), vr: A(-2, 2, R), ph: A(0, 6, R), c: [e.P.d1, e.P.d3, e.P.d4][Math.floor(R() * 3)] }),
    step: (p, dt, t, e) => { p.y += p.vy * dt; p.x += (p.vx + Math.sin(t * 1.4 + p.ph) * 30) * dt; p.r += p.vr * dt; return p.y < e.H + 20 },
    draw: (c, p, e, t) => { c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.scale(Math.cos(t * 1.8 + p.ph) * 0.6 + 0.5, 1); c.fillStyle = p.c; petal(c, p.s); c.fill(); c.restore() } }),
})
def({
  slug: 'brasas-subiendo', name: 'Brasas subiendo', rarity: 'raro', price: 1600, dur: 0, tint: 0.12,
  palettes: P4([['fuego', 'Fuego', '#FF7A2A', '#1A0802', '#FFD27A', '#FF3B1E'], ['azul', 'Llama azul', '#4FA8FF', '#020A1C', '#C2E4FF', '#7A5CFF'], ['verde', 'Fuego fatuo', '#5CFF9A', '#021408', '#D0FFE2', '#2ABF70'], ['carmesi', 'Brasa carmesí', '#FF2A4E', '#1C040A', '#FFB0BC', '#FF7A3B']]),
  create: system({ rate: 24, ambient: 5, max: 70,
    spawn: (R, e) => ({ x: A(0, e.W, R), y: e.H + 6, r: A(1.2, 3.6, R), vy: A(40, 120, R), ph: A(0, 6, R), life: 0, ttl: A(2.5, 5, R), c: [e.P.d1, e.P.d3, e.P.d4][Math.floor(R() * 3)] }),
    step: (p, dt, t) => { p.life += dt; p.y -= p.vy * dt; p.x += Math.sin(t * 2.4 + p.ph) * 26 * dt; return p.life < p.ttl },
    draw: (c, p) => { const k = 1 - p.life / p.ttl, fl = 0.6 + 0.4 * Math.sin(p.life * 18 + p.ph); c.globalCompositeOperation = 'lighter'; glow(c, p.x, p.y, p.r * 5, p.c, 0.55 * k * fl); c.fillStyle = p.c; c.globalAlpha = k; c.beginPath(); c.arc(p.x, p.y, p.r * k + 0.4, 0, TAU); c.fill(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over' } }),
})
def({
  slug: 'luciernagas', name: 'Luciérnagas', rarity: 'raro', price: 1700, dur: 0, tint: 0.1,
  palettes: P4([['verde', 'Verde bosque', '#C8FF5C', '#04120A', '#F0FFC2', '#5CFF9A'], ['ambar', 'Ámbar', '#FFC85C', '#140C02', '#FFF0C2', '#FF9A3D'], ['azul', 'Azul hada', '#7AD8FF', '#02101C', '#DDF4FF', '#B48CFF'], ['rosa', 'Rosa', '#FF8AC8', '#18061A', '#FFD6EC', '#C88CFF']]),
  create: (env) => {
    const R = env.R, N = 16, L = Array.from({ length: N }, () => ({ x: R() * env.W, y: R() * env.H, a: R() * 6, s: A(0.3, 0.9, R), ph: R() * 6, r: A(1.6, 3, R) }))
    return { update(dt, t) { for (const f of L) { f.a += (Math.sin(t * f.s + f.ph) * 1.2) * dt; f.x += Math.cos(f.a) * 18 * dt; f.y += Math.sin(f.a * 0.8) * 14 * dt; if (f.x < -10) f.x = env.W + 10; if (f.x > env.W + 10) f.x = -10; if (f.y < 10) f.y = 10; if (f.y > env.H - 10) f.y = env.H - 10 } }, draw(c, t) { c.globalCompositeOperation = 'lighter'; for (const f of L) { const k = Math.min(1, t / 1.5) * (0.5 + 0.5 * Math.sin(t * 2 * f.s + f.ph * 3)); glow(c, f.x, f.y, f.r * 7, env.P.d1, 0.7 * k); c.fillStyle = env.P.d3; c.globalAlpha = k; c.beginPath(); c.arc(f.x, f.y, f.r * 0.7, 0, TAU); c.fill(); c.globalAlpha = 1 } c.globalCompositeOperation = 'source-over' } }
  },
})
// ───────── Épicos
def({
  slug: 'rafaga-de-estrellas', name: 'Ráfaga de estrellas', rarity: 'epico', price: 2500, dur: 4, tint: 0.1,
  palettes: P4([['dorada', 'Dorada', '#FFD84A', '#0C0A24', '#FFF4B8', '#FF9AD8'], ['arcoiris', 'Cósmica', '#8CE8FF', '#0A0824', '#FFFFFF', '#C08CFF'], ['rosa', 'Rosa', '#FF8AC8', '#180A28', '#FFE0F0', '#FFD84A'], ['verde', 'Verde astral', '#7AFFB8', '#04141C', '#E0FFF0', '#8CD8FF']]),
  create: system({ rate: 0, ambient: 2.5, burst: 56, intro: 3,
    spawn: (R, e, t, i) => { const a = A(0, TAU, R), v = i < 0 ? A(10, 30, R) : A(80, 330, R); return { x: i < 0 ? A(0, e.W, R) : e.W / 2, y: i < 0 ? A(0, e.H, R) : e.H / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: A(3, 8, R), r: A(0, 6, R), vr: A(-4, 4, R), life: 0, ttl: i < 0 ? A(1.5, 3, R) : A(1.6, 3.2, R), c: [e.P.d1, e.P.d3, e.P.d4][Math.floor(R() * 3)], trail: [] } },
    step: (p, dt) => { p.life += dt; p.trail.push([p.x, p.y]); if (p.trail.length > 7) p.trail.shift(); p.vx *= 1 - 1.6 * dt; p.vy *= 1 - 1.6 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; return p.life < p.ttl },
    draw: (c, p) => { const k = 1 - p.life / p.ttl; c.globalCompositeOperation = 'lighter'; c.strokeStyle = p.c; c.lineWidth = 1.4; c.globalAlpha = k * 0.4; c.beginPath(); p.trail.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](x, y)); c.stroke(); c.globalAlpha = k; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.scale(0.5 + k * 0.7, 0.5 + k * 0.7); c.fillStyle = p.c; star(c, 5, p.s, p.s * 0.45); c.fill(); c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over' } }),
})
def({
  slug: 'murcielagos', name: 'Murciélagos', rarity: 'epico', price: 2600, dur: 5, tint: 0.25,
  palettes: P4([['noche', 'Noche', '#9C7CFF', '#0C0818', '#E4D8FF', '#FF5C8A'], ['sangre', 'Sangre', '#FF3B5E', '#14040A', '#FFC4CE', '#FF8A5C'], ['bruma', 'Bruma', '#8CA8C8', '#080C14', '#E2EAF4', '#B0C8E8'], ['toxico', 'Tóxico', '#8CFF5C', '#06140A', '#DCFFC4', '#C8FF5C']]),
  create: system({ rate: 5, ambient: 0.4, intro: 3.4, max: 16,
    spawn: (R, e) => { const dir = R() < 0.5 ? 1 : -1; return { x: dir > 0 ? -24 : e.W + 24, y: A(e.H * 0.12, e.H * 0.8, R), vx: dir * A(110, 220, R), amp: A(14, 40, R), f: A(2, 4, R), s: A(0.6, 1.3, R), ph: A(0, 6, R), y0: 0, fl: A(10, 16, R), dir } },
    step: (p, dt, t, e) => { if (!p.y0) p.y0 = p.y; p.x += p.vx * dt; p.y = p.y0 + Math.sin(t * p.f + p.ph) * p.amp; return p.x > -40 && p.x < e.W + 40 },
    draw: (c, p, e, t) => { c.save(); c.translate(p.x, p.y); c.scale(p.s * p.dir, p.s); const w = Math.sin(t * p.fl + p.ph) * 0.6 + 0.4; c.fillStyle = e.P.d2 === '#0C0818' ? '#0b0814' : dk(e.P.d2, 0.4); c.strokeStyle = e.P.d1; c.lineWidth = 1; c.globalAlpha = 0.95
      for (const m of [1, -1]) { c.save(); c.scale(m, 1); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -16 * w - 4, 26, -12 * w); c.quadraticCurveTo(22, -2, 19, 6); c.quadraticCurveTo(15, 1, 12, 8); c.quadraticCurveTo(8, 2, 4, 6); c.closePath(); c.fill(); c.stroke(); c.restore() }
      c.beginPath(); c.ellipse(0, 3, 4, 7, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = e.P.d4; c.beginPath(); c.arc(-1.6, 0, 1, 0, TAU); c.arc(1.6, 0, 1, 0, TAU); c.fill(); c.restore() } }),
})
def({
  slug: 'glitch-y-escaneo', name: 'Glitch y escaneo', rarity: 'epico', price: 3000, dur: 3.2, tint: 0,
  palettes: P4([['cian', 'Cian-magenta', '#2EE6FF', '#04061A', '#FF3DBA', '#FFFFFF'], ['verde', 'Matriz', '#27F27A', '#020B07', '#B8FFD6', '#FFD84A'], ['rojo', 'Alerta', '#FF3B4E', '#14040A', '#FFB0BC', '#FFFFFF'], ['violeta', 'Ultravioleta', '#A66CFF', '#0A041C', '#FF6CE8', '#C8FFFF']]),
  create: (env) => {
    const R = env.R, blocks = []
    return { update(dt, t) { if (t < 3.2 || (t % 5) < 0.3) { if (R() < 0.35) blocks.push({ x: R() * env.W, y: R() * env.H, w: A(30, 160, R), h: A(2, 14, R), c: [env.P.d1, env.P.d3, env.P.d4][Math.floor(R() * 3)], ttl: A(0.05, 0.22, R), age: 0, dx: A(-14, 14, R) }) } for (let i = blocks.length - 1; i >= 0; i--) { blocks[i].age += dt; if (blocks[i].age > blocks[i].ttl) blocks.splice(i, 1) } },
      draw(c, t) { const y = ((t * 0.35) % 1.4) * env.H - 20; if (t < 3.6 || (t % 5) < 1.2) { const g = c.createLinearGradient(0, y - 26, 0, y + 6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, env.P.d1); c.globalAlpha = 0.28; c.fillStyle = g; c.fillRect(0, y - 26, env.W, 32); c.globalAlpha = 0.8; c.fillStyle = env.P.d1; c.fillRect(0, y + 5, env.W, 1.4); c.globalAlpha = 1 } c.globalCompositeOperation = 'lighter'; for (const b of blocks) { c.globalAlpha = 0.55; c.fillStyle = b.c; c.fillRect(b.x + b.dx, b.y, b.w, b.h) } c.globalAlpha = 0.07; c.fillStyle = '#fff'; for (let yy = 0; yy < env.H; yy += 4) c.fillRect(0, yy, env.W, 1); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over' } }
  },
})
def({
  slug: 'circulo-magico-pulsando', name: 'Círculo mágico pulsando', rarity: 'epico', price: 3200, dur: 0, tint: 0.2,
  palettes: P4([['lunar', 'Lunar', '#A58CFF', '#0A0820', '#E6DEFF', '#FFD98A'], ['aurora', 'Aurora', '#4FE0CC', '#041A22', '#C8FFF4', '#FF9ADC'], ['rosa', 'Rosa astral', '#FF8AD0', '#1A0720', '#FFD6F0', '#8CD8FF'], ['ambar', 'Ámbar', '#FFB84D', '#1C0E06', '#FFE6B8', '#B49CFF']]),
  create: (env) => ({ update() {}, draw(c, t) {
    const cx = env.W / 2, cy = env.H / 2, R0 = Math.min(env.W, env.H) * 0.4, k = Math.min(1, t / 1.2), pu = 0.5 + 0.5 * Math.sin(t * 2.2)
    c.save(); c.translate(cx, cy); c.scale(1, 0.42 + 0.0 * k); c.globalAlpha = k; c.globalCompositeOperation = 'lighter'
    const ring = (r, w, a, dash) => { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.lineWidth = w; c.strokeStyle = env.P.d1; c.globalAlpha = a * k; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]) }
    glow(c, 0, 0, R0 * 1.3, env.P.d1, 0.25 + pu * 0.2)
    ring(R0, 2, 0.9); ring(R0 * 0.88, 1, 0.7, [3, 6]); ring(R0 * 0.62, 1.4, 0.8)
    c.save(); c.rotate(t * 0.4); c.strokeStyle = env.P.d3; c.globalAlpha = 0.9 * k; c.lineWidth = 1.4; for (let i = 0; i < 48; i++) { c.rotate(TAU / 48); c.beginPath(); c.moveTo(R0 * 0.94, 0); c.lineTo(R0 * (i % 4 ? 0.99 : 1.06), 0); c.stroke() } c.restore()
    c.save(); c.rotate(-t * 0.3); c.strokeStyle = env.P.d4; c.lineWidth = 1.6; star(c, 6, R0 * 0.6, R0 * 0.3); c.globalAlpha = 0.9 * k; c.stroke(); c.restore()
    for (let i = 0; i < 3; i++) { const q = ((t * 0.5 + i / 3) % 1); ring(R0 * (0.4 + q * 0.9), 1.6, (1 - q) * 0.8) }
    c.restore(); c.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + t * 0.5, rr = R0 * (0.5 + 0.5 * ((i * 37 + t * 20) % 10) / 10); const yy = cy + Math.sin(a) * rr * 0.42 - ((t * 24 + i * 11) % 60); glow(c, cx + Math.cos(a) * rr, yy, 5, env.P.d3, 0.7 * k) }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1 } }),
})
def({
  slug: 'relampago-suave', name: 'Relámpago suave', rarity: 'epico', price: 3400, dur: 0, tint: 0.3,
  palettes: P4([['blanco', 'Blanco azulado', '#DDEBFF', '#050814', '#FFFFFF', '#7FA6FF'], ['violeta', 'Violeta', '#C8A8FF', '#0A0420', '#FFFFFF', '#8C5CFF'], ['carmesi', 'Carmesí', '#FF8AA0', '#14040A', '#FFFFFF', '#FF3B5E'], ['verde', 'Verde ácido', '#C8FFC2', '#04140A', '#FFFFFF', '#5CFF8A']]),
  create: (env) => {
    const R = env.R, FL = [0.5, 1.15, 2.7]; let bolt = [], last = -1, fa = 0
    const mk = (x0) => { const pts = [[x0, 0]]; let x = x0, y = 0; while (y < env.H * 0.85) { y += A(14, 32, R); x += A(-22, 22, R); pts.push([x, y]) } return pts }
    return { update(dt, t) { const tt = t < 4 ? t : (t % 6.5) + 0; const hit = t < 4 ? FL.find((f) => t >= f && t - dt < f) : (Math.abs(((t % 6.5)) - 0.1) < dt ? 0 : undefined); if (hit !== undefined) { fa = 1; bolt = mk(A(env.W * 0.2, env.W * 0.8, R)) } fa = Math.max(0, fa - dt * 4.2) },
      draw(c, t) { if (fa <= 0) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = fa * 0.22; c.fillStyle = env.P.d1; c.fillRect(0, 0, env.W, env.H); c.globalAlpha = fa; c.strokeStyle = env.P.d4; c.lineWidth = 6; c.lineJoin = 'round'; c.beginPath(); bolt.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](x, y)); c.globalAlpha = fa * 0.35; c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 1.8; c.globalAlpha = fa; c.stroke(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over' } }
  },
})
// ───────── Legendarios
def({
  slug: 'aurora-boreal', name: 'Aurora boreal', rarity: 'legendario', price: 5500, dur: 0, tint: 0.2, custom: true,
  palettes: P4([['boreal', 'Boreal', '#4FFFB0', '#040C1C', '#B8FFE6', '#B07CFF'], ['rosa', 'Aurora rosa', '#FF7AD0', '#0C0620', '#FFC2EC', '#7AD8FF'], ['azul', 'Hielo', '#5CC8FF', '#040A1C', '#C2ECFF', '#9AFFD0'], ['dorada', 'Dorada', '#FFD25C', '#10080C', '#FFF0B8', '#FF7A9A']]),
  create: (env) => ({ update() {}, draw(c, t) {
    const k = Math.min(1, t / 2); c.globalCompositeOperation = 'lighter'
    const cols = [env.P.d1, env.P.d4, env.P.d3]
    for (let b = 0; b < 3; b++) { for (let x = 0; x <= env.W; x += 3) { const ph = x * 0.012 + t * (0.5 + b * 0.18) + b * 2, y0 = env.H * (0.2 + b * 0.1) + Math.sin(ph) * 26 + Math.sin(ph * 2.3) * 10, h = (80 + Math.sin(x * 0.03 + t * 0.7 + b) * 40) * (0.7 + 0.3 * Math.sin(x * 0.02 - t + b)); const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.15, cols[b]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 0.16 * k; c.fillStyle = g; c.fillRect(x, y0, 3.2, h) } }
    c.globalAlpha = k * 0.9; c.fillStyle = '#fff'; for (let i = 0; i < 24; i++) { const x = (i * 97.3) % env.W, y = (i * 53.7) % (env.H * 0.6), s = 0.5 + ((Math.sin(t * 2 + i) + 1) / 2); c.globalAlpha = k * 0.7 * s; c.fillRect(x, y, 1.4, 1.4) }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over' } }),
})
def({
  slug: 'eclipse-total', name: 'Eclipse total', rarity: 'legendario', price: 6500, dur: 6, tint: 0, custom: true,
  palettes: P4([['dorada', 'Corona dorada', '#FFC94A', '#05030A', '#FFF0C0', '#FF7A3D'], ['azul', 'Corona azul', '#6BB8FF', '#03060F', '#DDF0FF', '#B48CFF'], ['carmesi', 'Corona carmesí', '#FF4A5E', '#0A0206', '#FFC8D0', '#FFB04A'], ['violeta', 'Corona violeta', '#B07CFF', '#07030F', '#EAD8FF', '#FF7AD0']]),
  create: (env) => ({ update() {}, draw(c, t) {
    const cx = env.W / 2, cy = env.H * 0.46, R = Math.min(env.W, env.H) * 0.17, k = Math.min(1, t / 3.2), ease = k * k * (3 - 2 * k)
    c.globalAlpha = 0.6 * ease; c.fillStyle = '#000'; c.fillRect(0, 0, env.W, env.H); c.globalAlpha = 1
    c.globalCompositeOperation = 'lighter'
    const cor = Math.max(0, (k - 0.55) / 0.45)
    glow(c, cx, cy, R * (2 + 2.4 * cor), env.P.d1, 0.25 + 0.6 * cor)
    c.save(); c.translate(cx, cy); c.rotate(t * 0.04)
    for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU, L = R * (1.5 + 1.2 * cor * (0.5 + 0.5 * Math.sin(i * 7.3 + t))); const g = c.createLinearGradient(Math.cos(a) * R, Math.sin(a) * R, Math.cos(a) * (R + L), Math.sin(a) * (R + L)); g.addColorStop(0, env.P.d1); g.addColorStop(1, 'rgba(0,0,0,0)'); c.strokeStyle = g; c.globalAlpha = cor * 0.8; c.lineWidth = 3.2; c.beginPath(); c.moveTo(Math.cos(a) * R, Math.sin(a) * R); c.lineTo(Math.cos(a) * (R + L), Math.sin(a) * (R + L)); c.stroke() }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'
    const sunX = cx - (1 - ease) * R * 4.2
    if (k < 1) { c.fillStyle = env.P.d3; c.globalAlpha = 1 - cor; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); c.globalAlpha = 1 }
    c.fillStyle = '#000'; c.beginPath(); c.arc(sunX, cy, R * 1.02, 0, TAU); c.fill()
    c.strokeStyle = env.P.d3; c.globalAlpha = cor; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, R * 1.02, 0, TAU); c.stroke(); c.globalAlpha = 1
    if (cor > 0.8) { c.globalCompositeOperation = 'lighter'; const dx = cx + R * 0.72, dy = cy - R * 0.72, q = 0.6 + 0.4 * Math.sin(t * 3); c.save(); c.translate(dx, dy); c.rotate(t * 0.5); c.fillStyle = '#fff'; c.globalAlpha = q; star(c, 4, R * 0.55, R * 0.06); c.fill(); c.restore(); glow(c, dx, dy, R * 0.5, '#fff', 0.6 * q); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1 } } }),
})
// ───────── Kits nuevos
def({
  slug: 'lluvia-carmesi', name: 'Lluvia carmesí', rarity: 'raro', price: 1500, dur: 0, tint: 0.28, coll: 'crimson',
  palettes: P4([['sangre', 'Sangre', '#D6102F', '#0C0306', '#FF9AAA', '#FFB07A'], ['vino', 'Vino tinto', '#8C1034', '#0A0208', '#E8A0B4', '#D9B25A'], ['rubi', 'Rubí', '#F0204A', '#08040A', '#FFC2CC', '#9A9AA8'], ['oxido', 'Óxido', '#E0481C', '#0E0503', '#FFD2A8', '#FFD25A']]),
  create: (env) => {
    const sp = []
    const base = system({ rate: 38, ambient: 7, max: 60,
      spawn: (R, e) => ({ x: A(0, e.W, R), y: A(-30, -4, R), vy: A(300, 480, R), r: A(1.6, 3.2, R), gy: A(e.H * 0.6, e.H - 3, R) }),
      step: (p, dt, t, e) => { p.y += p.vy * dt; if (p.y > p.gy) { if (sp.length < 20) sp.push({ x: p.x, y: p.gy, r: 1, a: 0.8 }); return false } return true },
      draw: (c, p, e) => { c.fillStyle = e.P.d1; c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * 2.6, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(p.x - p.r * 0.3, p.y - p.r, p.r * 0.35, 0, TAU); c.fill() } })(env)
    return { update(dt, t) { base.update(dt, t); for (let i = sp.length - 1; i >= 0; i--) { sp[i].r += 18 * dt; sp[i].a -= 1.5 * dt; if (sp[i].a <= 0) sp.splice(i, 1) } }, draw(c, t) { base.draw(c, t); c.strokeStyle = env.P.d1; c.lineWidth = 1.6; for (const r of sp) { c.globalAlpha = r.a; c.beginPath(); c.ellipse(r.x, r.y, r.r, r.r * 0.3, 0, 0, TAU); c.stroke() } c.globalAlpha = 1 } }
  },
})
def({
  slug: 'corazones-rotos', name: 'Corazones rotos', rarity: 'raro', price: 1600, dur: 0, tint: 0.1, coll: 'emo',
  palettes: P4([['negro-rosa', 'Negro y rosa', '#FF3D9A', '#0A070C', '#FFC4E3', '#B8B8C6'], ['negro-violeta', 'Negro y violeta', '#9B5CFF', '#0B0712', '#E0D0FF', '#C0C0CE'], ['negro-rojo', 'Negro y rojo', '#E5233A', '#0C0506', '#FFC4CB', '#BCBCC8'], ['monocromo', 'Monocromo', '#E8E8EE', '#07070A', '#FFFFFF', '#8A8A99']]),
  create: system({ rate: 5, ambient: 2.2, max: 40,
    spawn: (R, e) => ({ x: A(10, e.W - 10, R), y: -14, s: A(7, 14, R), vy: A(26, 56, R), ph: A(0, 6, R), sp: 0, r: A(-0.5, 0.5, R), vr: A(0.2, 0.8, R), c: R() < 0.6 ? e.P.d1 : e.P.d4 }),
    step: (p, dt, t, e) => { p.y += p.vy * dt; p.sp += dt * 8; p.r += p.vr * dt * 0.4; return p.y < e.H + 20 },
    draw: (c, p, e, t) => { const sp = Math.min(p.sp, 9); c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.lineWidth = 1.4; c.strokeStyle = p.c; c.fillStyle = '#0a070c'; for (const m of [-1, 1]) { c.save(); c.translate(m * sp * 0.7, sp * 0.2 * (m > 0 ? 1 : 0.2)); c.rotate(m * sp * 0.012); c.beginPath(); c.rect(m > 0 ? 0 : -p.s * 1.4, -p.s, p.s * 1.4, p.s * 2); c.clip(); c.scale(1, 1); heart(c, p.s); c.fill(); c.stroke(); c.restore() } c.restore() } }),
})

// ───────── Halloween (1.5.0)
const batD = (c, s, fl) => { const f2 = 0.35 + 0.65 * Math.abs(Math.sin(fl)); c.beginPath(); c.moveTo(0, -s * 0.2); c.quadraticCurveTo(-s * 0.4, -s * 0.5, -s * 0.6, -s * 0.2 * f2 - s * 0.1); c.quadraticCurveTo(-s * 1.0, -s * 0.5 * f2, -s * 1.5, -s * 0.1 * f2); c.quadraticCurveTo(-s * 1.1, s * 0.05, -s * 1.0, s * 0.3); c.quadraticCurveTo(-s * 0.7, s * 0.1, -s * 0.5, s * 0.3); c.quadraticCurveTo(-s * 0.2, s * 0.1, 0, s * 0.35); c.quadraticCurveTo(s * 0.2, s * 0.1, s * 0.5, s * 0.3); c.quadraticCurveTo(s * 0.7, s * 0.1, s * 1.0, s * 0.3); c.quadraticCurveTo(s * 1.1, s * 0.05, s * 1.5, -s * 0.1 * f2); c.quadraticCurveTo(s * 1.0, -s * 0.5 * f2, s * 0.6, -s * 0.2 * f2 - s * 0.1); c.quadraticCurveTo(s * 0.4, -s * 0.5, 0, -s * 0.2); c.closePath() }
const crossD = (c, s) => { c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.18, -s * 0.7); c.lineTo(s * 0.18, -s * 0.28); c.lineTo(s * 0.55, -s * 0.28); c.lineTo(s * 0.7, 0); c.lineTo(s * 0.55, s * 0.28); c.lineTo(s * 0.18, s * 0.28); c.lineTo(s * 0.18, s * 1.1); c.lineTo(-s * 0.18, s * 1.1); c.lineTo(-s * 0.18, s * 0.28); c.lineTo(-s * 0.55, s * 0.28); c.lineTo(-s * 0.7, 0); c.lineTo(-s * 0.55, -s * 0.28); c.lineTo(-s * 0.18, -s * 0.28); c.lineTo(-s * 0.18, -s * 0.7); c.closePath() }
const puff = (c, x, y, r, col, a) => glow(c, x, y, r, col, a)
def({
  slug: 'bandada-de-la-cripta', name: 'Bandada de la cripta', rarity: 'epico', price: 2400, dur: 5, tint: 0.3, coll: 'cripta',
  palettes: P4([['hueso', 'Hueso y sangre', '#C9CDD8', '#0C0709', '#F4EFE6', '#C0142E'], ['violeta', 'Violeta', '#B8A4F0', '#0A0714', '#F1ECFF', '#8A4CFF'], ['azul', 'Azul frío', '#9CC4F0', '#050A14', '#EAF4FF', '#2E7BFF'], ['ambar', 'Ámbar', '#E0C27A', '#0E0A04', '#FFF4D6', '#FF7A1F']]),
  create: (env) => {
    const fog = system({ rate: 5, ambient: 1.4, max: 22, spawn: (R, e) => ({ x: A(-20, e.W + 20, R), y: e.H + 30, r: A(40, 90, R), vy: A(-30, -14, R), vx: A(-10, 10, R), a: A(0.14, 0.26, R) }), step: (p, dt, t, e) => { p.y += p.vy * dt; p.x += p.vx * dt; return p.y > -60 }, draw: (c, p, e) => puff(c, p.x, p.y, p.r, e.P.d1, p.a) })(env)
    const bats = system({ rate: 7, ambient: 0.9, max: 16, spawn: (R, e) => { const dir = R() < 0.5 ? 1 : -1; return { x: dir > 0 ? -20 : e.W + 20, y: A(e.H * 0.1, e.H * 0.8, R), vx: dir * A(70, 150, R), s: A(5, 9, R), ph: A(0, 6, R), w: A(0, 30, R), dir, a: A(0, 1, R) } }, step: (p, dt, t, e) => { p.x += p.vx * dt; p.y += Math.sin(t * 2.2 + p.ph) * 26 * dt; return p.x > -40 && p.x < e.W + 40 }, draw: (c, p, e, t) => { c.save(); c.translate(p.x, p.y); c.scale(p.dir, 1); c.fillStyle = '#0d0a10'; c.strokeStyle = e.P.d1; c.lineWidth = 1; batD(c, p.s, t * 16 + p.ph); c.fill(); c.stroke(); c.restore() } })(env)
    return { update(dt, t) { fog.update(dt, t); bats.update(dt, t) }, draw(c, t) { fog.draw(c, t); bats.draw(c, t) } }
  },
})
def({
  slug: 'lluvia-de-cruces', name: 'Lluvia de cruces', rarity: 'raro', price: 1600, dur: 0, tint: 0.12, coll: 'cruces',
  palettes: P4([['plata', 'Plata', '#D4D8E4', '#070708', '#FFFFFF', '#7A86A8'], ['sangre', 'Plata y sangre', '#CFCFD8', '#0A0507', '#FFFFFF', '#C41E3A'], ['oro', 'Oro viejo', '#E8CC8A', '#0A0804', '#FFF2CC', '#8A5A10'], ['violeta', 'Violeta', '#C4B0F0', '#07050F', '#FFFFFF', '#6A3CD0']]),
  create: system({ rate: 9, ambient: 2.4, max: 40,
    spawn: (R, e) => ({ x: A(8, e.W - 8, R), y: -16, s: A(4, 9, R), vy: A(26, 60, R), ph: A(0, 6, R), r: A(-0.5, 0.5, R), vr: A(-0.8, 0.8, R), c: R() < 0.75 ? e.P.d1 : e.P.d4 }),
    step: (p, dt, t, e) => { p.y += p.vy * dt; p.x += Math.sin(t * 1.2 + p.ph) * 12 * dt; p.r += p.vr * dt * 0.3; return p.y < e.H + 20 },
    draw: (c, p, e, t) => { c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.shadowColor = p.c; c.shadowBlur = 6; c.fillStyle = p.c; c.strokeStyle = '#000'; c.lineWidth = 0.8; crossD(c, p.s); c.fill(); c.stroke(); c.restore(); const g = Math.max(0, Math.sin(t * 3 + p.ph)); if (g > 0.85) { c.fillStyle = '#fff'; c.globalAlpha = (g - 0.85) * 6; c.beginPath(); c.arc(p.x, p.y - p.s * 0.4, 1.6, 0, TAU); c.fill(); c.globalAlpha = 1 } } }),
})
def({
  slug: 'calabazas-flotantes', name: 'Calabazas flotantes', rarity: 'comun', price: 900, dur: 0, tint: 0.1, coll: 'calabaza',
  palettes: P4([['naranja', 'Naranja', '#FF8A1F', '#140D08', '#FFC46B', '#8B8B84'], ['violeta', 'Violeta bruja', '#A855F7', '#0E0816', '#E0C4FF', '#7CFF4D'], ['toxico', 'Tóxico', '#7CFF4D', '#08120A', '#D8FFC4', '#FF8A1F'], ['sangre', 'Sangre', '#E03030', '#140808', '#FFB0A8', '#D8D0C0']]),
  create: system({ rate: 4, ambient: 1.6, max: 20,
    spawn: (R, e) => ({ x: A(14, e.W - 14, R), y: e.H + 16, s: A(7, 13, R), vy: A(-44, -20, R), ph: A(0, 6, R), spark: R() < 0.45 }),
    step: (p, dt, t, e) => { p.y += p.vy * dt; p.x += Math.sin(t * 1.4 + p.ph) * 14 * dt; return p.y > -24 },
    draw: (c, p, e, t) => { if (p.spark) { c.fillStyle = e.P.d3; c.globalAlpha = 0.9; c.beginPath(); c.arc(p.x, p.y, 1.6, 0, TAU); c.fill(); c.globalAlpha = 1; return } glow(c, p.x, p.y, p.s * 2.2, e.P.d1, 0.45); c.save(); c.translate(p.x, p.y); c.rotate(Math.sin(t * 2 + p.ph) * 0.2); c.fillStyle = e.P.d1; c.beginPath(); c.ellipse(0, 0, p.s, p.s * 0.84, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, p.s * 0.4, p.s * 0.82, 0, 0, TAU); c.stroke(); c.fillStyle = e.P.d3; c.globalAlpha = 0.8 + 0.2 * Math.sin(t * 5 + p.ph); c.beginPath(); c.moveTo(-p.s * 0.5, -p.s * 0.1); c.lineTo(-p.s * 0.2, -p.s * 0.4); c.lineTo(-p.s * 0.1, -p.s * 0.05); c.moveTo(p.s * 0.5, -p.s * 0.1); c.lineTo(p.s * 0.2, -p.s * 0.4); c.lineTo(p.s * 0.1, -p.s * 0.05); c.moveTo(-p.s * 0.5, p.s * 0.25); c.lineTo(0, p.s * 0.5); c.lineTo(p.s * 0.5, p.s * 0.25); c.lineTo(0, p.s * 0.35); c.fill(); c.restore(); c.globalAlpha = 1 } }),
})
def({
  slug: 'parvada-de-cuervos', name: 'Parvada de cuervos', rarity: 'epico', price: 2500, dur: 5, tint: 0.3, coll: 'cuervo',
  palettes: P4([['plata', 'Plata y noche', '#D5DAE5', '#07080C', '#FFFFFF', '#7C8499'], ['sangre', 'Plata y rubí', '#D8D2D8', '#0A0508', '#FFFFFF', '#C41E3A'], ['violeta', 'Amatista', '#C8B4F8', '#08060F', '#FFFFFF', '#7A4CE0'], ['oro', 'Oro negro', '#E6C888', '#0A0804', '#FFF2CC', '#8A5A10']]),
  create: (env) => {
    const fea = []
    const base = system({ rate: 9, ambient: 1.2, max: 16, spawn: (R, e) => ({ x: -20, y: A(e.H * 0.1, e.H * 0.7, R), vx: A(90, 170, R), s: A(6, 11, R), ph: A(0, 6, R), up: A(-18, 4, R) }), step: (p, dt, t, e) => { p.x += p.vx * dt; p.y += p.up * dt + Math.sin(t * 1.8 + p.ph) * 14 * dt; if (Math.random() < dt * 0.8 && fea.length < 14) fea.push({ x: p.x, y: p.y, vy: A(16, 34, Math.random), a: 1, r: A(0, 6, Math.random) }); return p.x < e.W + 30 }, draw: (c, p, e, t) => { c.save(); c.translate(p.x, p.y); c.fillStyle = '#030305'; c.strokeStyle = e.P.d1; c.lineWidth = 0.7; batD(c, p.s, t * 12 + p.ph); c.fill(); c.stroke(); c.fillStyle = e.P.d4; c.beginPath(); c.arc(p.s * 0.1, -p.s * 0.1, 0.9, 0, TAU); c.fill(); c.restore() } })(env)
    return { update(dt, t) { base.update(dt, t); for (let i = fea.length - 1; i >= 0; i--) { const q = fea[i]; q.y += q.vy * dt; q.x += Math.sin(t * 2 + q.r) * 10 * dt; q.a -= 0.4 * dt; if (q.a <= 0) fea.splice(i, 1) } }, draw(c, t) { base.draw(c, t); for (const q of fea) { c.save(); c.translate(q.x, q.y); c.rotate(q.r + t); c.globalAlpha = q.a; c.fillStyle = '#050507'; c.strokeStyle = env.P.d1; c.lineWidth = 0.6; c.beginPath(); c.ellipse(0, 0, 1.6, 6, 0, 0, TAU); c.fill(); c.stroke(); c.restore() } c.globalAlpha = 1 } }
  },
})
def({
  slug: 'petalos-y-perlas', name: 'Pétalos y perlas', rarity: 'raro', price: 1700, dur: 0, tint: 0.1, coll: 'barroco',
  palettes: P4([['grafito', 'Grafito', '#BFC3CC', '#0C0C0F', '#FFFFFF', '#6C707A'], ['sepia', 'Sepia', '#D6BE98', '#0D0A06', '#FFF4DC', '#7A5A34'], ['rosa', 'Rosa ceniza', '#E3B8C4', '#0C0709', '#FFEAF0', '#8A5A68'], ['acero', 'Azul acero', '#A8C4DE', '#06090D', '#EAF4FF', '#4A6A8A']]),
  create: system({ rate: 10, ambient: 2.6, max: 44,
    spawn: (R, e) => ({ x: A(0, e.W, R), y: -12, s: A(5, 10, R), vy: A(22, 50, R), ph: A(0, 6, R), r: A(0, 6, R), vr: A(-2, 2, R), pearl: R() < 0.25 }),
    step: (p, dt, t, e) => { p.y += p.vy * dt; p.x += Math.sin(t * 1.1 + p.ph) * 22 * dt; p.r += p.vr * dt; return p.y < e.H + 16 },
    draw: (c, p, e, t) => { c.save(); c.translate(p.x, p.y); if (p.pearl) { const g = c.createRadialGradient(-p.s * 0.1, -p.s * 0.1, 0, 0, 0, p.s * 0.4); g.addColorStop(0, '#fff'); g.addColorStop(1, e.P.d1); c.fillStyle = g; c.beginPath(); c.arc(0, 0, p.s * 0.4, 0, TAU); c.fill() } else { c.rotate(p.r); c.scale(1, Math.cos(t * 2 + p.ph) * 0.6 + 0.4); c.fillStyle = e.P.d1; c.strokeStyle = e.P.d4; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, p.s); c.bezierCurveTo(-p.s, p.s * 0.5, -p.s * 0.8, -p.s * 0.8, 0, -p.s); c.bezierCurveTo(p.s * 0.8, -p.s * 0.8, p.s, p.s * 0.5, 0, p.s); c.fill(); c.stroke() } c.restore() } }),
})
def({
  slug: 'niebla-del-bosque', name: 'Niebla del bosque', rarity: 'epico', price: 2400, dur: 0, tint: 0.3, coll: 'creepy',
  palettes: P4([['niebla', 'Niebla', '#B9C4C0', '#070A09', '#E8F0EC', '#8A9A94'], ['sangre', 'Niebla roja', '#D0A8A8', '#0B0606', '#FFE8E4', '#B01818'], ['verde', 'Enfermizo', '#A8D080', '#070B05', '#EEFFD8', '#5E8A2E'], ['azul', 'Frío', '#9CB8D8', '#05080D', '#E6F0FF', '#4A6A96']]),
  create: (env) => {
    const fog = system({ rate: 6, ambient: 1.8, max: 26, spawn: (R, e) => ({ x: -60, y: A(e.H * 0.35, e.H + 10, R), r: A(50, 110, R), vx: A(12, 34, R), a: A(0.1, 0.22, R) }), step: (p, dt, t, e) => { p.x += p.vx * dt; return p.x < e.W + 120 }, draw: (c, p, e) => puff(c, p.x, p.y, p.r, e.P.d1, p.a) })(env)
    let fl = 0, nx = 1.2
    return { update(dt, t) { fog.update(dt, t); fl = Math.max(0, fl - dt * 6); if (t > nx) { fl = 1; nx = t + 1.4 + Math.random() * 2.4 } }, draw(c, t) { fog.draw(c, t); if (fl > 0) { c.globalAlpha = fl * 0.5; c.fillStyle = env.P.d3; for (let i = 0; i < 6; i++) { const y = ((Math.sin(t * 91 + i * 7.3) * 0.5 + 0.5) * env.H) | 0; c.fillRect(0, y, env.W, 1 + (i % 3)) } c.globalAlpha = 1 } c.globalAlpha = 0.07; c.fillStyle = env.P.d3; for (let i = 0; i < 20; i++) c.fillRect(((Math.sin(t * 13 + i * 9.7) * 0.5 + 0.5) * env.W) | 0, ((Math.sin(t * 7 + i * 3.1) * 0.5 + 0.5) * env.H) | 0, 2, 1); c.globalAlpha = 1 } }
  },
})
def({
  slug: 'tinta-y-luna', name: 'Tinta y luna', rarity: 'epico', price: 2400, dur: 5, tint: 0.35, coll: 'creepy',
  palettes: P4([['tinta', 'Tinta y sangre', '#F2F2F2', '#060606', '#FFFFFF', '#B3141E'], ['blanco', 'Blanco y negro', '#F2F2F2', '#060606', '#FFFFFF', '#9A9AA2'], ['azul', 'Tinta azul', '#E4ECF8', '#05070B', '#FFFFFF', '#2E5CC0'], ['verde', 'Tinta tóxica', '#E8F4E0', '#050805', '#FFFFFF', '#3E9A28']]),
  create: (env) => {
    const drops = system({ rate: 10, ambient: 2, max: 30, spawn: (R, e) => ({ x: A(0, e.W, R), y: -10, vy: A(80, 180, R), r: A(1.6, 3.6, R), c: R() < 0.3 ? e.P.d4 : '#000', tr: A(10, 40, R) }), step: (p, dt) => { p.y += p.vy * dt; return p.y < env.H + 30 }, draw: (c, p, e) => { c.fillStyle = p.c; c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * 1.8, 0, 0, TAU); c.fill(); c.fillRect(p.x - p.r * 0.35, p.y - p.tr, p.r * 0.7, p.tr) } })(env)
    return { update(dt, t) { drops.update(dt, t) }, draw(c, t) { const k = Math.min(1, t / 1.2); c.fillStyle = '#000'; c.globalAlpha = 0.9 * (t < 4 ? k : Math.max(0.5, 1 - (t - 4) * 0.2)); c.fillRect(0, 0, env.W, 16 + 22 * k); for (let i = 0; i < 9; i++) { const x = (i + 0.5) * env.W / 9, h = 16 + k * (24 + 38 * Math.abs(Math.sin(i * 2.3))), w = 4 + (i % 3) * 2; c.fillRect(x - w / 2, 0, w, h); c.beginPath(); c.arc(x, h, w / 2, 0, TAU); c.fill() } c.globalAlpha = 1; drops.draw(c, t); const mx = env.W * 0.82, my = env.H * 0.2, mr = Math.min(env.W, env.H) * 0.07; glow(c, mx, my, mr * 4, env.P.d3, 0.35 * k); c.fillStyle = env.P.d3; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill(); c.fillStyle = '#000'; c.globalAlpha = 0.9; c.beginPath(); c.arc(mx + mr * 0.45, my - mr * 0.15, mr * 0.9, 0, TAU); c.fill(); c.globalAlpha = 1 } }
  },
})
def({
  slug: 'glitch-de-senal', name: 'Glitch de señal', rarity: 'epico', price: 2400, dur: 4, tint: 0.2, coll: 'creepy',
  palettes: P4([['rojo', 'Duotono rojo', '#B8433B', '#090404', '#F4D6D0', '#FFFFFF'], ['cian', 'Señal cian', '#2EC4D6', '#030A0B', '#CFF8FF', '#FFFFFF'], ['crt', 'Fósforo', '#3DFF7A', '#030B05', '#C8FFD8', '#FFFFFF'], ['violeta', 'Ultravioleta', '#A66CFF', '#08050F', '#E6D4FF', '#FFFFFF']]),
  create: system({ rate: 46, ambient: 9, max: 60, intro: 3,
    spawn: (R, e) => ({ x: A(-20, e.W, R), y: A(0, e.H, R), w: A(30, e.W * 0.7, R), h: A(2, 18, R), life: A(0.15, 0.8, R), c: R() < 0.6 ? e.P.d1 : e.P.d3, a: A(0.25, 0.7, R), sh: A(-24, 24, R) }),
    step: (p, dt) => { p.life -= dt; p.x += p.sh * dt * 4; return p.life > 0 },
    draw: (c, p, e, t) => { c.globalAlpha = p.a; c.fillStyle = p.c; c.fillRect(p.x, p.y, p.w, p.h); if (p.h < 6) { c.fillStyle = '#fff'; c.globalAlpha = p.a * 0.5; c.fillRect(p.x + 3, p.y, p.w * 0.4, 1) } c.globalAlpha = 1 } }),
})
def({
  slug: 'ceniza-cayendo', name: 'Ceniza cayendo', rarity: 'raro', price: 1500, dur: 0, tint: 0.15, coll: 'creepy',
  palettes: P4([['ceniza', 'Ceniza', '#F2F2F2', '#060606', '#FFFFFF', '#8A8A92'], ['rosa', 'Ceniza rosa', '#F5D0DE', '#09050A', '#FFF0F6', '#C04070'], ['sangre', 'Ceniza roja', '#F0D0D0', '#0B0505', '#FFF0F0', '#B01818'], ['azul', 'Ceniza azul', '#D4E4F8', '#05070B', '#F0F8FF', '#4A74C0']]),
  create: system({ rate: 22, ambient: 5, max: 60,
    spawn: (R, e) => ({ x: A(-10, e.W + 10, R), y: -6, r: A(0.8, 2.8, R), vy: A(14, 40, R), vx: A(-4, 22, R), ph: A(0, 6, R), ember: R() < 0.12, a: A(0.4, 0.95, R) }),
    step: (p, dt, t, e) => { p.y += p.vy * dt; p.x += (p.vx + Math.sin(t * 1.5 + p.ph) * 12) * dt; return p.y < e.H + 8 },
    draw: (c, p, e) => { c.globalAlpha = p.a; if (p.ember) glow(c, p.x, p.y, p.r * 4, e.P.d4, 0.7); c.fillStyle = p.ember ? e.P.d4 : e.P.d1; c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * 0.7, p.ph, 0, TAU); c.fill(); c.globalAlpha = 1 } }),
})
def({
  slug: 'bruma-y-estrellas-azules', name: 'Bruma y estrellas azules', rarity: 'legendario', price: 5000, dur: 5, tint: 0.35, coll: 'vampiro',
  palettes: P4([['bruma', 'Bruma azul', '#7FD6E6', '#06151C', '#CFF3F8', '#3F7FA6'], ['noche', 'Noche azul', '#6FA0FF', '#060A1E', '#D4E2FF', '#9A7CFF'], ['hielo', 'Hielo', '#B8E8F0', '#06141A', '#F0FCFF', '#4A9AB8'], ['menta', 'Menta', '#6FE0C0', '#04140F', '#D0FFF0', '#2A8A78']]),
  create: (env) => {
    const fog = system({ rate: 6, ambient: 1.4, max: 22, spawn: (R, e) => ({ x: A(-20, e.W + 20, R), y: A(e.H * 0.3, e.H + 20, R), r: A(50, 100, R), vx: A(-16, 16, R), vy: A(-14, -4, R), a: A(0.12, 0.26, R) }), step: (p, dt, t, e) => { p.x += p.vx * dt; p.y += p.vy * dt; return p.y > -80 }, draw: (c, p, e) => puff(c, p.x, p.y, p.r, e.P.d1, p.a) })(env)
    const stars = system({ rate: 9, ambient: 2, max: 34, spawn: (R, e) => ({ x: A(10, e.W - 10, R), y: e.H + 12, s: A(5, 12, R), vy: A(-60, -26, R), ph: A(0, 6, R), r: A(0, 6, R), vr: A(-1.2, 1.2, R), tw: R() < 0.4 }), step: (p, dt, t, e) => { p.y += p.vy * dt; p.x += Math.sin(t * 1.3 + p.ph) * 14 * dt; p.r += p.vr * dt; return p.y > -20 }, draw: (c, p, e, t) => { c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.shadowColor = e.P.d1; c.shadowBlur = 8; c.strokeStyle = e.P.d3; c.lineWidth = 1.6; c.lineJoin = 'round'; if (p.tw) { c.fillStyle = e.P.d3; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5 + p.ph); star(c, 4, p.s, p.s * 0.2); c.fill() } else { star(c, 5, p.s, p.s * 0.42); c.stroke() } c.restore(); c.globalAlpha = 1 } })(env)
    return { update(dt, t) { fog.update(dt, t); stars.update(dt, t) }, draw(c, t) { fog.draw(c, t); stars.draw(c, t); c.strokeStyle = env.P.d3; c.globalAlpha = 0.3; c.lineWidth = 1; c.save(); c.translate(env.W / 2, env.H * 0.45); c.rotate(-0.25); c.beginPath(); c.ellipse(0, 0, env.W * 0.48, env.H * 0.14, 0, 0, TAU); c.stroke(); c.restore(); c.globalAlpha = 1 } }
  },
})

// ───────── API pública
export function startEntry(effect, canvas, { paletteId, hue = 0, loop = true, seed = 7, reduced = false, onFrame } = {}) {
  const def_ = effect.palettes.find((p) => p.id === paletteId) || effect.palettes[0]
  const P = makePalette(def_, hue)
  const dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1)
  const W = canvas.clientWidth || canvas.width, H = canvas.clientHeight || canvas.height
  canvas.width = W * dpr; canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  let sim, t, raf, stopped = false, last
  const fresh = () => { sim = effect.create({ W, H, P, R: rng(seed) }); t = 0 }
  const frame = () => { ctx.clearRect(0, 0, W, H); sim.draw(ctx, t) }
  const advance = (to) => { const st = 1 / 60; while (t < to) { sim.update(st, t); t += st } }
  fresh()
  if (reduced) { advance(effect.dur ? effect.dur : 4); frame(); return { stop() {}, seek() {} } }
  const tick = (now) => {
    if (stopped) return
    const dt = Math.min(0.05, ((now - (last || now)) / 1000) || 0.016); last = now
    sim.update(dt, t); t += dt
    if (loop && effect.dur && t > effect.dur + 1.2) fresh()
    frame(); if (onFrame) onFrame(t); raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return { stop() { stopped = true; cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H) }, seek(s) { fresh(); advance(s); frame() } }
}
