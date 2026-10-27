'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSession } from '../../components/AppShell'
import CodeRedeemCard from '../../components/economy/CodeRedeemCard'

export default function CanjearPage() {
  return <CanjearContent />
}

function CanjearContent() {
  const { userId, loading } = useAppSession()
  const router = useRouter()
  // Enlace directo: /tienda/canjear?codigo=XXXX (se rellena el campo; la persona igual tiene que tocar «Canjear»)
  const [initial, setInitial] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitial(new URLSearchParams(window.location.search).get('codigo')?.toUpperCase() ?? '')
  }, [])
  useEffect(() => {
    if (!loading && !userId) router.replace('/login')
  }, [loading, userId, router])

  if (loading || !userId || initial === null) return null
  return (
    <div className="max-w-2xl mx-auto">
      <CodeRedeemCard initialCode={initial} />
    </div>
  )
}
