import type { Occasion, QuizQuestionId, ScentFamily, Season } from '../../shared/types'

export interface QuizWeights {
  readonly families?: Partial<Record<ScentFamily, number>>
  readonly occasions?: Partial<Record<Occasion, number>>
  readonly seasons?: Partial<Record<Season, number>>
  readonly intensity?: number
}

export interface QuizOption {
  readonly id: string
  readonly weights: QuizWeights
}

export interface QuizQuestion {
  readonly id: QuizQuestionId
  readonly options: readonly QuizOption[]
}

export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'time',
    options: [
      { id: 'morning', weights: { families: { fresh: 3, aromatic: 1 }, occasions: { day: 1 } } },
      { id: 'afternoon', weights: { families: { fresh: 2, floral: 2 }, occasions: { day: 1 } } },
      { id: 'evening', weights: { families: { amber: 3, woody: 2 }, occasions: { night: 1 } } },
      { id: 'late', weights: { families: { gourmand: 3, amber: 2 }, occasions: { night: 2 } } }
    ]
  },
  {
    id: 'season',
    options: [
      { id: 'spring', weights: { families: { floral: 3, fresh: 1 }, seasons: { spring: 2 } } },
      { id: 'summer', weights: { families: { fresh: 3, aromatic: 1 }, seasons: { summer: 2 } } },
      { id: 'autumn', weights: { families: { woody: 3, amber: 1 }, seasons: { autumn: 2 } } },
      { id: 'winter', weights: { families: { amber: 2, gourmand: 2, woody: 1 }, seasons: { winter: 2 } } }
    ]
  },
  {
    id: 'vibe',
    options: [
      { id: 'calm', weights: { families: { aromatic: 3, woody: 1 }, occasions: { office: 1 } } },
      { id: 'playful', weights: { families: { gourmand: 3, fresh: 1 }, occasions: { day: 1 } } },
      { id: 'romantic', weights: { families: { floral: 3, gourmand: 1 }, occasions: { date: 2 } } },
      { id: 'bold', weights: { families: { amber: 3, woody: 2 }, occasions: { night: 2 } } }
    ]
  },
  {
    id: 'place',
    options: [
      { id: 'garden', weights: { families: { floral: 3, fresh: 1 }, seasons: { spring: 1 } } },
      { id: 'city', weights: { families: { aromatic: 2, woody: 2 }, seasons: { winter: 1 } } },
      { id: 'coast', weights: { families: { fresh: 3, aromatic: 1 }, seasons: { summer: 1 } } },
      { id: 'study', weights: { families: { woody: 3, amber: 1 }, seasons: { autumn: 1 } } }
    ]
  },
  {
    id: 'occasion',
    options: [
      { id: 'office', weights: { families: { aromatic: 2, fresh: 2 }, occasions: { office: 3, day: 1 } } },
      { id: 'date', weights: { families: { floral: 2, gourmand: 2 }, occasions: { date: 3, night: 1 } } },
      { id: 'celebration', weights: { families: { amber: 3, gourmand: 1 }, occasions: { formal: 2, night: 2 } } },
      { id: 'everyday', weights: { families: { fresh: 2, woody: 2 }, occasions: { day: 2 } } }
    ]
  },
  {
    id: 'intensity',
    options: [
      { id: 'subtle', weights: { intensity: 1 } },
      { id: 'moderate', weights: { intensity: 2 } },
      { id: 'balanced', weights: { intensity: 3 } },
      { id: 'bold', weights: { intensity: 5 } }
    ]
  },
  {
    id: 'avoid',
    options: [
      { id: 'sweet', weights: { families: { gourmand: -3 } } },
      { id: 'citrus', weights: { families: { fresh: -3 } } },
      { id: 'smoky', weights: { families: { amber: -3, woody: -1 } } },
      { id: 'floral', weights: { families: { floral: -3 } } }
    ]
  }
]
