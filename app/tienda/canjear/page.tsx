'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell, { useAppSession } from '../../components/AppShell'
import CodeRedeemCard from '../../components/economy/CodeRedeemCard'
import { refreshWallet, subscribeWallet, type WalletSummary } from '../../lib/economy'
import { ShopHeader, ShopTabs } from '../../components/economy/ShopChrome'

export default function CanjearPage() {
  return (
    <AppShell>
      <CanjearContent />
    </AppShell>
  )
}

function CanjearContent() {
  const { userId, loading } = useAppSession()
  const router = useRouter()
  const [w, setW] = useState<WalletSummary | null>(null)
  // Enlace directo: /tienda/canjear?codigo=XXXX (se rellena el campo; la persona igual tiene que tocar «Canjear»)
  const [initial, setInitial] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitial(new URLSearchParams(window.location.search).get('codigo')?.toUpperCase() ?? '')
  }, [])
  useEffect(() => {
    if (!loading && !userId) router.replace('/login')
  }, [loading, userId, router])
  useEffect(() => {
    if (!userId) return
    const unsub = subscribeWallet(setW)
    refreshWallet()
    return unsub
  }, [userId])

  if (loading || !userId || initial === null) return null
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <ShopHeader w={w} />
      <ShopTabs active="canjear" />
      <CodeRedeemCard initialCode={initial} />
    </div>
  )
}
