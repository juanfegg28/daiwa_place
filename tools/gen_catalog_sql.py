#!/usr/bin/env python3
"""Genera sql/v1.4.0_catalogo.sql y sql/v1.5.0_activar_sangre_noir_y_emo.sql desde el kit (catalog/*.json).
Uso: python3 tools/gen_catalog_sql.py <carpeta daiwa-cosmetics> <carpeta de fuentes verificadas (report.json)>"""
import json, sys, re, unicodedata
kit, rep = sys.argv[1], sys.argv[2]
cat = json.load(open(f'{kit}/catalog/catalog.json'))
fonts = json.load(open(f'{kit}/catalog/fonts.json'))['fonts']
packs = json.load(open(f'{kit}/catalog/packs.json'))
verif = json.load(open(rep))            # slug -> {license, glyphs_ok, bytes}

def q(s):
    return "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"
def arr(l):
    return "array[" + ",".join(q(x) for x in l) + "]::text[]" if l else "'{}'::text[]"
def js(o):
    return q(json.dumps(o, ensure_ascii=False, separators=(',', ':'))) + "::jsonb"
def slugify(n):
    s = unicodedata.normalize('NFD', n.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

REL_ACTIVE = '1.4.0'
coll_release = {}
for p in packs['packs']: coll_release[p['collection']] = p['release']
coll_sort = {c['id']: i for i, c in enumerate(cat['collections'])}
PACK_CARD = {p['collection']: p['includes_card'] for p in packs['packs']}
PACK_FX = {p['collection']: p['includes_effect'] for p in packs['packs']}
CTITLE = packs['completion_titles']

rows_coll = []
rows_coll.append(('base', 'Suelto', 'cosas sin colección', 'base', '1.4.0', False, None, None, None, -1))
for c in cat['collections']:
    cid = c['id']; kind = 'miticas' if cid == 'miticas' else 'coleccion'
    rel = coll_release.get(cid, '1.4.0'); haspack = cid in PACK_CARD
    rows_coll.append((cid, c['name'], c['theme'], kind, rel, haspack, PACK_CARD.get(cid), PACK_FX.get(cid), CTITLE.get(cid), coll_sort[cid]))

items = []
for it in cat['items']:
    meta = {k: it[k] for k in ('tone', 'glyph', 'pad', 'how') if k in it}
    ob = 'tienda'
    if it['price'] == 0:
        how = it.get('how', '')
        ob = 'logro' if how.startswith('Logro') else 'evento' if how.startswith('Evento') else 'fundador'
    items.append(dict(type=it['type'], slug=it['slug'], name=it['name'], rarity=it['rarity'], price=it['price'],
                      collection=it['collection'], min_size=it.get('min_size'), custom_hue=it['custom_hue'],
                      palettes=[p['id'] for p in it['palettes']], meta=meta, origin=it['origin'], license=it['license'],
                      obtainable=ob, release=it['release']))
# fuentes (verificadas con npm + fontTools)
for f in fonts:
    v = verif.get(f['slug'], {})
    meta = {'family': f['family'], 'weight': f['weight'], 'italic': f['italic'], 'category': f['category'],
            'gothic': bool(f.get('gothic_wide_tracking')), 'source': f['source'],
            'verified': bool(v.get('glyphs_ok')) or f['free'], 'bytes': v.get('bytes')}
    if f.get('fontsource_package'): meta['package'] = f['fontsource_package']
    lic = v.get('license') or f['license']
    items.append(dict(type='font', slug=f['slug'], name=f['name'], rarity=f['rarity'], price=f['price'], collection='base',
                      min_size=None, custom_hue=False, palettes=[], meta=meta, origin='licencia' if not f['free'] or f['slug'] == 'cinzel' else 'codigo',
                      license=lic, obtainable='gratis' if f['free'] else 'tienda', release=f['release']))
# títulos exclusivos por completar colección
for cid, name in CTITLE.items():
    items.append(dict(type='title', slug=slugify(name), name=name, rarity='epico', price=0, collection=cid, min_size=None,
                      custom_hue=False, palettes=['a', 'b', 'c', 'd'], meta={'glyph': '✦', 'exclusive': True}, origin='codigo',
                      license='Propia', obtainable='logro', release=coll_release[cid]))
# Pack Fundador: título y insignia
items.append(dict(type='title', slug='fundador-de-daiwa', name='Fundador de Daiwa', rarity='mitico', price=0, collection='miticas', min_size=None,
                  custom_hue=False, palettes=['a', 'b', 'c', 'd'], meta={'glyph': '✦', 'exclusive': True}, origin='codigo', license='Propia',
                  obtainable='fundador', release='1.4.0'))
cname = {c['id']: c['name'] for c in cat['collections']}
for b in packs['badges']:
    bid = b['id']; coll = 'miticas' if bid == 'fundador' else bid
    items.append(dict(type='badge', slug=bid, name='Insignia ' + ('Fundador' if bid == 'fundador' else cname[bid]), rarity='epico', price=0,
                      collection=coll, min_size=None, custom_hue=False, palettes=[], meta={}, origin='codigo', license='Propia',
                      obtainable='fundador' if bid == 'fundador' else 'logro', release=b['release']))

def active(rel): return 'true' if rel == REL_ACTIVE else 'false'
out = []
out.append("""-- =====================================================================
-- DaiwaPlace v1.4.0 «Tienda y Estilo» · CATÁLOGO (generado desde daiwa-cosmetics/catalog/*.json con tools/gen_catalog_sql.py)
-- Córrelo DESPUÉS de v1.4.0_tienda.sql. Es idempotente (se puede correr varias veces).
--
--   · Se insertan TODOS los ítems. is_active = true SOLO para release_version = '1.4.0'.
--   · Los de 1.5.0 (Sangre Noir y Emo Abismo: decoraciones, tarjetas, entradas, efectos de nombre, fondos,
--     títulos, insignias y packs) quedan con is_active = false: ni la tienda, ni el inventario, ni los packs,
--     ni las misiones, ni los perfiles los pueden ver o usar hasta que corras v1.5.0_activar_sangre_noir_y_emo.sql.
--   · Al volver a correrlo NO se pisan is_active, release_version ni price (los puede cambiar el equipo).
--   · Fuentes: nombre, licencia y glifos «Ñandú José Ángel ¿¡ü» verificados contra los paquetes reales (ver notas por ítem en meta).
-- =====================================================================

-- 1) Colecciones
insert into public.cosmetic_collections (id, name, theme, kind, release_version, is_active, has_pack, pack_card, pack_effect, completion_title, sort) values""")
out.append(",\n".join(f"({q(r[0])},{q(r[1])},{q(r[2])},{q(r[3])},{q(r[4])},{active(r[4])},{'true' if r[5] else 'false'},{q(r[6])},{q(r[7])},{q(r[8])},{r[9]})" for r in rows_coll))
out.append("""on conflict (id) do update set name = excluded.name, theme = excluded.theme, kind = excluded.kind, has_pack = excluded.has_pack,
  pack_card = excluded.pack_card, pack_effect = excluded.pack_effect, completion_title = excluded.completion_title, sort = excluded.sort;
""")
out.append("-- 2) Ítems (%d)\ninsert into public.cosmetic_items (type, slug, name, rarity, price, collection, min_size, custom_hue, palettes, meta, origin, license, obtainable, release_version, is_active) values" % len(items))
out.append(",\n".join(
    f"({q(i['type'])},{q(i['slug'])},{q(i['name'])},{q(i['rarity'])},{i['price']},{q(i['collection'])},{i['min_size'] if i['min_size'] is not None else 'NULL'},"
    f"{'true' if i['custom_hue'] else 'false'},{arr(i['palettes'])},{js(i['meta'])},{q(i['origin'])},{q(i['license'])},{q(i['obtainable'])},{q(i['release'])},{active(i['release'])})"
    for i in items))
out.append("""on conflict (type, slug) do update set name = excluded.name, rarity = excluded.rarity, collection = excluded.collection,
  min_size = excluded.min_size, custom_hue = excluded.custom_hue, palettes = excluded.palettes, meta = excluded.meta,
  origin = excluded.origin, license = excluded.license, obtainable = excluded.obtainable;
""")
out.append("""-- 3) Comprobación rápida (debe decir: 1.4.0 activos / 1.5.0 con 0 activos)
select release_version, count(*) as items, count(*) filter (where is_active) as activos from public.cosmetic_items group by 1 order by 1;
""")
open('sql/v1.4.0_catalogo.sql', 'w').write("\n".join(out))

n15 = sum(1 for i in items if i['release'] == '1.5.0')
open('sql/v1.5.0_activar_sangre_noir_y_emo.sql', 'w').write(f"""-- =====================================================================
-- DaiwaPlace v1.5.0 · ACTIVAR «Sangre Noir» y «Emo Abismo»  (NO correr hasta el lanzamiento de la 1.5.0)
-- No hace falta redesplegar diseños: los diseños ya viajan en la app. Esto solo los enciende.
-- Activa: colecciones crimson y emo + {n15} ítems (decoraciones, tarjetas, entradas, efectos de nombre, fondos,
-- títulos, insignias y títulos exclusivos). Los packs de ambas colecciones se encienden con la colección.
-- Idempotente. Antes de correrlo, sube el código de la 1.5.0 (versión y novedades).
-- =====================================================================
begin;
update public.cosmetic_collections set is_active = true where release_version = '1.5.0';
update public.cosmetic_items       set is_active = true where release_version = '1.5.0';
commit;

-- Comprobación:
select release_version, count(*) as items, count(*) filter (where is_active) as activos
  from public.cosmetic_items group by 1 order by 1;

-- Para volver a esconderla (por si algo sale mal, ANTES de que la gente la equipe):
--   update public.cosmetic_collections set is_active = false where release_version = '1.5.0';
--   update public.cosmetic_items       set is_active = false where release_version = '1.5.0';
-- (si alguien ya equipó algo de 1.5.0, primero habría que quitárselo de su perfil)
""")
print(len(items), 'items;', n15, 'de 1.5.0;', len(rows_coll), 'colecciones')
