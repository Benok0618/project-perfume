import type { Audience } from '~~/shared/types'

export const DEFAULT_AUDIENCE: Audience = 'unisex'

export interface AudienceOption {
  readonly id: Audience
  readonly label: string
  readonly colorScheme: 'dark' | 'light'
  readonly themeColor: string
}

export const audienceOptions = [
  { id: 'men', label: 'Men', colorScheme: 'dark', themeColor: '#0b0c0e' },
  { id: 'women', label: 'Women', colorScheme: 'light', themeColor: '#f5ede7' },
  { id: 'unisex', label: 'Unisex', colorScheme: 'light', themeColor: '#f5f0e6' }
] as const satisfies readonly AudienceOption[]

export function getAudienceOption(id: Audience): AudienceOption {
  return audienceOptions.find(option => option.id === id) ?? audienceOptions[2]
}
