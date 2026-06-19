'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'

type SmartSpend = {
  totalBalance: number
  totalSpend: number
  transferSpend: number
  billSpend: number
  insight: string
  accounts: Array<{
    account_number: string
    account_name: string
    balance: string
  }>
  recentBills: Array<{
    amount: string
    biller_name: string
    created_at: string
  }>
  budgets: Array<{
    id: number
    category: string
    target_amount: string
    spent_amount: string
    period: string
  }>
  currencyRates: {
    base: string
    date: string | null
    rates: Record<string, number>
  }
}

export default function SmartSpendPage() {
  const [data, setData] = useState<SmartSpend | null>(null)
  const [message, setMessage] = useState('')
  const [budget, setBudget] = useState({
    category: '',
    targetAmount: '',
    period: 'monthly'
  })
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null)
  const [increaseAmounts, setIncreaseAmounts] = useState<
    Record<number, string>
  >({})

  async function loadSmartSpend() {
    const response = await fetch('/api/smart-spend')
    const payload = await response.json().catch(() => ({}))

    if (!payload.ok) {
      setMessage(payload.message || 'Unable to load Smart Spend.')
      return
    }

    setData(payload.smartSpend)
  }

  useEffect(() => {
    void loadSmartSpend()
  }, [])

  async function createBudget(event: React.FormEvent) {
    event.preventDefault()
    const response = await fetch('/api/smart-spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget)
    })
    const payload = await response.json().catch(() => ({}))
    setMessage(payload.message || '')

    if (response.ok) {
      setBudget({ category: '', targetAmount: '', period: 'monthly' })
      await loadSmartSpend()
    }
  }

  function startEditBudget(item: SmartSpend['budgets'][number]) {
    setEditingBudgetId(item.id)
    setBudget({
      category: item.category,
      targetAmount: String(item.target_amount),
      period: item.period
    })
  }

  async function updateBudget(event: React.FormEvent) {
    event.preventDefault()
    if (!editingBudgetId) return

    const response = await fetch('/api/smart-spend', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingBudgetId, ...budget })
    })
    const payload = await response.json().catch(() => ({}))
    setMessage(payload.message || '')

    if (response.ok) {
      setEditingBudgetId(null)
      setBudget({ category: '', targetAmount: '', period: 'monthly' })
      await loadSmartSpend()
    }
  }

  async function increaseBudget(id: number) {
    const increaseBy = increaseAmounts[id]
    const response = await fetch('/api/smart-spend', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, increaseBy })
    })
    const payload = await response.json().catch(() => ({}))
    setMessage(payload.message || '')

    if (response.ok) {
      setIncreaseAmounts((current) => ({ ...current, [id]: '' }))
      await loadSmartSpend()
    }
  }

  return (
    <main className="flex min-h-screen bg-[#f3f4f6] text-black">
      <Sidebar />
      <section className="flex-1 p-10">
        <h1 className="text-3xl font-bold">Smart Spend</h1>
        {message && (
          <p className="mt-4 text-sm font-semibold text-red-700">{message}</p>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <Metric
            label="Total Balance"
            value={formatMoney(data?.totalBalance)}
          />
          <Metric label="Total Spend" value={formatMoney(data?.totalSpend)} />
          <Metric label="Transfers" value={formatMoney(data?.transferSpend)} />
          <Metric label="Bills" value={formatMoney(data?.billSpend)} />
        </div>

        <section className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-bold">Insight</h2>
          <p className="mt-2 text-gray-700">{data?.insight || '-'}</p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Budget Targets</h2>
            <form
              onSubmit={editingBudgetId ? updateBudget : createBudget}
              className="mt-4 grid gap-3"
            >
              <input
                value={budget.category}
                onChange={(event) =>
                  setBudget((current) => ({
                    ...current,
                    category: event.target.value
                  }))
                }
                placeholder="Category"
                className="rounded border border-gray-200 px-4 py-3"
              />
              <input
                value={budget.targetAmount}
                onChange={(event) =>
                  setBudget((current) => ({
                    ...current,
                    targetAmount: event.target.value
                  }))
                }
                placeholder="Target amount"
                type="number"
                className="rounded border border-gray-200 px-4 py-3"
              />
              <button className="rounded-full bg-[#450043] px-5 py-3 font-bold text-white">
                {editingBudgetId ? 'Update Target' : 'Create Target'}
              </button>
              {editingBudgetId && (
                <button
                  className="rounded-full border border-gray-300 px-5 py-3 font-bold"
                  onClick={() => {
                    setEditingBudgetId(null)
                    setBudget({
                      category: '',
                      targetAmount: '',
                      period: 'monthly'
                    })
                  }}
                  type="button"
                >
                  Cancel Edit
                </button>
              )}
            </form>
            <div className="mt-5 space-y-3">
              {data?.budgets.map((item) => (
                <div className="border-b border-gray-200 pb-4" key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold">{item.category}</span>
                      <p className="text-sm text-gray-500">
                        {formatMoney(Number(item.spent_amount))} of{' '}
                        {formatMoney(Number(item.target_amount))}
                      </p>
                    </div>
                    <button
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold"
                      onClick={() => startEditBudget(item)}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full bg-[#450043]"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(item.spent_amount) /
                            Math.max(Number(item.target_amount), 1)) *
                            100
                        )}%`
                      }}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      className="min-w-0 flex-1 rounded border border-gray-200 px-3 py-2 text-sm"
                      onChange={(event) =>
                        setIncreaseAmounts((current) => ({
                          ...current,
                          [item.id]: event.target.value
                        }))
                      }
                      placeholder="Increase target"
                      type="number"
                      value={increaseAmounts[item.id] || ''}
                    />
                    <button
                      className="rounded-full bg-[#9a5c97] px-4 py-2 text-sm font-bold text-white"
                      onClick={() => increaseBudget(item.id)}
                      type="button"
                    >
                      Increase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Daily Currency Rates</h2>
            <p className="mt-1 text-sm text-gray-500">
              Base: {data?.currencyRates.base || 'USD'} Date:{' '}
              {data?.currencyRates.date || 'fallback'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Object.entries(data?.currencyRates.rates || {}).map(
                ([currency, rate]) => (
                  <div className="rounded bg-gray-50 p-3" key={currency}>
                    <span className="text-sm text-gray-500">{currency}</span>
                    <p className="text-lg font-bold">{rate}</p>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Accounts</h2>
            <div className="mt-4 space-y-3">
              {data?.accounts.map((account) => (
                <div
                  className="flex justify-between border-b border-gray-200 pb-3"
                  key={account.account_number}
                >
                  <span>{account.account_name}</span>
                  <strong>{formatMoney(Number(account.balance))}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Recent Bills</h2>
            <div className="mt-4 space-y-3">
              {data?.recentBills.map((bill, index) => (
                <div
                  className="flex justify-between border-b border-gray-200 pb-3"
                  key={`${bill.biller_name}-${index}`}
                >
                  <span>{bill.biller_name}</span>
                  <strong>{formatMoney(Number(bill.amount))}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  )
}

function formatMoney(value: number | undefined) {
  if (value === undefined) return '-'
  return `Rs. ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}
