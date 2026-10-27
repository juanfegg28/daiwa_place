'use client'

import type { ReactNode } from 'react'
import AppShell from '../components/AppShell'
import { ShopProvider } from '../components/shop/ShopProvider'
import ShopFrame from '../components/shop/ShopFrame'

/** Toda la tienda comparte un solo layout: los datos se cargan UNA vez y cambiar de pestaña es instantáneo */
export default function TiendaLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <ShopProvider>
        <ShopFrame>{children}</ShopFrame>
      </ShopProvider>
    </AppShell>
  )
}
