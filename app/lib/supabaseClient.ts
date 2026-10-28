import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// v1.5.9 · Avisa a la app cada vez que TÚ haces algo que puede sumar a una misión (dar like, comentar, publicar, ver o responder
// una historia, seguir…). Con ese aviso el «aviso de misión completada» sale en el momento, sin esperar a cambiar de página.
// Solo mira escrituras (POST/PATCH/DELETE) hacia la base de datos; no toca ni cambia la respuesta de ninguna petición.
const RPC_ACTIONS = /^rpc\/(?:[a-z_]*(?:story|reply|visit|track|follow|repost|whisper|note|send|club|like|comment|post|question|mention|highlight|profile|share)[a-z_]*)$/
const IGNORE_TABLES = /^(?:presence|typing|push_|user_presence|economy_|coin_|user_wallets|mission_)/

const watchedFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init)
  try {
    if (res.ok && typeof window !== 'undefined') {
      const method = (init?.method ?? (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')).toUpperCase()
      if (method !== 'GET' && method !== 'HEAD') {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
        const path = url.split('/rest/v1/')[1]?.split('?')[0]
        if (path && (path.startsWith('rpc/') ? RPC_ACTIONS.test(path) : !IGNORE_TABLES.test(path))) {
          window.dispatchEvent(new Event('daiwa:action'))
        }
      }
    }
  } catch {
    /* el aviso es opcional: nunca debe romper una petición */
  }
  return res
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: watchedFetch } })
