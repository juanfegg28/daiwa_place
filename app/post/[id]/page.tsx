import type { Metadata } from 'next'
import PostPageClient from './PostPageClient'
import { postCard } from '../../lib/og'

// Tarjeta de enlace para Discord y redes (Open Graph). Se arma en el servidor y, si la cuenta es privada,
// devuelve la tarjeta genérica de DaiwaPlace.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return postCard(id)
}

export default function Page() {
  return <PostPageClient />
}
