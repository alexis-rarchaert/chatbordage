export type Product = {
  id: string
  slug: string
  name: string
  shortDesc: string
  longDesc: string[]
  price: number
  image?: string
  icon?: string
  gallery?: string[]
  badge?: string
  features: string[]
  bundle?: string[]
  stock?: number
}

export const products: Product[] = [
  {
    id: 'jeu',
    slug: 'jeu-chatbordage',
    name: 'ChatBordage — Le jeu',
    shortDesc: 'Le jeu de cartes à rôles cachés dans un univers de chats pirates. 4 à 6 joueurs, ~30 minutes.',
    longDesc: [
      'Chaque joueur commande un navire de pirates félins, doté de ses propres statistiques et d\'un pouvoir unique. Mais sous ta carte de matelot se cache une mission secrète que toi seul connais...',
      'Bluff, accusations, trahisons : ChatBordage mélange réflexion, hasard et interactions sociales dans un univers original de chats pirates. La partie se termine dès qu\'un joueur accomplit sa mission cachée — sauras-tu deviner qui complote contre qui ?',
      'Le jeu est accompagné d\'une application compagnon qui gère les rôles secrets, les événements de mer, l\'attribution des navires et la boutique en jeu.'
    ],
    price: 34.9,
    image: '/packshot.webp',
    badge: 'Nouveauté',
    features: [
      '100 cartes à jouer',
      'Application compagnon (15 navires + 5 rôles)',
      'Des pièces façon doublons',
      '4 à 6 joueurs · 7 à 77 ans · ~30 min'
    ],
    stock: 200
  },
  {
    id: 'stickers',
    slug: 'pack-stickers',
    name: 'Pack de 5 stickers',
    shortDesc: 'Les 5 chats pirates en stickers vinyle waterproof.',
    longDesc: [
      'Affiche ton équipage préféré ! Ce pack rassemble les 5 chats stars du jeu : Chat-rles Henri le Capitaine, Miranda la Protectrice, Kim le Chasseur de primes, Sylas le Renégat et Maskey le Contrebandier.',
      'Vinyle découpé waterproof : décore ta gamelle, ton ordi, ta gourde, ton tonneau de rhum. Résiste à l\'eau, au soleil et aux abordages amicaux.'
    ],
    price: 7.5,
    icon: '🐾',
    features: [
      'Vinyle découpé waterproof',
      'Chat-rles Henri, Miranda, Kim, Sylas, Maskey',
      'Format ~7 cm',
      'Fabriqué en France'
    ],
    stock: 500
  },
  {
    id: 'mug',
    slug: 'mug-capitaine',
    name: 'Mug Capitaine',
    shortDesc: 'Un mug 33cl à l\'effigie de Chat-rles Henri.',
    longDesc: [
      'Idéal pour siroter ton café avant de couler tes amis. Le Capitaine Chat-rles Henri en majesté, imprimé en haute définition sur céramique blanche.',
      'Capacité 33 cl, passe au lave-vaisselle et au micro-ondes (à risques et périls pour l\'effigie).'
    ],
    price: 14.9,
    icon: '☕',
    features: [
      'Céramique 33 cl',
      'Lave-vaisselle compatible',
      'Impression haute définition',
      'Boîte cadeau incluse'
    ],
    stock: 150
  },
  {
    id: 'collector',
    slug: 'edition-collector',
    name: 'Édition Collector',
    shortDesc: 'La boîte du jeu, les 5 stickers, le mug et un set de cartes dorées exclusives.',
    longDesc: [
      'L\'édition ultime pour les vrais loups de mer. Tu reçois tout : le jeu de base, les stickers, le mug Capitaine, plus un set exclusif de cartes Navire en finition dorée à chaud (les 15 navires en version premium, foilées, non disponibles à l\'unité).',
      'Présenté dans un coffre en bois sérigraphié à la patte de chat, avec un certificat d\'authenticité numéroté à la main. Tirage limité à 500 exemplaires.'
    ],
    price: 59.9,
    image: '/packshot.webp',
    badge: 'Édition limitée',
    features: [
      'Le jeu ChatBordage complet',
      'Pack de 5 stickers vinyle',
      'Mug Capitaine 33 cl',
      'Set de 15 cartes Navire dorées exclusives',
      'Coffre en bois sérigraphié',
      'Certificat numéroté'
    ],
    bundle: ['jeu', 'stickers', 'mug'],
    stock: 500
  }
]

export function findProduct(idOrSlug: string): Product | undefined {
  return products.find(p => p.id === idOrSlug || p.slug === idOrSlug)
}

export function formatPrice(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}
