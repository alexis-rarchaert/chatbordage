import { ref, computed, watch } from 'vue'
import { products, type Product } from './products'

const STORAGE_KEY = 'chatbordage_cart_v1'

type CartItem = { id: string; quantity: number }

function load(): CartItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed.filter(i => i.id && i.quantity > 0) : []
  } catch {
    return []
  }
}

const items = ref<CartItem[]>(load())

watch(
  items,
  v => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch {}
  },
  { deep: true }
)

export type CartLine = { product: Product; quantity: number; subtotal: number }

export function useCart() {
  const lines = computed<CartLine[]>(() =>
    items.value
      .map(i => {
        const product = products.find(p => p.id === i.id)
        if (!product) return null
        return { product, quantity: i.quantity, subtotal: product.price * i.quantity }
      })
      .filter((l): l is CartLine => l !== null)
  )

  const totalItems = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  const totalPrice = computed(() => lines.value.reduce((sum, l) => sum + l.subtotal, 0))

  function getQuantity(id: string): number {
    return items.value.find(i => i.id === id)?.quantity ?? 0
  }

  function setQuantity(id: string, quantity: number) {
    const q = Math.max(0, Math.floor(quantity))
    const existing = items.value.find(i => i.id === id)
    if (q === 0) {
      items.value = items.value.filter(i => i.id !== id)
      return
    }
    if (existing) existing.quantity = q
    else items.value = [...items.value, { id, quantity: q }]
  }

  function add(id: string, quantity = 1) {
    setQuantity(id, getQuantity(id) + quantity)
  }

  function remove(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function clear() {
    items.value = []
  }

  return {
    lines,
    totalItems,
    totalPrice,
    getQuantity,
    setQuantity,
    add,
    remove,
    clear
  }
}
