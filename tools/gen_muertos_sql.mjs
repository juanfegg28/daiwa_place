// Genera sql/v1.5.10_catalogo_dia_de_muertos.sql leyendo DIRECTO el kit (app/components/cosmetics/_kit): todo lo de la colección «muertos».
// Uso: node tools/gen_muertos_sql.mjs   (desde la raíz del proyecto)
import fs from 'node:fs'
import { AVATAR_DECOS } from '../app/components/cosmetics/_kit/avatar/index.js'
import { CARDS } from '../app/components/cosmetics/_kit/cards/index.js'
import { BACKGROUNDS } from '../app/components/cosmetics/_kit/backgrounds/index.js'
import { ENTRY_EFFECTS } from '../app/components/cosmetics/_kit/entry/engine.js'
import { TITLES, COMPLETION_TITLES, BADGE_IDS, PACK_CARD, PACK_EFFECT } from '../app/components/cosmetics/_kit/titles/index.js'

const COLL = 'muertos', REL = '1.5.10'
const q = (s) => (s == null ? 'NULL' : "'" + String(s).replace(/'/g, "''") + "'")
const arr = (l) => (l.length ? 'array[' + l.map(q).join(',') + ']::text[]' : "'{}'::text[]")
const js = (o) => q(JSON.stringify(o)) + '::jsonb'
const slugify = (n) => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const mine = (l) => l.filter((x) => x.coll === COLL)
const ids = (x) => x.palettes.map((p) => p.id)

const items = []
for (const d of mine(AVATAR_DECOS)) items.push({ type: 'avatar_decoration', slug: d.slug, name: d.name, rarity: d.rarity, price: d.price, min: d.min ?? null, custom: !!d.custom, pal: ids(d), meta: { pad: d.pad }, ob: 'tienda' })
for (const c of mine(CARDS)) items.push({ type: 'profile_card', slug: c.slug, name: c.name, rarity: c.rarity, price: c.price, min: null, custom: !!c.custom, pal: ids(c), meta: { tone: c.tone || 'dark' }, ob: 'tienda' })
for (const b of mine(BACKGROUNDS)) items.push({ type: 'background', slug: b.slug, name: b.name, rarity: b.rarity, price: b.price, min: null, custom: !!b.custom, pal: ids(b), meta: {}, ob: 'tienda' })
for (const e of mine(ENTRY_EFFECTS)) items.push({ type: 'entry_effect', slug: e.slug, name: e.name, rarity: e.rarity, price: e.price, min: null, custom: false, pal: ids(e), meta: {}, ob: 'tienda' })
for (const t of mine(TITLES)) items.push({ type: 'title', slug: t.slug, name: t.name, rarity: t.rarity, price: t.price, min: null, custom: false, pal: ids(t), meta: { glyph: t.glyph }, ob: 'tienda' })
const exName = COMPLETION_TITLES[COLL]
items.push({ type: 'title', slug: slugify(exName), name: exName, rarity: 'epico', price: 0, min: null, custom: false, pal: ['a', 'b', 'c', 'd'], meta: { glyph: '✦', exclusive: true }, ob: 'logro' })
if (!BADGE_IDS.includes(COLL)) throw new Error('falta la insignia')
items.push({ type: 'badge', slug: COLL, name: 'Insignia Día de Muertos', rarity: 'epico', price: 0, min: null, custom: false, pal: [], meta: {}, ob: 'logro' })

// ── comprobaciones
const keys = items.map((i) => i.type + '/' + i.slug)
if (new Set(keys).size !== keys.length) throw new Error('slugs repetidos: ' + keys.filter((k, i) => keys.indexOf(k) !== i))
const prev = fs.readdirSync('sql').filter((f) => f.endsWith('.sql') && !f.startsWith('v1.5.10')).map((f) => fs.readFileSync('sql/' + f, 'utf8')).join('\n')
for (const i of items) if (prev.includes(`('${i.type}','${i.slug}'`)) throw new Error('choca con un ítem anterior: ' + i.type + '/' + i.slug)
const RANGE = { avatar_decoration: { comun: [500, 900], raro: [1200, 2000], epico: [2400, 3600], legendario: [5500, 7500] }, profile_card: { comun: [500, 1000], raro: [1200, 2000], epico: [2400, 3600], legendario: [5500, 7500] }, background: { comun: [500, 1000], raro: [1200, 2000], epico: [2000, 3600], legendario: [4500, 7500] }, entry_effect: { comun: [600, 1000], raro: [1400, 2000], epico: [2400, 3600], legendario: [4500, 7500] }, title: { comun: [200, 200], raro: [400, 400], epico: [600, 800] } }
for (const i of items) { if (i.price === 0) continue; const r = RANGE[i.type]?.[i.rarity]; if (!r || i.price < r[0] || i.price > r[1]) console.warn('AVISO precio fuera de rango habitual:', i.type, i.slug, i.rarity, i.price) }
for (const i of items) if (i.type !== 'badge' && !i.pal.length) throw new Error('sin paletas: ' + i.slug)

const count = (t) => items.filter((i) => i.type === t).length
const rows = items.map((i) => `(${q(i.type)},${q(i.slug)},${q(i.name)},${q(i.rarity)},${i.price},${q(COLL)},${i.min ?? 'NULL'},${i.custom},${arr(i.pal)},${js(i.meta)},'codigo','Propia',${q(i.ob)},'${REL}',false)`).join(',\n')
const out = `-- =====================================================================
-- DaiwaPlace v1.5.10 «Día de Muertos» · PASO 1 de 2: CATÁLOGO de la colección «Ofrenda de Día de Muertos»
-- (generado con tools/gen_muertos_sql.mjs leyendo directamente el kit). Córrelo cuando quieras, antes del lanzamiento.
--   · ${count('avatar_decoration')} decoraciones de avatar · ${count('profile_card')} tarjetas de perfil · ${count('background')} fondos · ${count('entry_effect')} efectos de entrada
--     · ${count('title') - 1} títulos de tienda + 1 título exclusivo de colección completa + 1 insignia = ${items.length} filas.
--   · Entran con is_active = false: nadie los ve ni los puede usar hasta correr v1.5.10_lanzar_dia_de_muertos.sql.
--   · Idempotente. Al volver a correrlo NO se pisan is_active, release_version ni price (los puede cambiar el equipo).
--   · Las cuentas con acceso total (el equipo) reciben automáticamente cada ítem nuevo (trigger de la 1.4.0).
-- =====================================================================

-- 1) Colección
insert into public.cosmetic_collections (id, name, theme, kind, release_version, is_active, has_pack, pack_card, pack_effect, completion_title, sort) values
(${q(COLL)},'Ofrenda de Día de Muertos','día de muertos: cempasúchil, catrinas, pan de muerto, calaveritas y papel picado','coleccion','${REL}',false,true,${q(PACK_CARD[COLL])},${q(PACK_EFFECT[COLL])},${q(exName)},22)
on conflict (id) do update set name = excluded.name, theme = excluded.theme, kind = excluded.kind, has_pack = excluded.has_pack,
  pack_card = excluded.pack_card, pack_effect = excluded.pack_effect, completion_title = excluded.completion_title, sort = excluded.sort;
-- «Míticas» se queda al final de la lista
update public.cosmetic_collections set sort = 23 where id = 'miticas';

-- 2) Ítems (${items.length})
insert into public.cosmetic_items (type, slug, name, rarity, price, collection, min_size, custom_hue, palettes, meta, origin, license, obtainable, release_version, is_active) values
${rows}
on conflict (type, slug) do update set name = excluded.name, rarity = excluded.rarity, collection = excluded.collection,
  min_size = excluded.min_size, custom_hue = excluded.custom_hue, palettes = excluded.palettes, meta = excluded.meta,
  origin = excluded.origin, license = excluded.license, obtainable = excluded.obtainable;

-- 3) Comprobación rápida (1.5.10 debe mostrar 0 activos por ahora)
select release_version, count(*) as items, count(*) filter (where is_active) as activos from public.cosmetic_items group by 1 order by 1;
`
fs.writeFileSync('sql/v1.5.10_catalogo_dia_de_muertos.sql', out)
const by = {}
for (const i of items) by[i.type] = (by[i.type] || 0) + 1
console.log(items.length, 'filas', by)
console.log(items.filter((i) => i.type !== 'title' && i.type !== 'badge').map((i) => `${i.type.slice(0, 4)} ${i.slug} ${i.rarity} ${i.price}${i.custom ? ' custom' : ''}`).join('\n'))
