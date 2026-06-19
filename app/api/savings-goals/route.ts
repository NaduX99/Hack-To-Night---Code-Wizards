import {
  asText,
  audit,
  query,
  readRequestBody,
  requireAuth,
  serviceFailure
} from '@/lib/platform-db'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const result = await query(
      `
      SELECT id, title, target_amount, saved_amount, daily_saving_amount, deadline, created_at
      FROM savings_goals
      WHERE user_id = ?
      ORDER BY id DESC
      `,
      [auth.user.id]
    )

    return Response.json({ ok: true, goals: result.rows })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const body = await readRequestBody(request)
    const title = asText(body.title).trim()
    const targetAmount = Number(asText(body.targetAmount))
    const savedAmount = Number(asText(body.savedAmount || 0))
    const dailySavingAmount = Number(asText(body.dailySavingAmount || 0))
    const deadline = asText(body.deadline).trim() || null

    if (!title || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      return Response.json(
        {
          ok: false,
          message: 'Valid goal title and target amount are required.'
        },
        { status: 400 }
      )
    }

    if (!Number.isFinite(savedAmount) || savedAmount < 0) {
      return Response.json(
        { ok: false, message: 'Saved amount cannot be negative.' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(dailySavingAmount) || dailySavingAmount < 0) {
      return Response.json(
        { ok: false, message: 'Daily saving amount cannot be negative.' },
        { status: 400 }
      )
    }

    await query(
      `
      INSERT INTO savings_goals (user_id, title, target_amount, saved_amount, daily_saving_amount, deadline)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        auth.user.id,
        title,
        targetAmount,
        savedAmount,
        dailySavingAmount,
        deadline
      ]
    )
    await audit('savings_goal.create', {
      userId: auth.user.id,
      title,
      targetAmount
    })

    return Response.json({
      ok: true,
      message: 'Savings goal created.'
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const body = await readRequestBody(request)
    const id = Number(asText(body.id))
    const action = asText(body.action || 'edit').trim()

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        { ok: false, message: 'Valid savings goal ID is required.' },
        { status: 400 }
      )
    }

    if (action === 'add-saving') {
      const amount = Number(asText(body.amount))
      if (!Number.isFinite(amount) || amount <= 0) {
        return Response.json(
          { ok: false, message: 'Saving amount must be greater than zero.' },
          { status: 400 }
        )
      }

      await query(
        `
        UPDATE savings_goals
        SET saved_amount = LEAST(target_amount, saved_amount + ?)
        WHERE id = ? AND user_id = ?
        `,
        [amount, id, auth.user.id]
      )
      await audit('savings_goal.add_saving', {
        userId: auth.user.id,
        id,
        amount
      })

      return Response.json({ ok: true, message: 'Saving amount added.' })
    }

    if (action === 'increase-target') {
      const amount = Number(asText(body.amount))
      if (!Number.isFinite(amount) || amount <= 0) {
        return Response.json(
          { ok: false, message: 'Target increase must be greater than zero.' },
          { status: 400 }
        )
      }

      await query(
        `
        UPDATE savings_goals
        SET target_amount = target_amount + ?
        WHERE id = ? AND user_id = ?
        `,
        [amount, id, auth.user.id]
      )

      return Response.json({ ok: true, message: 'Savings target increased.' })
    }

    const title = asText(body.title).trim()
    const targetAmount = Number(asText(body.targetAmount))
    const dailySavingAmount = Number(asText(body.dailySavingAmount || 0))
    const deadline = asText(body.deadline).trim() || null

    if (
      !title ||
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0 ||
      !Number.isFinite(dailySavingAmount) ||
      dailySavingAmount < 0
    ) {
      return Response.json(
        {
          ok: false,
          message: 'Valid title, target, and daily saving are required.'
        },
        { status: 400 }
      )
    }

    await query(
      `
      UPDATE savings_goals
      SET title = ?, target_amount = ?, daily_saving_amount = ?, deadline = ?
      WHERE id = ? AND user_id = ?
      `,
      [title, targetAmount, dailySavingAmount, deadline, id, auth.user.id]
    )

    return Response.json({ ok: true, message: 'Savings goal updated.' })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth.response || !auth.user) return auth.response

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        { ok: false, message: 'Valid savings goal ID is required.' },
        { status: 400 }
      )
    }

    await query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [
      id,
      auth.user.id
    ])
    await audit('savings_goal.delete', { userId: auth.user.id, id })

    return Response.json({ ok: true, message: 'Savings goal deleted.' })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
