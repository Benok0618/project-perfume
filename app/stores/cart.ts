import type { CartInputItem, CartSummary } from '~~/shared/types'

const STORAGE_KEY = 'project-perfume-cart'

function emptySummary(): CartSummary {
  return {
    items: [],
    itemCount: 0,
    subtotalCents: 0,
    shippingCents: 0,
    totalCents: 0
  }
}

function readStoredItems(): CartInputItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const { productId, sizeMl, quantity } = entry as Record<string, unknown>
      if (typeof productId !== 'number' || typeof sizeMl !== 'number' || typeof quantity !== 'number') return []
      if (!Number.isInteger(productId) || !Number.isInteger(sizeMl) || !Number.isInteger(quantity)) return []
      if (productId <= 0 || sizeMl <= 0 || quantity <= 0) return []
      return [{ productId, sizeMl, quantity }]
    })
  } catch {
    return []
  }
}

function cartErrorMessage(error: unknown) {
  const message = (error as { data?: { message?: string } })?.data?.message
  return typeof message === 'string' && message ? message : 'Your bag could not be updated. Please try again.'
}

export const useCartStore = defineStore('cart', () => {
  const session = useUserSession()

  const intent = ref<CartInputItem[]>([])
  const summary = ref<CartSummary>(emptySummary())
  const hydrated = ref(false)
  const busy = ref(false)
  const drawerOpen = ref(false)
  const error = ref<string | null>(null)
  const pulse = ref(0)

  let initPromise: Promise<void> | null = null

  const lines = computed(() => summary.value.items)
  const itemCount = computed(() => summary.value.itemCount)
  const isEmpty = computed(() => hydrated.value && summary.value.items.length === 0)
  const loggedIn = computed(() => session.loggedIn.value)

  function persist() {
    if (!import.meta.client) return

    try {
      if (loggedIn.value || intent.value.length === 0) {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(intent.value))
      }
    } catch {
      // Storage can be unavailable in private mode; the in-memory cart still works.
    }
  }

  function applySummary(next: CartSummary) {
    summary.value = next
    intent.value = next.items.map(line => ({
      productId: line.productId,
      sizeMl: line.sizeMl,
      quantity: line.quantity
    }))
    persist()
  }

  async function quote(): Promise<CartSummary> {
    if (intent.value.length === 0) {
      summary.value = emptySummary()
      persist()
      return summary.value
    }

    const next = await $fetch<CartSummary>('/api/cart/quote', {
      method: 'POST',
      body: { items: intent.value }
    })

    applySummary(next)
    return next
  }

  async function loadServerCart() {
    const next = await $fetch<CartSummary>('/api/cart')
    applySummary(next)
  }

  async function run(task: () => Promise<CartSummary>) {
    busy.value = true
    error.value = null

    try {
      applySummary(await task())
      return true
    } catch (caught) {
      error.value = cartErrorMessage(caught)
      return false
    } finally {
      busy.value = false
    }
  }

  function init() {
    if (hydrated.value) return Promise.resolve()
    if (initPromise) return initPromise

    initPromise = (async () => {
      intent.value = readStoredItems()

      try {
        if (session.loggedIn.value) {
          if (intent.value.length > 0) {
            await mergeGuestCart()
          } else {
            await loadServerCart()
          }
        } else {
          await quote()
        }
      } catch {
        summary.value = emptySummary()
        error.value = 'Your bag could not be loaded.'
      } finally {
        hydrated.value = true
        initPromise = null
      }
    })()

    return initPromise
  }

  async function add(input: CartInputItem, options: { openDrawer?: boolean } = {}) {
    error.value = null

    if (options.openDrawer !== false) drawerOpen.value = true

    if (session.loggedIn.value) {
      const added = await run(() => $fetch<CartSummary>('/api/cart/items', {
        method: 'POST',
        body: input
      }))
      if (added) pulse.value += 1
      return added
    }

    const snapshot = intent.value.map(item => ({ ...item }))
    const existing = intent.value.find(item => item.productId === input.productId && item.sizeMl === input.sizeMl)

    if (existing) {
      existing.quantity += input.quantity
    } else {
      intent.value.push({ ...input })
    }

    const added = await run(quote)

    if (!added) {
      intent.value = snapshot
      return false
    }

    pulse.value += 1
    return true
  }

  async function updateQuantity(productId: number, sizeMl: number, quantity: number) {
    if (session.loggedIn.value) {
      return run(() => $fetch<CartSummary>('/api/cart/items', {
        method: 'PATCH',
        body: { productId, sizeMl, quantity }
      }))
    }

    const line = intent.value.find(item => item.productId === productId && item.sizeMl === sizeMl)
    if (line) line.quantity = quantity
    return run(quote)
  }

  async function changeSize(productId: number, sizeMl: number, newSizeMl: number) {
    if (sizeMl === newSizeMl) return true

    if (session.loggedIn.value) {
      return run(() => $fetch<CartSummary>('/api/cart/items', {
        method: 'PATCH',
        body: { productId, sizeMl, newSizeMl }
      }))
    }

    const source = intent.value.find(item => item.productId === productId && item.sizeMl === sizeMl)
    if (!source) return false

    const quantity = source.quantity
    intent.value = intent.value.filter(item => item !== source)

    const target = intent.value.find(item => item.productId === productId && item.sizeMl === newSizeMl)
    if (target) {
      target.quantity += quantity
    } else {
      intent.value.push({ productId, sizeMl: newSizeMl, quantity })
    }

    return run(quote)
  }

  async function remove(productId: number, sizeMl: number) {
    if (session.loggedIn.value) {
      return run(() => $fetch<CartSummary>('/api/cart/items', {
        method: 'DELETE',
        body: { productId, sizeMl }
      }))
    }

    intent.value = intent.value.filter(item => !(item.productId === productId && item.sizeMl === sizeMl))
    return run(quote)
  }

  async function mergeGuestCart() {
    if (!import.meta.client || !session.loggedIn.value) return

    const guestItems = intent.value.length > 0 ? intent.value : readStoredItems()

    if (guestItems.length === 0) {
      await loadServerCart()
      return
    }

    busy.value = true
    error.value = null

    try {
      const next = await $fetch<CartSummary>('/api/cart/merge', {
        method: 'POST',
        body: { items: guestItems }
      })
      applySummary(next)
    } catch (caught) {
      error.value = cartErrorMessage(caught)
    } finally {
      busy.value = false
    }
  }

  function reset() {
    intent.value = []
    summary.value = emptySummary()
    drawerOpen.value = false
    error.value = null
    hydrated.value = true
    persist()
  }

  function openDrawer() {
    drawerOpen.value = true
  }

  function closeDrawer() {
    drawerOpen.value = false
  }

  function toggleDrawer() {
    drawerOpen.value = !drawerOpen.value
  }

  return {
    intent,
    summary,
    lines,
    itemCount,
    isEmpty,
    hydrated,
    busy,
    drawerOpen,
    error,
    pulse,
    loggedIn,
    init,
    add,
    updateQuantity,
    changeSize,
    remove,
    mergeGuestCart,
    reset,
    openDrawer,
    closeDrawer,
    toggleDrawer
  }
})
