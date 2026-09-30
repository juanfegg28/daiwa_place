'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { BlockIcon } from '../components/icons'

type BlockedProfile = { id: string; username: string; id_student: string | null; avatar_url: string | null }

export default function BloqueadosTab({ currentUserId }: { currentUserId: string }) {
  const [list, setList] = useState<BlockedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [unblocking, setUnblocking] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('blocks')
      .select('profiles!blocks_blocked_id_fkey(id, username, id_student, avatar_url)')
      .eq('blocker_id', currentUserId)
    const rows = ((data as unknown as { profiles: BlockedProfile | null }[]) ?? [])
      .map((r) => r.profiles)
      .filter((p): p is BlockedProfile => !!p)
    setList(rows)
    setLoading(false)
  }

  useEffect(() => {
    function run() {
      load()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId])

  const unblock = async (blockedId: string) => {
    setUnblocking(blockedId)
    await supabase.from('blocks').delete().eq('blocker_id', currentUserId).eq('blocked_id', blockedId)
    setList((prev) => prev.filter((p) => p.id !== blockedId))
    setUnblocking(null)
  }

  return (
    <section className="surface-card rounded-2xl p-5">
      <h2 className="text-base font-semibold text-neutral-50 mb-1">Cuentas bloqueadas</h2>
      <p className="text-sm text-neutral-500 mb-4 leading-relaxed max-w-md">
        Las personas que bloqueaste no pueden interactuar contigo ni tú con ellas. Puedes desbloquear a
        cualquiera cuando quieran hacer las paces en la trama.
      </p>

      {loading ? (
        <p className="text-neutral-500 text-sm py-4">Cargando...</p>
      ) : list.length === 0 ? (
        <p className="text-neutral-500 text-sm py-4">No has bloqueado a nadie.</p>
      ) : (
        <div className="space-y-1">
          {list.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-1 py-2">
              <Link
                href={`/perfil/${p.username}`}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-ink-700 flex items-center justify-center shrink-0">
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-garnet-400">
                      {p.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-100 truncate">{p.id_student || p.username}</p>
                  <p className="text-xs text-neutral-600 truncate">@{p.username}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => unblock(p.id)}
                disabled={unblocking === p.id}
                className="shrink-0 flex items-center gap-1.5 text-xs border border-ink-600 text-neutral-300 rounded-full px-3 py-1.5 hover:bg-ink-800 transition disabled:opacity-60"
              >
                <BlockIcon className="w-3.5 h-3.5" />
                {unblocking === p.id ? 'Desbloqueando...' : 'Desbloquear'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
