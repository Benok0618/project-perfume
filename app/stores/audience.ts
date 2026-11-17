import type { Audience } from '~~/shared/types'
import { DEFAULT_AUDIENCE } from '~/config/themes'

export const useAudienceStore = defineStore('audience', () => {
  const cookie = useCookie<Audience>('audience', {
    default: () => DEFAULT_AUDIENCE,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/'
  })

  const audience = computed<Audience>({
    get: () => cookie.value ?? DEFAULT_AUDIENCE,
    set: (value) => {
      cookie.value = value
    }
  })

  function setAudience(value: Audience) {
    audience.value = value
  }

  return { audience, setAudience }
})
