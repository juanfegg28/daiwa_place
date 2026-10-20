'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../components/AppShell'
import { MoonCoinIcon, PaletteIcon, GiftIcon } from '../components/icons'
import { ShopHeader, ShopTabs } from '../components/economy/ShopChrome'
import { supabase } from '../lib/supabaseClient'
import { refreshWallet, subscribeWallet, type WalletSummary } from '../lib/economy'

export default function TiendaPage() {
  return (
    <AppShell>
      <TiendaContent />
    </AppShell>
  )
}

function TiendaContent() {
  const { userId, loading } = useAppSession()
  const router = useRouter()
  const [w, setW] = useState<WalletSummary | null>(null)

  useEffect(() => {
    if (!loading && !userId) router.replace('/login')
  }, [loading, userId, router])

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeWallet(setW)
    refreshWallet()
    supabase.rpc('track_shop_visit').then(() => {})
    return unsub
  }, [userId])

  if (loading || !userId) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <ShopHeader w={w} />
      <ShopTabs active="catalogo" />

      <div className="relative overflow-hidden rounded-3xl border border-garnet-500/25 bg-gradient-to-br from-garnet-700/25 via-ink-900 to-ink-950 px-6 py-10 text-center">
        <div aria-hidden="true" className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(245,197,66,.18) 0, transparent 30%), radial-gradient(circle at 80% 70%, rgba(200,27,62,.2) 0, transparent 35%)' }} />
        <div className="relative">
          <MoonCoinIcon className="w-14 h-14 mx-auto mb-3" />
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300/80 mb-1">Muy pronto</p>
          <h2 className="font-display text-2xl font-semibold text-neutral-50">Catálogo muy pronto</h2>
          <p className="text-sm text-neutral-400 mt-2 max-w-md mx-auto">
            Estamos preparando decoraciones de avatar, estilos de tarjeta, fuentes y efectos para tu nombre. Mientras tanto, junta Lunas ☾ con las misiones.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/misiones" className="press rounded-full bg-garnet-600 hover:bg-garnet-500 text-white text-sm font-semibold px-5 py-2.5 transition">Ver mis misiones</Link>
            <Link href="/tienda/canjear" className="press rounded-full border border-ink-600 text-neutral-200 text-sm px-5 py-2.5 hover:bg-ink-800 transition inline-flex items-center gap-1.5"><GiftIcon className="w-4 h-4" /> Canjear código</Link>
            <Link href="/personalizar" className="press rounded-full border border-ink-600 text-neutral-200 text-sm px-5 py-2.5 hover:bg-ink-800 transition inline-flex items-center gap-1.5"><PaletteIcon className="w-4 h-4" /> Personalizar perfil</Link>
          </div>
        </div>
      </div>
      <p className="text-xs text-neutral-600 text-center mt-4">Las Lunas no se pueden comprar ni regalar. Se ganan con misiones.</p>
    </div>
  )
}
