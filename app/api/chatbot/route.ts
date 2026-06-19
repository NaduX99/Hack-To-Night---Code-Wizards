import {
  asText,
  getCurrentUser,
  query,
  readRequestBody,
  serviceFailure
} from '@/lib/platform-db'

type GroqChoice = {
  message?: {
    content?: string
  }
}

const chatAttempts = new Map<string, { count: number; resetAt: number }>()
const CHAT_WINDOW_MS = 15 * 60 * 1000
const MAX_PUBLIC_MESSAGES = 20

export async function POST(request: Request) {
  try {
    const clientKey =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'local-client'

    if (isRateLimited(clientKey)) {
      return Response.json(
        { ok: false, message: 'Chat limit reached. Try again later.' },
        { status: 429 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return Response.json(
        { ok: false, message: 'Groq API key is not configured.' },
        { status: 503 }
      )
    }

    const body = await readRequestBody(request)
    const message = asText(body.message).trim().slice(0, 1000)

    if (message.length < 2) {
      return Response.json(
        { ok: false, message: 'Message is required.' },
        { status: 400 }
      )
    }

    const user = await getCurrentUser(request)
    const context = user
      ? await loadUserFinancialContext(user.id)
      : { visitor: 'public', note: 'No private banking data is available.' }

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content:
                'You are Nova Bank assistant. Help with product navigation, budgeting, savings goals, and transaction explanations. Public visitors can receive general help only. Never claim to execute transactions. Do not provide legal, investment, or loan approval guarantees. Keep answers concise.'
            },
            {
              role: 'system',
              content: `Available context JSON: ${JSON.stringify(context)}`
            },
            { role: 'user', content: message }
          ],
          temperature: 0.3,
          max_completion_tokens: 500
        })
      }
    )

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          message: payload.error?.message || 'Groq chatbot request failed.'
        },
        { status: response.status }
      )
    }

    const choices = (payload.choices || []) as GroqChoice[]
    const answer =
      choices[0]?.message?.content?.trim() ||
      'I could not generate a response right now.'

    return Response.json({ ok: true, answer })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

async function loadUserFinancialContext(userId: number) {
  const [accounts, budgets, goals, transactions] = await Promise.all([
    query(
      'SELECT account_name, account_number, balance FROM accounts WHERE user_id = ? ORDER BY id',
      [userId]
    ),
    query(
      'SELECT category, target_amount, spent_amount, period FROM budgets WHERE user_id = ? ORDER BY id DESC LIMIT 10',
      [userId]
    ),
    query(
      'SELECT title, target_amount, saved_amount, daily_saving_amount, deadline FROM savings_goals WHERE user_id = ? ORDER BY id DESC LIMIT 10',
      [userId]
    ),
    query(
      'SELECT amount, purpose, category, created_at FROM transactions WHERE created_by = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    )
  ])

  return {
    accounts: accounts.rows,
    budgets: budgets.rows,
    savingsGoals: goals.rows,
    recentTransactions: transactions.rows
  }
}

function isRateLimited(key: string) {
  const now = Date.now()
  const current = chatAttempts.get(key)

  if (!current || current.resetAt < now) {
    chatAttempts.set(key, { count: 1, resetAt: now + CHAT_WINDOW_MS })
    return false
  }

  current.count += 1
  return current.count > MAX_PUBLIC_MESSAGES
}
