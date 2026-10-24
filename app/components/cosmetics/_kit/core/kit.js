// @ts-nocheck
// Atajos para declarar decoraciones: paletas, CSS de animación, etc.
export const pal = (id, name, d1, d2, d3, d4) => ({ id, name, c: [d1, d2, d3, d4] })
// CSS: giro continuo alrededor del centro del avatar (el grupo se dibuja con (0,0)=centro)
export const spin = (cls, name, sec, rev = false, ease = 'linear') =>
  `.${cls}{transform-box:view-box;transform-origin:0 0;animation:${name} ${sec}s ${ease} infinite${rev ? ' reverse' : ''}}@keyframes ${name}{to{transform:rotate(360deg)}}`
// CSS: animación sobre el centro del propio elemento (parpadeo, pulso, flotar)
export const selfc = (cls) => `.${cls}{transform-box:fill-box;transform-origin:50% 50%}`
export const KF = (name, body) => `@keyframes ${name}{${body}}`

// CSS base que carga UNA sola vez la app (clases compartidas por muchos diseños).
export const BASE_CSS = `
.dpw .dpl svg{display:block}
.k-tw{transform-box:fill-box;transform-origin:50% 50%;animation:k-tw 3.2s ease-in-out infinite}
@keyframes k-tw{0%,100%{transform:scale(.3);opacity:.3}50%{transform:scale(1);opacity:1}}
.k-fl{animation:k-fl 4.2s ease-in-out infinite alternate}
@keyframes k-fl{from{transform:translateY(-3px)}to{transform:translateY(3px)}}
.k-pu{animation:k-pu 3.6s ease-in-out infinite}
@keyframes k-pu{0%,100%{opacity:.5}50%{opacity:1}}
.k-br{transform-box:fill-box;transform-origin:50% 50%;animation:k-br 4.2s ease-in-out infinite}
@keyframes k-br{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
.k-sp{transform-box:view-box;transform-origin:0 0;animation:k-sp 60s linear infinite}
.k-spr{animation-direction:reverse}
@keyframes k-sp{to{transform:rotate(360deg)}}
.k-sw{animation:k-sw 6s ease-in-out infinite alternate}
@keyframes k-sw{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}
.ob-x{animation:ob-x 10s cubic-bezier(.37,0,.63,1) infinite alternate}
@keyframes ob-x{from{transform:translateX(var(--rx))}to{transform:translateX(calc(var(--rx) * -1))}}
.ob-y{animation:ob-y 10s cubic-bezier(.37,0,.63,1) infinite alternate}
@keyframes ob-y{from{transform:translateY(calc(var(--ry) * -1))}to{transform:translateY(var(--ry))}}
.ob-s{animation:ob-s 10s cubic-bezier(.37,0,.63,1) infinite alternate}
@keyframes ob-s{from{transform:scale(var(--k0))}to{transform:scale(var(--k1))}}
.ob-vf{animation:ob-vf 10s linear infinite}
@keyframes ob-vf{0%,49.9%{opacity:1}50%,100%{opacity:0}}
.ob-vb{animation:ob-vb 10s linear infinite}
@keyframes ob-vb{0%,49.9%{opacity:0}50%,100%{opacity:1}}
.dpw[data-live="0"] .dpl *{animation-play-state:paused!important}
.dpw[data-static="1"] .dpl *{animation:none!important}
@media (prefers-reduced-motion:reduce){.dpw .dpl *{animation:none!important}}
`
