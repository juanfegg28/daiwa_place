// @ts-nocheck
// RÉPLICA del perfil real de DaiwaPlace (cabecera + bio + música + identidad + chips + contadores) para probar las tarjetas
// en contexto. Todo mide con cqw (% del ancho de la tarjeta), así se ve bien de 360 a 935 px, como el perfil real.
import { esc } from '../core/util.js'
import { skinHTML } from './kit.js'
import { DEFAULT_PHOTO } from '../avatar/render.js'

// Banners "del usuario" para probar choques de color. El último imita uno oscuro, en blanco y negro, con murciélagos.
const batsSVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 200' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#5c5c60'/><stop offset='1' stop-color='#2b2b2f'/></linearGradient><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 .6 0 0 0 0 .6 0 0 0 0 .6 0 0 0 .5 0'/></filter></defs><rect width='600' height='200' fill='url(#g)'/><rect width='600' height='200' filter='url(#n)'/><g fill='#101012'><path d='M380 200V120l14-30 14 30v80zM480 200V80l16-62 16 62v80z'/><g id='b'><path d='M0 0q10-10 20 0q10-6 20 4q-10 0-14 8q-6-6-12 2q-4-8-14-8q10-6 20-6z' transform='translate(70 40)'/><path d='M0 0q10-10 20 0q10-6 20 4q-10 0-14 8q-6-6-12 2q-4-8-14-8q10-6 20-6z' transform='translate(190 90) scale(1.3)'/><path d='M0 0q10-10 20 0q10-6 20 4q-10 0-14 8q-6-6-12 2q-4-8-14-8q10-6 20-6z' transform='translate(300 30) scale(.8)'/><path d='M0 0q10-10 20 0q10-6 20 4q-10 0-14 8q-6-6-12 2q-4-8-14-8q10-6 20-6z' transform='translate(540 60) scale(1.1)'/></g></g></svg>`
export const DEMO_BANNERS = [
  { id: 'bn', name: 'B/N murciélagos', css: `url('data:image/svg+xml,${encodeURIComponent(batsSVG).replace(/'/g, '%27')}') center/cover` },
  { id: 'az', name: 'Azul-rosa', css: 'linear-gradient(120deg,#2d6cdf,#8e44ec 55%,#f0509b)' },
  { id: 'sol', name: 'Atardecer', css: 'radial-gradient(circle at 30% 30%,#ffd166,#ef476f 60%,#5b2a86)' },
  { id: 'mar', name: 'Turquesa', css: 'linear-gradient(160deg,#0f2027,#2c5364 60%,#7dd3c0)' },
  { id: 'cl', name: 'Claro', css: 'repeating-linear-gradient(45deg,#e9e9ef 0 14px,#d6d6e0 14px 28px)' },
]

export const MOCK_CSS = `
.pm-w{width:100%;max-width:var(--pw,935px);margin:0 auto;container-type:inline-size}
.pm-ban{height:clamp(120px,20cqw,190px);background-size:cover;background-position:center;position:relative}
.pm-ban:after{content:'tu banner';position:absolute;right:10px;top:8px;font:600 10px/1 system-ui;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.75);background:rgba(0,0,0,.35);padding:4px 8px;border-radius:99px}
.pm{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;--av:clamp(92px,16cqw,150px);font-size:clamp(13px,1.8cqw,16.5px);line-height:1.45}
.pm-top{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:calc(var(--av) / -2)}
.pm-av{width:var(--av);height:var(--av);border-radius:50%;flex:none;position:relative;box-shadow:0 0 0 clamp(3px,.6cqw,6px) var(--sk-base)}
.pm-av svg{width:100%;height:100%;border-radius:50%;display:block}
.pm-av.dec{box-shadow:none;overflow:visible}
.pm-act{display:flex;gap:8px;align-items:center;padding-bottom:6px}
.pm-ib{width:clamp(34px,5cqw,44px);height:clamp(34px,5cqw,44px);border-radius:50%;border:1px solid var(--sk-line);background:var(--sk-panel-2);display:grid;place-items:center;font-size:.95em;color:var(--sk-ink)}
.pm-btn{padding:.62em 1.2em;border-radius:99px;border:1px solid var(--sk-line);background:var(--sk-panel-2);font-weight:600;font-size:.92em}
.pm-name{margin-top:.7em;display:flex;align-items:center;gap:.6em;flex-wrap:wrap;font-size:clamp(22px,3.5cqw,33px);font-weight:700;line-height:1.1;letter-spacing:-.01em}
.pm-tag{font-size:.4em;font-weight:700;letter-spacing:.01em;padding:.45em .9em;border-radius:99px;background:linear-gradient(180deg,#f8d36a,#e0a72b);color:#3b2a06;border:1px solid #fff3;white-space:nowrap}
.pm-hd{color:var(--sk-mute);margin-top:.15em;font-size:.95em}
.pm-box{margin-top:1.1em;border:1px solid var(--sk-line);background:var(--sk-panel);border-radius:clamp(16px,2.6cqw,24px);padding:clamp(14px,2.6cqw,24px);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.pm-bio{margin:0;color:var(--sk-ink);font-size:1.02em}
.pm-music{margin-top:1em;display:inline-flex;align-items:center;gap:.7em;border:1px solid var(--sk-line);background:var(--sk-chip);border-radius:99px;padding:.35em 1em .35em .35em;max-width:100%}
.pm-play{width:2.5em;height:2.5em;border-radius:50%;background:rgba(255,255,255,.16);display:grid;place-items:center;font-size:.8em;flex:none}
.pm-music b{font-weight:700}.pm-music span{color:var(--sk-mute);font-size:.88em}
.pm-id{margin-top:1.1em;border:1px solid var(--sk-line);background:var(--sk-panel);border-radius:clamp(16px,2.6cqw,24px);padding:clamp(12px,2.2cqw,20px) clamp(14px,2.6cqw,24px);display:flex;justify-content:space-between;align-items:center;gap:12px}
.pm-id small{display:block;font-size:.66em;letter-spacing:.18em;font-weight:700;color:var(--sk-mute)}
.pm-id h4{margin:.15em 0;font:600 clamp(18px,2.6cqw,24px)/1.1 Georgia,serif;font-variant:small-caps;letter-spacing:.04em}
.pm-id p{margin:0;color:var(--sk-mute);font-size:.9em}
.pm-chips{margin-top:1.1em;display:flex;gap:8px;flex-wrap:wrap}
.pm-chip{padding:.5em 1em;border-radius:99px;border:1px solid var(--sk-line);background:var(--sk-chip);font-size:.84em;font-weight:600;color:var(--sk-ink)}
.pm-since{margin-top:.9em;color:var(--sk-mute);font-size:.84em}
.pm-counts{margin-top:.6em;display:flex;gap:1.4em;flex-wrap:wrap;color:var(--sk-mute)}.pm-counts b{color:var(--sk-ink);font-weight:700}
`

const BIO = '🎸 3年生 · 音楽部 · Rock / Visual Kei<br>☕ 音楽 / 読書 / コーヒー<br>Colecciono estrellas, playlists y atardeceres.<br>静かな方が好き'
// Contenido de adentro de la tarjeta (lo que en la app son los bloques reales del perfil)
export function profileInner(o = {}) {
  const name = esc(o.name || 'Luna Valdés')
  return `<div class="pm"${o.avSize ? ` style="--av:${o.avSize}px"` : ''}><div class="pm-top"><div class="pm-av${o.avatar ? ' dec' : ''}">${o.avatar || DEFAULT_PHOTO}</div><div class="pm-act"><span class="pm-ib">◷</span><span class="pm-ib">✦</span><span class="pm-btn">Editar perfil</span></div></div>
<div class="pm-name">${o.nameHTML || `<span style="font-family:Georgia,serif">${name}</span>`}${o.titleHTML || `<span class="pm-tag">Creador de DaiwaPlace</span>`}</div><div class="pm-hd">@lunavaldes</div>
<div class="pm-box"><p class="pm-bio">${o.bio || BIO}</p><div class="pm-music"><span class="pm-play">▶</span><b>Bury Me Deep Inside Your Heart</b><span>· HIM ↗</span></div></div>
<div class="pm-id"><div><small>✦ IDENTIDAD</small><h4>Vampiro/a</h4><p>Año de conversión: <b>1888</b></p></div><svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M12 8l3 14 3-14M22 8l3 14 3-14" fill="none" stroke="var(--sk-accent)" stroke-width="2.5" stroke-linejoin="round"/></svg></div>
<div class="pm-chips"><span class="pm-chip">🎓 3er Año</span><span class="pm-chip">📅 28 de febrero</span><span class="pm-chip">♡ En una relación</span></div>
<div class="pm-since">Se unió en septiembre de 2026</div><div class="pm-counts"><span><b>9</b> publicaciones</span><span><b>35</b> seguidores</span><span><b>37</b> seguidos</span></div></div>`
}

// Perfil completo de prueba: banner del usuario + tarjeta. width = ancho de la columna (px).
export function profileDemo(card, o = {}) {
  const ban = DEMO_BANNERS.find((b) => b.id === o.banner) || DEMO_BANNERS[o.bannerIdx || 0]
  const bcss = o.bannerCss || ban.css
  const sk = skinHTML(card, { paletteId: o.paletteId, hue: o.hue, uid: o.uid, seam: o.seam, anim: o.anim !== false, content: profileInner(o) })
  return `<div class="pm-w" style="--pw:${o.width || 935}px"><div class="pm-ban" style="background:${bcss};background-size:cover;background-position:center"></div>${sk}</div>`
}
