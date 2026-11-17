import { z } from 'zod'
import { AUDIENCES } from '../types'

const optionId = z.string().trim().min(1).max(40)

export const quizSubmissionSchema = z.object({
  audience: z.enum(AUDIENCES),
  answers: z.object({
    time: optionId,
    season: optionId,
    vibe: optionId,
    place: optionId,
    occasion: optionId,
    intensity: optionId,
    avoid: optionId
  }).strict()
}).strict()

export type QuizSubmission = z.infer<typeof quizSubmissionSchema>
export type QuizAnswers = QuizSubmission['answers']
