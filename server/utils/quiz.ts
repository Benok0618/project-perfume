import type { Audience, Occasion, QuizMatch, QuizQuestionId, QuizResult, ScentFamily, Season } from '../../shared/types'
import { OCCASIONS, SCENT_FAMILIES, SEASONS } from '../../shared/types'
import { QUIZ_QUESTIONS } from '../../app/config/quiz'
import { listProducts } from './products'

type Answers = Record<QuizQuestionId, string>

interface QuizTally {
  families: Record<ScentFamily, number>
  occasions: Record<Occasion, number>
  seasons: Record<Season, number>
  intensity: number
}

function emptyRecord<T extends string>(keys: readonly T[]) {
  return Object.fromEntries(keys.map(key => [key, 0])) as Record<T, number>
}

function tallyAnswers(answers: Answers): QuizTally {
  const tally: QuizTally = {
    families: emptyRecord(SCENT_FAMILIES),
    occasions: emptyRecord(OCCASIONS),
    seasons: emptyRecord(SEASONS),
    intensity: 3
  }

  for (const question of QUIZ_QUESTIONS) {
    const optionId = answers[question.id]
    const option = question.options.find(item => item.id === optionId)

    if (!option) {
      throw createError({ statusCode: 422, statusMessage: 'Invalid quiz answer' })
    }

    for (const [family, weight] of Object.entries(option.weights.families ?? {})) {
      tally.families[family as ScentFamily] += weight
    }

    for (const [occasion, weight] of Object.entries(option.weights.occasions ?? {})) {
      tally.occasions[occasion as Occasion] += weight
    }

    for (const [season, weight] of Object.entries(option.weights.seasons ?? {})) {
      tally.seasons[season as Season] += weight
    }

    if (option.weights.intensity !== undefined) {
      tally.intensity = option.weights.intensity
    }
  }

  return tally
}

function matchesAudience(productAudience: Audience, audience: Audience) {
  if (audience === 'unisex') return productAudience === 'unisex'
  return productAudience === audience || productAudience === 'unisex'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function quizScoreSnapshot(answers: Answers) {
  const tally = tallyAnswers(answers)
  return { ...tally.families, intensityTarget: tally.intensity }
}

export function buildQuizResult(answers: Answers, audience: Audience): QuizResult {
  const tally = tallyAnswers(answers)

  const matches: QuizMatch[] = listProducts()
    .filter(product => matchesAudience(product.audience, audience))
    .filter(product => product.sizes.some(size => size.stock > 0))
    .map((product) => {
      const familyScore = tally.families[product.scentFamily]
      const occasionScore = product.occasions.reduce((sum, occasion) => sum + tally.occasions[occasion], 0)
      const seasonScore = product.seasons.reduce((sum, season) => sum + tally.seasons[season], 0)
      const intensityCloseness = Math.max(0, 4 - Math.abs(product.intensity - tally.intensity))
      const raw = 40 + familyScore * 1.6 + Math.min(occasionScore, 3) * 3 + Math.min(seasonScore, 2) * 3 + intensityCloseness * 2.5

      return { product, matchPercent: clamp(Math.round(raw), 15, 96) }
    })
    .sort((a, b) =>
      b.matchPercent - a.matchPercent
      || Number(b.product.isFeatured) - Number(a.product.isFeatured)
      || a.product.id - b.product.id
    )

  return {
    audience,
    answers,
    match: matches[0] ?? null,
    runnerUps: matches.slice(1, 3),
    eligibleCount: matches.length,
    createdAt: new Date().toISOString()
  }
}
