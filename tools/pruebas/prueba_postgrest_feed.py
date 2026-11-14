import json, hmac, hashlib, base64, urllib.request, urllib.parse, time
SECRET=b"super-secret-jwt-token-with-at-least-32-characters-long"
def b64(x): return base64.urlsafe_b64encode(x).rstrip(b'=')
def jwt(role, sub=None):
    h=b64(json.dumps({"alg":"HS256","typ":"JWT"}).encode()); p={"role":role,"exp":int(time.time())+3600}
    if sub: p["sub"]=sub
    p=b64(json.dumps(p).encode()); sig=b64(hmac.new(SECRET,h+b'.'+p,hashlib.sha256).digest()); return (h+b'.'+p+b'.'+sig).decode()
def req(path, token, method='GET', body=None, headers=None):
    r=urllib.request.Request('http://127.0.0.1:3000'+path, method=method, data=json.dumps(body).encode() if body is not None else None)
    r.add_header('Authorization','Bearer '+token); r.add_header('Content-Type','application/json')
    for k,v in (headers or {}).items(): r.add_header(k,v)
    try:
        with urllib.request.urlopen(r, timeout=10) as resp: return resp.status, json.loads(resp.read() or b'null')
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except Exception: return e.code, None
A='00000000-0000-0000-0000-0000000000a1'; B='00000000-0000-0000-0000-0000000000b2'; C='00000000-0000-0000-0000-0000000000c3'
ids='11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222,33333333-3333-3333-3333-333333333333'
def light(me, extra=''):
    q=f"/posts?select=id,content,post_counters(likes_count,comments_count,reposts_count),profiles!posts_user_id_fkey(username),likes(user_id),reposts(user_id){extra}&id=in.({ids})&likes.user_id=eq.{me}&reposts.user_id=eq.{me}&order=content"
    return req(q, jwt('authenticated', me))
for who,me in (('ana',A),('caro',C),('beto',B)):
    st,d=light(me)
    print(f"--- T1 light como {who}: HTTP {st}")
    for p in d: print('  ',p['content'],'| counters=',p['post_counters'],'| likes=',[l['user_id'][-2:] for l in p['likes']],'| reposts=',[l['user_id'][-2:] for l in p['reposts']])
st,d=light(A, ',comments(id,content,comment_likes(user_id))')
print('--- T3 detail (con comentarios): HTTP',st,'| post1 comentarios=',[c['content'] for c in d[0]['comments']] if d and 'comments' in d[0] else d)
# T4 busqueda admin
st,d=req("/profiles?select=id,username,id_student&or=(username.ilike.an%25,id_student.ilike.%25an%25)&order=username&limit=8", jwt('service_role'))
print('--- T4 busqueda admin "an": HTTP',st,[r['username'] for r in d])
st,d=req("/profiles?select=id,username&or=(username.ilike.t%25,id_student.ilike.%25t%25)&order=username&limit=8", jwt('service_role'))
print('--- T4b busqueda "t" (id_student contiene t):',[r['username'] for r in d])
# T5 RPC recuperacion con service_role
h='ab'*32
st,d=req('/rpc/recovery_link_create', jwt('service_role'), 'POST', {"p_user":B,"p_admin":A,"p_hash":h,"p_note":"verifique por Discord","p_hours":4})
print('--- T5 create: HTTP',st,d)
st,d=req('/rpc/recovery_link_peek', jwt('service_role'), 'POST', {"p_hash":h}); print('    peek:',st,type(d).__name__, d)
st,d=req('/rpc/recovery_link_claim', jwt('service_role'), 'POST', {"p_hash":h}); print('    claim 1:',st,d)
st,d=req('/rpc/recovery_link_claim', jwt('service_role'), 'POST', {"p_hash":h}); print('    claim 2 (debe ser null):',st,d)
st,d=req('/rpc/recovery_link_event', jwt('service_role'), 'POST', {"p_action":"link_used","p_link":None,"p_target":B,"p_detail":{"ip":"1.2.3.4"}}); print('    event:',st,d)
# T5b: authenticated NO puede ejecutar las funciones
st,d=req('/rpc/recovery_link_claim', jwt('authenticated',A), 'POST', {"p_hash":h}); print('--- T5b authenticated ejecuta claim -> (debe fallar):',st, (d or {}).get('message'))
# T6 RLS contadores
st,d=req('/post_counters?select=*', jwt('authenticated',A)); print('--- T6 authenticated lee post_counters:',st,len(d),'fila(s)')
st,d=req('/post_counters', jwt('authenticated',A),'POST',{"post_id":"22222222-2222-2222-2222-222222222222","likes_count":999}); print('    authenticated escribe post_counters (debe fallar):',st,(d or {}).get('message'))
st,d=req('/post_counters?select=*', jwt('anon')); print('    anon lee post_counters (debe fallar):',st)
