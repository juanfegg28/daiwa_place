#!/usr/bin/env python3
"""Genera sql/v1.5.0_catalogo_halloween.sql: SOLO lo nuevo del kit (las 7 colecciones de Halloween) respecto a lo que ya
trae sql/v1.4.0_catalogo.sql. Todo entra con is_active = false (se enciende con v1.5.0_lanzar_halloween.sql).
Uso: python3 tools/gen_halloween_sql.py <carpeta daiwa-cosmetics> """
import json, sys, re, unicodedata
kit = sys.argv[1]
cat = json.load(open(f'{kit}/catalog/catalog.json'))
packs = json.load(open(f'{kit}/catalog/packs.json'))
have = set(re.findall(r"^\('([a-z_]+)','([a-z0-9-]+)'", open('sql/v1.4.0_catalogo.sql').read(), re.M))

def q(s): return "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"
def arr(l): return "array[" + ",".join(q(x) for x in l) + "]::text[]" if l else "'{}'::text[]"
def js(o): return q(json.dumps(o, ensure_ascii=False, separators=(',', ':'))) + "::jsonb"
def slugify(n):
    s = unicodedata.normalize('NFD', n.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

coll_release = {p['collection']: p['release'] for p in packs['packs']}
PACK_CARD = {p['collection']: p['includes_card'] for p in packs['packs']}
PACK_FX = {p['collection']: p['includes_effect'] for p in packs['packs']}
CTITLE = packs['completion_titles']
coll_sort = {c['id']: i for i, c in enumerate(cat['collections'])}
new_colls = [c for c in cat['collections'] if c['id'] not in ('miticas',) and coll_release.get(c['id']) == '1.5.0' and c['id'] not in ('crimson', 'emo')]
new_ids = {c['id'] for c in new_colls}

# El kit trae 'marco-barroco' DOS veces (Oro Barroco y Barroco Monocromo): la base no permite dos iguales (unique tipo+slug).
# Se renombra la nueva en el kit (avatar/hw2.js) y aquí.
RENAME = {('avatar_decoration', 'marco-barroco', 'barroco'): ('marco-barroco-gris', 'Marco barroco gris')}
items = []
for it in cat['items']:
    if it['collection'] not in new_ids: continue
    it = dict(it)
    if (it['type'], it['slug'], it['collection']) in RENAME: it['slug'], it['name'] = RENAME[(it['type'], it['slug'], it['collection'])]
    assert (it['type'], it['slug']) not in have, ('choca con el catálogo anterior', it['type'], it['slug'])
    meta = {k: it[k] for k in ('tone', 'glyph', 'pad', 'how') if k in it}
    ob = 'tienda'
    if it['price'] == 0:
        how = it.get('how', ''); ob = 'logro' if how.startswith('Logro') else 'evento' if how.startswith('Evento') else 'fundador'
    items.append(dict(type=it['type'], slug=it['slug'], name=it['name'], rarity=it['rarity'], price=it['price'], collection=it['collection'],
                      min_size=it.get('min_size'), custom_hue=it['custom_hue'], palettes=[p['id'] for p in it['palettes']], meta=meta,
                      origin=it['origin'], license=it['license'], obtainable=ob, release='1.5.0'))
for cid in new_ids:
    name = CTITLE[cid]
    items.append(dict(type='title', slug=slugify(name), name=name, rarity='epico', price=0, collection=cid, min_size=None, custom_hue=False,
                      palettes=['a', 'b', 'c', 'd'], meta={'glyph': '✦', 'exclusive': True}, origin='codigo', license='Propia', obtainable='logro', release='1.5.0'))
cname = {c['id']: c['name'] for c in cat['collections']}
for b in packs['badges']:
    if b['id'] in new_ids:
        items.append(dict(type='badge', slug=b['id'], name='Insignia ' + cname[b['id']], rarity='epico', price=0, collection=b['id'], min_size=None,
                          custom_hue=False, palettes=[], meta={}, origin='codigo', license='Propia', obtainable='logro', release='1.5.0'))

keys = [(i['type'], i['slug']) for i in items]
assert len(keys) == len(set(keys)), 'slugs repetidos en la tanda nueva'
assert not [k for k in keys if k in have], 'choca con lo ya insertado'
rows = ",\n".join(f"({q(c['id'])},{q(c['name'])},{q(c['theme'])},'coleccion','1.5.0',false,true,{q(PACK_CARD.get(c['id']))},{q(PACK_FX.get(c['id']))},{q(CTITLE.get(c['id']))},{coll_sort[c['id']]})" for c in new_colls)
vals = ",\n".join(
    f"({q(i['type'])},{q(i['slug'])},{q(i['name'])},{q(i['rarity'])},{i['price']},{q(i['collection'])},{i['min_size'] if i['min_size'] is not None else 'NULL'},"
    f"{'true' if i['custom_hue'] else 'false'},{arr(i['palettes'])},{js(i['meta'])},{q(i['origin'])},{q(i['license'])},{q(i['obtainable'])},'1.5.0',false)" for i in items)
out = f"""-- =====================================================================
-- DaiwaPlace v1.5.0 «Tienda Halloween» · PASO 2 de 3: CATÁLOGO de las 7 colecciones de Halloween
-- (generado desde daiwa-cosmetics/catalog/*.json con tools/gen_halloween_sql.py). Córrelo DESPUÉS de v1.5.0_tienda_descuentos.sql.
--   · Cripta de Hueso, Cruz de Plata, Noche de Calabazas, Cuervo de Hierro, Barroco Monocromo, Creepypastas y Vampiro Azul:
--     {len([i for i in items if i['type'] not in ('title','badge') or not i.get('meta',{}).get('exclusive')]) - len([i for i in items if i['type']=='badge'])} cosméticos + {len([i for i in items if i['type']=='badge'])} insignias + {len(new_ids)} títulos exclusivos de colección completa.
--   · Entran con is_active = false: nadie los ve ni los puede usar hasta correr v1.5.0_lanzar_halloween.sql.
--   · Idempotente. Al volver a correrlo NO se pisan is_active, release_version ni price (los puede cambiar el equipo).
--   · Las cuentas con acceso total (renshsh y el equipo) reciben automáticamente cada ítem nuevo (trigger de la 1.4.0).
-- =====================================================================

-- 1) Colecciones
insert into public.cosmetic_collections (id, name, theme, kind, release_version, is_active, has_pack, pack_card, pack_effect, completion_title, sort) values
{rows}
on conflict (id) do update set name = excluded.name, theme = excluded.theme, kind = excluded.kind, has_pack = excluded.has_pack,
  pack_card = excluded.pack_card, pack_effect = excluded.pack_effect, completion_title = excluded.completion_title, sort = excluded.sort;
-- «Míticas» se queda al final de la lista
update public.cosmetic_collections set sort = {coll_sort['miticas']} where id = 'miticas';

-- 2) Ítems ({len(items)})
insert into public.cosmetic_items (type, slug, name, rarity, price, collection, min_size, custom_hue, palettes, meta, origin, license, obtainable, release_version, is_active) values
{vals}
on conflict (type, slug) do update set name = excluded.name, rarity = excluded.rarity, collection = excluded.collection,
  min_size = excluded.min_size, custom_hue = excluded.custom_hue, palettes = excluded.palettes, meta = excluded.meta,
  origin = excluded.origin, license = excluded.license, obtainable = excluded.obtainable;

-- 3) Comprobación rápida (1.5.0 debe mostrar 0 activos por ahora)
select release_version, count(*) as items, count(*) filter (where is_active) as activos from public.cosmetic_items group by 1 order by 1;
"""
open('sql/v1.5.0_catalogo_halloween.sql', 'w').write(out)
from collections import Counter
print(len(items), 'filas;', len(new_colls), 'colecciones;', Counter(i['type'] for i in items))
