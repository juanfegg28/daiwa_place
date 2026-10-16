import type { Metadata } from 'next'
import ProfilePageClient from './ProfilePageClient'
import { profileCard } from '../../lib/og'

// Tarjeta de enlace para Discord y redes (Open Graph). Se arma en el servidor y, si la cuenta es privada,
// devuelve la tarjeta genérica de DaiwaPlace.
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return profileCard(username)
}

export default function Page() {
  return <ProfilePageClient />
}
