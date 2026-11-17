import type { Audience } from '~~/shared/types'

export const DEFAULT_AUDIENCE: Audience = 'unisex'

export interface HeroMedia {
  readonly video: string
  readonly poster: string
}

export interface HeroMotion {
  readonly ease: string
  readonly revealSeconds: number
}

export interface AudienceOption {
  readonly id: Audience
  readonly label: string
  readonly colorScheme: 'dark' | 'light'
  readonly themeColor: string
  readonly hero: HeroMedia
  readonly motion: HeroMotion
}

export const HERO_MEDIA = {
  video: '/media/hero/hero.mp4',
  poster: '/media/hero/poster.jpg'
} as const satisfies HeroMedia

export const audienceOptions = [
  {
    id: 'men',
    label: 'Men',
    colorScheme: 'dark',
    themeColor: '#0b0c0e',
    hero: HERO_MEDIA,
    motion: { ease: 'expo.out', revealSeconds: 0.7 }
  },
  {
    id: 'women',
    label: 'Women',
    colorScheme: 'light',
    themeColor: '#f5ede7',
    hero: HERO_MEDIA,
    motion: { ease: 'sine.inOut', revealSeconds: 1.1 }
  },
  {
    id: 'unisex',
    label: 'Unisex',
    colorScheme: 'light',
    themeColor: '#f5f0e6',
    hero: HERO_MEDIA,
    motion: { ease: 'power3.out', revealSeconds: 0.9 }
  }
] as const satisfies readonly AudienceOption[]

export function getAudienceOption(id: Audience): AudienceOption {
  return audienceOptions.find(option => option.id === id) ?? audienceOptions[2]
}
