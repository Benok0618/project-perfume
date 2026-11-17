import type { Audience, Occasion, ScentFamily } from '~~/shared/types'
import { AUDIENCES, OCCASIONS, SCENT_FAMILIES } from '~~/shared/types'
import type { ProductSort } from '~~/shared/schemas/product'
import { PRODUCT_SIZES, PRODUCT_SORTS } from '~~/shared/schemas/product'
import { useAudienceStore } from '~/stores/audience'

export interface ShopFilterState {
  q: string
  audience: Audience
  family: ScentFamily[]
  occasion: Occasion[]
  size: number | null
  intensity: number | null
  priceMin: number | null
  priceMax: number | null
  sort: ProductSort
}

const FILTER_KEYS = ['q', 'audience', 'family', 'occasion', 'size', 'intensity', 'minPrice', 'maxPrice', 'sort']

function firstValue(value: unknown) {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined
  return typeof value === 'string' ? value : undefined
}

function listValues(value: unknown) {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []

  return raw
    .flatMap(item => typeof item === 'string' ? item.split(',') : [])
    .map(item => item.trim())
    .filter(Boolean)
}

function intValue(value: unknown) {
  const raw = firstValue(value)
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function useShopFilters() {
  const route = useRoute()
  const router = useRouter()
  const audienceStore = useAudienceStore()

  const filters = computed<ShopFilterState>(() => {
    const query = route.query
    const audience = firstValue(query.audience) as Audience | undefined
    const sort = firstValue(query.sort) as ProductSort | undefined
    const size = intValue(query.size)
    const intensity = intValue(query.intensity)

    return {
      q: firstValue(query.q)?.trim() ?? '',
      audience: audience && AUDIENCES.includes(audience) ? audience : audienceStore.audience,
      family: listValues(query.family).filter((value): value is ScentFamily => SCENT_FAMILIES.includes(value as ScentFamily)),
      occasion: listValues(query.occasion).filter((value): value is Occasion => OCCASIONS.includes(value as Occasion)),
      size: size !== null && (PRODUCT_SIZES as readonly number[]).includes(size) ? size : null,
      intensity: intensity !== null && intensity >= 1 && intensity <= 5 ? intensity : null,
      priceMin: intValue(query.minPrice),
      priceMax: intValue(query.maxPrice),
      sort: sort && PRODUCT_SORTS.includes(sort) ? sort : 'featured'
    }
  })

  const apiQuery = computed<Record<string, string | number>>(() => {
    const state = filters.value
    const query: Record<string, string | number> = {
      audience: state.audience,
      sort: state.sort
    }

    if (state.q) query.q = state.q
    if (state.family.length) query.family = state.family.join(',')
    if (state.occasion.length) query.occasion = state.occasion.join(',')
    if (state.size !== null) query.size = state.size
    if (state.intensity !== null) query.intensity = state.intensity
    if (state.priceMin !== null) query.minPrice = state.priceMin
    if (state.priceMax !== null) query.maxPrice = state.priceMax

    return query
  })

  const activeFilterCount = computed(() => {
    const state = filters.value
    return (state.q ? 1 : 0)
      + state.family.length
      + state.occasion.length
      + (state.size !== null ? 1 : 0)
      + (state.intensity !== null ? 1 : 0)
      + (state.priceMin !== null || state.priceMax !== null ? 1 : 0)
  })

  const isDefault = computed(() => activeFilterCount.value === 0)

  function preservedQuery() {
    const query: Record<string, string | string[]> = {}

    for (const [key, value] of Object.entries(route.query)) {
      if (FILTER_KEYS.includes(key)) continue
      if (typeof value === 'string') query[key] = value
      else if (Array.isArray(value)) query[key] = value.filter((item): item is string => typeof item === 'string')
    }

    return query
  }

  function update(patch: Partial<ShopFilterState>, options: { replace?: boolean } = {}) {
    const next = { ...filters.value, ...patch }
    const query = preservedQuery()

    query.audience = next.audience
    if (next.q) query.q = next.q
    if (next.family.length) query.family = next.family.join(',')
    if (next.occasion.length) query.occasion = next.occasion.join(',')
    if (next.size !== null) query.size = String(next.size)
    if (next.intensity !== null) query.intensity = String(next.intensity)
    if (next.priceMin !== null) query.minPrice = String(next.priceMin)
    if (next.priceMax !== null) query.maxPrice = String(next.priceMax)
    if (next.sort !== 'featured') query.sort = next.sort

    const navigate = options.replace ? router.replace : router.push
    navigate({ query })
  }

  function reset() {
    const query = preservedQuery()
    delete query.product
    query.audience = filters.value.audience
    router.push({ query })
  }

  return { filters, apiQuery, activeFilterCount, isDefault, update, reset }
}
