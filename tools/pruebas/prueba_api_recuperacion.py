import json, hmac, hashlib, base64, urllib.request, time, sys
SECRET=b"super-secret-jwt-token-with-at-least-32-characters-long"
def b64(x): return base64.urlsafe_b64encode(x).rstrip(b'=')
def jwt(role, sub=None):
    h=b64(json.dumps({"alg":"HS256","typ":"JWT"}).encode()); p={"role":role,"exp":int(time.time())+3600}
    if sub: p["sub"]=sub
    p=b64(json.dumps(p).encode()); sig=b64(hmac.new(SECRET,h+b'.'+p,hashlib.sha256).digest()); return (h+b'.'+p+b'.'+sig).decode()
def call(path, body, token=None, ip=None, base='http://127.0.0.1:3001'):
    r=urllib.request.Request(base+path, method='POST', data=json.dumps(body).encode()); r.add_header('Content-Type','application/json')
    if token: r.add_header('Authorization','Bearer '+token)
    if ip: r.add_header('x-forwarded-for', ip)
    try:
        with urllib.request.urlopen(r, timeout=20) as resp: return resp.status, json.loads(resp.read() or b'null')
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except Exception: return e.code, None
def rest(path, token=None):
    r=urllib.request.Request('http://127.0.0.1:3000'+path); r.add_header('Authorization','Bearer '+(token or jwt('service_role')))
    with urllib.request.urlopen(r, timeout=10) as resp: return json.loads(resp.read())
ID={'ren':'00000000-0000-0000-0000-0000000000d4','staffy':'00000000-0000-0000-0000-0000000000e5','mod':'00000000-0000-0000-0000-0000000000f6','ana':'00000000-0000-0000-0000-0000000000a1','beto':'00000000-0000-0000-0000-0000000000b2','caro':'00000000-0000-0000-0000-0000000000c3'}
T={k:jwt('authenticated',v) for k,v in ID.items()}
ok=0; bad=0
def check(name, cond, extra=''):
    global ok,bad
    if cond: ok+=1; print('  OK  ',name)
    else: bad+=1; print('  FALLA',name,extra)
A='/api/admin/account-recovery'; L='/api/recover/link'
print('== Autorizacion')
s,d=call(A,{'action':'search','q':'an'}); check('sin token -> 401', s==401, (s,d))
s,d=call(A,{'action':'search','q':'an'},'basura.token.xyz'); check('token invalido -> 401', s==401, (s,d))
s,d=call(A,{'action':'search','q':'an'},T['ana']); check('usuario normal -> 403', s==403, (s,d))
s,d=call(A,{'action':'search','q':'an'},T['mod']); check('moderador SIN el permiso -> 403', s==403, (s,d))
print('== Busqueda')
s,d=call(A,{'action':'search','q':'a'},T['ren']); check('1 letra -> sin resultados', s==200 and d['results']==[], (s,d))
s,d=call(A,{'action':'search','q':'an'},T['ren']); check('supremo busca "an" -> ana (con palabra secreta, sin exponer hash)', s==200 and any(r['username']=='ana' and r['has_secret_word'] is True for r in d['results']) and 'security_word_hash' not in json.dumps(d), (s,d))
s,d=call(A,{'action':'search','q':'caro'},T['staffy']); check('staff con permiso busca "caro" -> sin palabra secreta', s==200 and d['results'] and d['results'][0]['has_secret_word'] is False, (s,d))
s,d=call(A,{'action':'search','q':'Torres'},T['ren']); check('por nombre de estudiante', s==200 and any(r['username']=='ana' for r in d['results']), (s,d))
s,d=call(A,{'action':'search','q':"x%,y)"},T['ren']); check('caracteres raros no rompen el filtro', s==200, (s,d))
print('== Info y proteccion de cuentas del staff')
s,d=call(A,{'action':'info','userId':ID['caro']},T['staffy']); check('info de cuenta normal: canRecover', s==200 and d['canRecover'] is True and d['protected'] is False, (s,d))
s,d=call(A,{'action':'info','userId':ID['mod']},T['staffy']); check('info de cuenta del staff como NO supremo: no puede', s==200 and d['canRecover'] is False and d['protected'] is True, (s,d))
s,d=call(A,{'action':'info','userId':ID['mod']},T['ren']); check('info de staff como supremo: puede', s==200 and d['canRecover'] is True, (s,d))
print('== Generar enlace: validaciones')
base={'action':'create','userId':ID['caro'],'note':'Me escribio por Discord desde su cuenta y confirmo su nombre en Roblox','confirmed':True}
s,d=call(A,{**base,'confirmed':False},T['staffy']); check('sin confirmar -> 400', s==400, (s,d))
s,d=call(A,{**base,'note':'corto'},T['staffy']); check('motivo corto -> 400', s==400, (s,d))
s,d=call(A,{**base,'userId':ID['staffy']},T['staffy']); check('a si mismo -> 400', s==400, (s,d))
s,d=call(A,{**base,'userId':ID['mod']},T['staffy']); check('staff con permiso NO puede recuperar a otro staff -> 403', s==403, (s,d))
s,d=call(A,{**base,'userId':ID['ren']},T['staffy']); check('staff con permiso NO puede recuperar al Admin Supremo -> 403', s==403, (s,d))
s,d=call(A,{**base,'userId':ID['caro']},T['mod']); check('moderador sin permiso -> 403', s==403, (s,d))
s,d=call(A,{**base,'userId':'no-es-uuid'},T['ren']); check('uuid invalido -> 400', s==400, (s,d))
print('== Generar enlace: caso valido')
s,d=call(A,base,T['staffy']); check('staff con permiso genera enlace para caro -> 200', s==200 and '/recuperar/enlace#' in d.get('url',''), (s,d))
url=d['url']; token=url.split('#',1)[1]; check('token de 43 caracteres (256 bits) y solo en el fragmento #', len(token)==43 and '?' not in url, url)
rows=rest('/account_recovery_links?select=token_hash,expires_at,used_at&user_id=eq.'+ID['caro'])
check('en la base solo esta el HASH sha256 (no el token)', rows and rows[0]['token_hash']==hashlib.sha256(token.encode()).hexdigest() and token not in json.dumps(rows), rows)
print('== Usar el enlace (publico)')
s,d=call(L,{'action':'check','token':'x'*43},ip='9.9.9.1'); check('token falso -> 400 mensaje generico', s==400 and 'no es válido' in d['error'], (s,d))
s,d=call(L,{'action':'check','token':'corto'},ip='9.9.9.1'); check('token mal formado -> 400', s==400, (s,d))
s,d=call(L,{'action':'check','token':token},ip='9.9.9.2'); check('token correcto: muestra la cuenta (@caro)', s==200 and d.get('username')=='caro', (s,d))
s,d=call(L,{'action':'use','token':token,'newPassword':'123','newSecurityWord':'palabra nueva'},ip='9.9.9.2'); check('contrasena corta -> 400 y el enlace NO se gasta', s==400, (s,d))
s,d=call(L,{'action':'use','token':token,'newPassword':'ContrasenaNueva1','newSecurityWord':'ab'},ip='9.9.9.2'); check('palabra corta -> 400 y el enlace NO se gasta', s==400, (s,d))
s,d=call(L,{'action':'check','token':token},ip='9.9.9.2'); check('el enlace sigue vigente tras los errores de validacion', s==200, (s,d))
s,d=call(L,{'action':'use','token':token,'newPassword':'ContrasenaNueva1','newSecurityWord':'Mi Palabra Nueva'},ip='9.9.9.2'); check('uso correcto -> success', s==200 and d.get('success') is True, (s,d))
calls=json.loads(urllib.request.urlopen('http://127.0.0.1:54321/__calls').read())
check('se cambio la contrasena en Auth SOLO de caro', any(c['id']==ID['caro'] and c['body'].get('password')=='ContrasenaNueva1' for c in calls) and all(c['id']==ID['caro'] for c in calls), calls)
prof=rest('/profiles?select=security_word&id=eq.'+ID['caro'])
check('se guardo la palabra secreta nueva', prof[0]['security_word']=='Mi Palabra Nueva', prof)
s,d=call(L,{'action':'use','token':token,'newPassword':'OtraContrasena2','newSecurityWord':'otra palabra'},ip='9.9.9.2'); check('SEGUNDO uso del mismo enlace -> 400 (un solo uso)', s==400, (s,d))
s,d=call(L,{'action':'check','token':token},ip='9.9.9.2'); check('el enlace usado ya no es valido', s==400, (s,d))
calls=json.loads(urllib.request.urlopen('http://127.0.0.1:54321/__calls').read()); check('la contrasena NO se cambio por el segundo intento', len(calls)==1, calls)
aud=rest('/account_recovery_audit?select=action,actor_name,target_name&order=id')
acts=[a['action'] for a in aud]; check('auditoria: creado, abierto, usado', acts.count('link_created')==1 and acts.count('link_opened')>=1 and acts.count('link_used')==1, aud)
print('== Revocar')
s,d=call(A,base,T['ren']); check('supremo genera otro enlace para caro', s==200, (s,d)); tok2=d['url'].split('#',1)[1]
s,d=call(A,{'action':'info','userId':ID['caro']},T['ren']); lid=d['active']['id'] if d.get('active') else None; check('info muestra el enlace activo', lid is not None, (s,d))
s,d=call(A,{'action':'revoke','linkId':lid},T['mod']); check('revocar sin permiso -> 403', s==403, (s,d))
s,d=call(A,{'action':'revoke','linkId':lid},T['ren']); check('revocar con permiso -> true', s==200 and d.get('revoked') is True, (s,d))
s,d=call(L,{'action':'check','token':tok2},ip='9.9.9.3'); check('enlace revocado ya no sirve', s==400, (s,d))
print('== Freno de intentos por conexion')
codes=[call(L,{'action':'check','token':'z'*43},ip='7.7.7.7')[0] for _ in range(23)]
check('tras 20 intentos fallidos desde la misma IP -> 429', 429 in codes and codes[:20]==[400]*20, codes)
s,d=call(L,{'action':'check','token':token},ip='7.7.7.7'); check('y esa IP queda frenada aunque el token sea otro', s==429, (s,d))
print(f'\nRESULTADO: {ok} OK, {bad} fallas')
sys.exit(1 if bad else 0)
