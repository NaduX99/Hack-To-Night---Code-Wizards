'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'

type Goal = {
  id: number
  title: string
  target_amount: string
  saved_amount: string
  daily_saving_amount: string
  deadline: string | null
}

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    title: '',
    targetAmount: '',
    savedAmount: '',
    dailySavingAmount: '',
    deadline: ''
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [goalAmounts, setGoalAmounts] = useState<Record<number, string>>({})

  async function loadGoals() {
    const response = await fetch('/api/savings-goals')
    const payload = await response.json().catch(() => ({}))
    if (!payload.ok) {
      setMessage(payload.message || 'Unable to load goals.')
      return
    }
    setGoals(payload.goals || [])
  }

  useEffect(() => {
    void loadGoals()
  }, [])

  async function createGoal(event: React.FormEvent) {
    event.preventDefault()
    const response = await fetch('/api/savings-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const payload = await response.json().catch(() => ({}))
    setMessage(payload.message || '')

    if (response.ok) {
      resetForm()
      await loadGoals()
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm({
      title: '',
      targetAmount: '',
      savedAmount: '',
      dailySavingAmount: '',
      deadline: ''
    })
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id)
    setForm({
      title: goal.title,
      targetAmount: goal.target_amount,
      savedAmount: goal.saved_amount,
      dailySavingAmount: goal.daily_saving_amount,
      deadline: goal.deadline || ''
    })
  }

  async function updateGoal(event: React.FormEvent) {
    event.preventDefault()
    if (!editingId) return

    const response = await fetch('/api/savings-goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, ...form })
    })
    const payload = await response.json().catch(() => ({}))
    setMessage(payload.message || '')

    if (response.ok) {
      resetForm()
      await loadGoals()
    }
  }

  async function goalAction(id: number, action: string) {
    const response = await fetch('/api/savings-goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        action,
        amount: goalAmounts[id]
      })
    })
    const payload = await response.json().catch(() => ({}))
    setMessage(payload.message || '')

    if (response.ok) {
      setGoalAmounts((current) => ({ ...current, [id]: '' }))
      await loadGoals()
    }
  }

  async function deleteGoal(id: number) {
    const response = await fetch(`/api/savings-goals?id=${id}`, {
      method: 'DELETE'
    })
    const payload = await response.json().catch(() => ({}))
    setMessage(payload.message || '')

    if (response.ok) await loadGoals()
  }

  return (
    <main className="flex min-h-screen bg-[#f3f4f6] text-black">
      <Sidebar />
      <section className="flex-1 p-10">
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        {message && <p className="mt-4 text-sm font-semibold">{message}</p>}

        <form
          onSubmit={editingId ? updateGoal : createGoal}
          className="mt-8 grid gap-4 rounded-lg bg-white p-6 shadow md:grid-cols-4"
        >
          <input
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Goal title"
            className="rounded border border-gray-200 px-4 py-3"
          />
          <input
            value={form.targetAmount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                targetAmount: event.target.value
              }))
            }
            placeholder="Target amount"
            type="number"
            className="rounded border border-gray-200 px-4 py-3"
          />
          <input
            value={form.dailySavingAmount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                dailySavingAmount: event.target.value
              }))
            }
            placeholder="Daily saving"
            type="number"
            className="rounded border border-gray-200 px-4 py-3"
          />
          <input
            value={form.deadline}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                deadline: event.target.value
              }))
            }
            type="date"
            className="rounded border border-gray-200 px-4 py-3"
          />
          <button className="rounded bg-[#450043] px-5 py-3 font-bold text-white">
            {editingId ? 'Update Goal' : 'Create Goal'}
          </button>
          {editingId && (
            <button
              className="rounded border border-gray-300 px-5 py-3 font-bold"
              onClick={resetForm}
              type="button"
            >
              Cancel
            </button>
          )}
        </form>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {goals.map((goal) => {
            const target = Number(goal.target_amount)
            const saved = Number(goal.saved_amount)
            const progress =
              target > 0 ? Math.min((saved / target) * 100, 100) : 0
            const remaining = Math.max(target - saved, 0)
            const dailySaving = Number(goal.daily_saving_amount)
            const daysLeft =
              dailySaving > 0 ? Math.ceil(remaining / dailySaving) : null

            return (
              <article className="rounded-lg bg-white p-6 shadow" key={goal.id}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold">{goal.title}</h2>
                  <button
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold"
                    onClick={() => startEdit(goal)}
                    type="button"
                  >
                    Edit
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Target: {formatMoney(target)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Saved: {formatMoney(saved)} Remaining:{' '}
                  {formatMoney(remaining)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Daily plan: {formatMoney(dailySaving)}
                  {daysLeft !== null ? `, ${daysLeft} days to complete` : ''}
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-[#450043]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {progress.toFixed(0)}% saved
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded border border-gray-200 px-3 py-2"
                    onChange={(event) =>
                      setGoalAmounts((current) => ({
                        ...current,
                        [goal.id]: event.target.value
                      }))
                    }
                    placeholder="Amount"
                    type="number"
                    value={goalAmounts[goal.id] || ''}
                  />
                  <button
                    className="rounded bg-[#450043] px-3 py-2 text-sm font-bold text-white"
                    onClick={() => goalAction(goal.id, 'add-saving')}
                    type="button"
                  >
                    Add
                  </button>
                  <button
                    className="rounded bg-[#9a5c97] px-3 py-2 text-sm font-bold text-white"
                    onClick={() => goalAction(goal.id, 'increase-target')}
                    type="button"
                  >
                    Raise
                  </button>
                </div>
                <button
                  className="mt-3 text-sm font-bold text-red-700"
                  onClick={() => deleteGoal(goal.id)}
                  type="button"
                >
                  Delete Goal
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function formatMoney(value: number) {
  return `Rs. ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}
