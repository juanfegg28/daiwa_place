import { NextResponse } from 'next/server'
import { PAYPAL_ENV, hasSecret, loadPlans, publicClientId, type TierKey } from '../../../lib/paypalServer'

// Le dice a la página si los pagos automáticos con PayPal están listos. No depende de la persona,
// por eso se guarda 5 minutos en la red de Vercel (pocas ejecuciones).
export async function GET() {
  const headers = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  const base = { clientId: publicClientId(), env: PAYPAL_ENV }
  if (!hasSecret() || !process.env.PAYPAL_WEBHOOK_ID || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ mode: 'manual', ...base, plans: {} }, { headers })
  }
  try {
    const plans: Partial<Record<TierKey, string>> = {}
    for (const p of await loadPlans()) if (p.tier && !plans[p.tier]) plans[p.tier] = p.planId
    const mode = Object.keys(plans).length > 0 ? 'auto' : 'manual'
    return NextResponse.json({ mode, ...base, plans }, { headers })
  } catch {
    return NextResponse.json({ mode: 'manual', ...base, plans: {} }, { headers: { 'Cache-Control': 'public, s-maxage=30' } })
  }
}
