import type { Metadata } from 'next'
import ClubPageClient from './ClubPageClient'
import { clubCard } from '../../lib/og'

// Tarjeta de enlace para Discord y redes (Open Graph). Se arma en el servidor y, si la cuenta es privada,
// devuelve la tarjeta genérica de DaiwaPlace.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return clubCard(slug)
}

export default function Page() {
  return <ClubPageClient />
}
