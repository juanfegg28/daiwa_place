'use client'

import CollectionsView from '../../components/shop/CollectionsView'
import { useShop } from '../../components/shop/ShopProvider'

export default function Colecciones() {
  const shop = useShop()
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-neutral-50">Colecciones</h1>
      <CollectionsView collections={shop.collections} catalog={shop.catalog} balance={shop.balance} newIds={shop.newIds} freshKeys={shop.freshKeys} onChanged={shop.reload} onRain={shop.rain} me={shop.me} onOpen={shop.open} />
    </div>
  )
}
