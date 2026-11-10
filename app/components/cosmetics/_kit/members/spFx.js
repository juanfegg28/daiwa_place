// @ts-nocheck
// Ayudantes de dibujo (canvas) para los efectos de entrada de MIEMBROS. Copias locales: el motor no los exporta.
import { rgba } from '../core/color.js'

export const TAU = Math.PI * 2
export const A = (a, b, R) => a + (b - a) * R()
export const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
export const ease = (v) => 1 - Math.pow(1 - v, 3)
export const easeIO = (v) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2)
/** 0→1→0 con forma de campana entre a y b */
export const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI))

/** Resplandor radial suave (col en hex) */
export function glow(c, x, y, r, col, a) {
  if (r <= 0 || a <= 0) return
  const g = c.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, rgba(col, 1)); g.addColorStop(0.35, rgba(col, 0.45)); g.addColorStop(1, rgba(col, 0))
  c.save(); c.globalAlpha = Math.min(1, a); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore()
}
/** Destello de 4 puntas con halo */
export function sparkle(c, x, y, r, col, a, rot = 0) {
  if (a <= 0 || r <= 0) return
  c.save(); c.globalCompositeOperation = 'lighter'
  glow(c, x, y, r * 3, col, a * 0.55)
  c.globalAlpha = Math.min(1, a); c.translate(x, y); c.rotate(rot)
  c.fillStyle = '#fff'; c.beginPath()
  for (let i = 0; i < 8; i++) { const ang = (i * Math.PI) / 4, rr = i % 2 ? r * 0.28 : r * 1.5; c[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * rr, Math.sin(ang) * rr) }
  c.closePath(); c.fill(); c.restore()
}
/** Pétalo (origen en la base, apunta hacia -y) */
export const petalPath = (c, s) => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-s * 0.95, -s * 0.2, -s, -s * 0.8, -s * 0.28, -s); c.lineTo(0, -s * 0.88); c.lineTo(s * 0.28, -s); c.bezierCurveTo(s, -s * 0.8, s * 0.95, -s * 0.2, 0, 0); c.closePath() }
/** Luna creciente (abierta hacia la derecha) de radio r */
export const crescentPath = (c, r) => { c.beginPath(); c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, true); c.bezierCurveTo(r * 0.52, r * 0.62, r * 0.52, -r * 0.62, 0, -r); c.closePath() }
/** Perla con degradado esférico y reflejo */
export function pearl(c, x, y, r, col, a = 1) {
  c.save(); c.globalAlpha = a
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r)
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, col); g.addColorStop(1, 'rgba(60,40,60,.55)')
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill()
  c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x - r * 0.34, y - r * 0.38, r * 0.22, 0, TAU); c.fill()
  c.restore()
}
