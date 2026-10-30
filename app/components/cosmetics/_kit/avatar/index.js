// @ts-nocheck
import { NOCTIS } from './noctis.js'
import { VELVET } from './velvet.js'
import { SAKURA } from './sakura.js'
import { MAGICA } from './magica.js'
import { NEON } from './neon.js'
import { PIXEL } from './pixel.js'
import { SAMURAI } from './samurai.js'
import { ACADEMIA } from './academia.js'
import { COSMOS } from './cosmos.js'
import { BOSQUE } from './bosque.js'
import { CIELO } from './cielo.js'
import { ORO } from './oro.js'
import { LOFI } from './lofi.js'
import { MITICAS } from './miticas.js'
import { CRIMSON } from './crimson.js'
import { EMO } from './emo.js'
import { HW1 } from './hw1.js'
import { HW2 } from './hw2.js'
import { DM1 } from './dm1.js'

export const COLLECTIONS = [
  { id: 'noctis', name: 'Noctis Gótico', theme: 'dark' },
  { id: 'velvet', name: 'Velvet Rouge', theme: 'terciopelo' },
  { id: 'sakura', name: 'Sakura Dreams', theme: 'kawaii' },
  { id: 'magica', name: 'Magia Estelar', theme: 'chica mágica' },
  { id: 'neon', name: 'Neo Neón', theme: 'cyberpunk' },
  { id: 'pixel', name: 'Pixel Quest', theme: 'RPG 8-bit' },
  { id: 'samurai', name: 'Samurái Sombra', theme: 'ukiyo-e' },
  { id: 'academia', name: 'Dark Academia', theme: 'academia' },
  { id: 'cosmos', name: 'Cosmos y Supernova', theme: 'espacio' },
  { id: 'bosque', name: 'Bosque Fae', theme: 'fantasía' },
  { id: 'cielo', name: 'Cielo e Infierno', theme: 'ángeles y demonios' },
  { id: 'oro', name: 'Oro Barroco', theme: 'decorativo' },
  { id: 'lofi', name: 'Lofi Night', theme: 'noche tranquila' },
  { id: 'crimson', name: 'Sangre Noir', theme: 'dark rojizo' },
  { id: 'emo', name: 'Emo Abismo', theme: 'súper emo dark' },
  { id: 'cripta', name: 'Cripta de Hueso', theme: 'halloween: murciélagos y cadenas' },
  { id: 'cruces', name: 'Cruz de Plata', theme: 'halloween: cruces góticas' },
  { id: 'calabaza', name: 'Noche de Calabazas', theme: 'halloween clásico' },
  { id: 'cuervo', name: 'Cuervo de Hierro', theme: 'hierro forjado y cuervos' },
  { id: 'barroco', name: 'Barroco Monocromo', theme: 'barroco gris' },
  { id: 'creepy', name: 'Creepypastas', theme: 'creepypasta: sets de ambiente' },
  { id: 'vampiro', name: 'Vampiro Azul', theme: 'vampiro azul' },
  { id: 'muertos', name: 'Ofrenda de Día de Muertos', theme: 'día de muertos: catrinas, cempasúchil y papel picado' },
  { id: 'miticas', name: 'Míticas', theme: 'no se compran' },
]
export const AVATAR_DECOS = [...NOCTIS, ...VELVET, ...SAKURA, ...MAGICA, ...NEON, ...PIXEL, ...SAMURAI, ...ACADEMIA, ...COSMOS, ...BOSQUE, ...CIELO, ...ORO, ...LOFI, ...CRIMSON, ...EMO, ...HW1, ...HW2, ...DM1, ...MITICAS]
export const decoBySlug = (s) => AVATAR_DECOS.find((d) => d.slug === s)
