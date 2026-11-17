import { quizSubmissionSchema } from '../../../shared/schemas/quiz'
import { db } from '../../db/client'
import { quizResults } from '../../db/schema'
import { buildQuizResult, quizScoreSnapshot } from '../../utils/quiz'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, input => quizSubmissionSchema.parse(input))
  const result = buildQuizResult(body.answers, body.audience)
  const session = await getUserSession(event)
  const userId = Number(session.user?.id)

  if (Number.isInteger(userId) && userId > 0) {
    db.insert(quizResults).values({
      userId,
      audience: body.audience,
      answers: body.answers,
      scores: quizScoreSnapshot(body.answers),
      topProductId: result.match?.product.id ?? null
    }).run()
  }

  return result
})
