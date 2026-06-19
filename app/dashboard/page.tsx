'use client'

import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CreditCard,
  FileText,
  Lightbulb,
  MoreHorizontal,
  PiggyBank,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/sidebar'

type User = {
  full_name: string
  email?: string
  avatar_url?: string | null
}

type Account = {
  account_number: string
  account_name: string
  balance: string
}

type Transaction = {
  id: number
  from_account: string
  to_account: string
  amount: string
  purpose?: string | null
  category?: string | null
  status: string
  created_at: string
}

type Beneficiary = {
  id: number
  nickname?: string | null
  account_name: string
  account_number: string
  bank_name: string
}

const categoryColors = ['#111111', '#555555', '#8a8a8a', '#b7b7b7', '#dedede']

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [meResponse, accountsResponse, beneficiariesResponse] =
          await Promise.all([
            fetch('/api/auth/me'),
            fetch('/api/accounts'),
            fetch('/api/beneficiaries')
          ])
        const [mePayload, accountsPayload, beneficiariesPayload] =
          await Promise.all([
            meResponse.json(),
            accountsResponse.json(),
            beneficiariesResponse.json()
          ])

        const loadedAccounts: Account[] = accountsPayload.accounts || []
        setUser(mePayload.user || null)
        setAccounts(loadedAccounts)
        setBeneficiaries(beneficiariesPayload.beneficiaries || [])

        const results = await Promise.all(
          loadedAccounts.map((account) =>
            fetch(
              `/api/transactions?account=${encodeURIComponent(account.account_number)}`
            )
              .then((response) => response.json())
              .then((payload) => payload.transactions || [])
              .catch(() => [])
          )
        )

        const unique = new Map<number, Transaction>()
        results.flat().forEach((transaction: Transaction) => {
          unique.set(transaction.id, transaction)
        })
        setTransactions(
          [...unique.values()].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        )
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  const accountNumbers = useMemo(
    () => new Set(accounts.map((account) => account.account_number)),
    [accounts]
  )
  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0
  )
  const spending = transactions.filter(
    (transaction) =>
      accountNumbers.has(transaction.from_account) &&
      transaction.status.toLowerCase() !== 'failed'
  )
  const monthlySpend = spending
    .filter((transaction) => isCurrentMonth(transaction.created_at))
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

  const categoryData = useMemo(() => {
    const values = new Map<string, number>()
    spending.forEach((transaction) => {
      const category = transaction.category || 'Transfers'
      values.set(
        category,
        (values.get(category) || 0) + Number(transaction.amount)
      )
    })
    return [...values.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [spending])

  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      const value = spending
        .filter((transaction) => {
          const itemDate = new Date(transaction.created_at)
          return itemDate.toDateString() === date.toDateString()
        })
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value
      }
    })
  }, [spending])

  const topCategory = categoryData[0]
  const savingsPotential = Math.max(totalBalance * 0.1, 0)
  const tips = [
    topCategory
      ? `${topCategory.label} is your largest spending category. Review it before your next payment.`
      : 'Make your first payment to unlock personalized spending guidance.',
    monthlySpend > totalBalance * 0.3
      ? 'Monthly outflow is above 30% of your current balance. Consider setting a category budget.'
      : 'Your current spending-to-balance ratio is within a comfortable range.',
    `A weekly transfer of ${formatMoney(savingsPotential / 4)} could build a 10% balance reserve this month.`
  ]

  return (
    <main className="banking-shell flex min-h-dvh bg-[#ededed] text-black">
      <Sidebar />
      <section className="min-w-0 flex-1 px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-7">
        <header className="dashboard-enter flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-black/45">
              Financial overview
            </p>
            <h1 className="mt-1 text-3xl font-medium">
              Good {getDayPeriod()}, {firstName(user?.full_name)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Search"
              className="flex size-10 items-center justify-center rounded-full bg-white/70 shadow-sm transition-transform hover:scale-105"
              type="button"
            >
              <Search size={18} />
            </button>
            <button
              aria-label="Notifications"
              className="relative flex size-10 items-center justify-center rounded-full bg-white/70 shadow-sm transition-transform hover:scale-105"
              type="button"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-black" />
            </button>
            <Link
              className="ml-1 flex items-center gap-3 rounded-full bg-white/70 py-1.5 pl-1.5 pr-4 shadow-sm"
              href="/profile"
            >
              <img
                alt=""
                className="size-8 rounded-full bg-neutral-200 object-cover"
                src={user?.avatar_url || '/avatar.png'}
              />
              <span className="hidden text-sm font-medium sm:inline">
                {firstName(user?.full_name)}
              </span>
            </Link>
          </div>
        </header>

        <section className="dashboard-rise mt-7 grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
          <article className="relative min-h-[270px] overflow-hidden bg-black p-6 text-white shadow-xl sm:p-8">
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/55">
                    Total available balance
                  </p>
                  <p className="mt-2 text-3xl font-medium sm:text-4xl">
                    {loading ? 'Loading...' : formatMoney(totalBalance)}
                  </p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-white/10">
                  <WalletCards size={20} />
                </span>
              </div>
              <div>
                <div className="mb-5 flex flex-wrap gap-2">
                  <Link
                    className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-105"
                    href="/bank-transfer"
                  >
                    Send money <ArrowUpRight size={16} />
                  </Link>
                  <Link
                    className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium transition-transform hover:scale-105"
                    href="/bank-accounts"
                  >
                    View accounts <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/45">
                  <ShieldCheck size={15} />
                  Protected by encrypted session authentication
                </div>
              </div>
            </div>
            <div className="absolute -bottom-28 -right-20 size-72 rounded-full border-[42px] border-white/5" />
          </article>

          <article className="dashboard-card bg-white/80 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  This month
                </p>
                <h2 className="mt-1 text-xl font-medium">Money movement</h2>
              </div>
              <TrendingUp size={22} />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="bg-neutral-100 p-4">
                <ArrowUpRight className="text-black/45" size={19} />
                <p className="mt-5 text-xs text-black/45">Spent</p>
                <p className="mt-1 font-semibold">
                  {formatMoney(monthlySpend)}
                </p>
              </div>
              <div className="bg-neutral-100 p-4">
                <PiggyBank className="text-black/45" size={19} />
                <p className="mt-5 text-xs text-black/45">Reserve target</p>
                <p className="mt-1 font-semibold">
                  {formatMoney(savingsPotential)}
                </p>
              </div>
            </div>
            <Link
              className="mt-5 flex items-center justify-between text-sm font-medium"
              href="/smart-spend"
            >
              Open Smart Spend <ArrowRight size={16} />
            </Link>
          </article>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <article className="dashboard-card bg-white/80 p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Last 7 days
                </p>
                <h2 className="mt-1 text-xl font-medium">Daily spending</h2>
              </div>
              <button aria-label="Chart options" type="button">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <BarChart data={weeklyData} />
          </article>

          <article className="dashboard-card bg-white/80 p-5 shadow-sm sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-black/40">
              Distribution
            </p>
            <h2 className="mt-1 text-xl font-medium">Spend by category</h2>
            <PieChart data={categoryData} />
          </article>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <article className="dashboard-card overflow-hidden bg-white/80 shadow-sm">
            <div className="flex items-center justify-between px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Activity
                </p>
                <h2 className="mt-1 text-xl font-medium">
                  Recent transactions
                </h2>
              </div>
              <Link className="text-sm font-medium" href="/e-statement">
                View all
              </Link>
            </div>
            <div>
              {transactions.slice(0, 5).map((transaction) => {
                const outgoing = accountNumbers.has(transaction.from_account)
                return (
                  <div
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-black/5 px-5 py-4 sm:px-6"
                    key={transaction.id}
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-neutral-100">
                      {outgoing ? (
                        <ArrowUpRight size={17} />
                      ) : (
                        <ArrowDownLeft size={17} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {transaction.purpose ||
                          transaction.category ||
                          (outgoing ? 'Money sent' : 'Money received')}
                      </p>
                      <p className="mt-0.5 text-xs text-black/40">
                        {new Date(transaction.created_at).toLocaleDateString()}{' '}
                        · {transaction.status}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {outgoing ? '-' : '+'}
                      {formatMoney(Number(transaction.amount))}
                    </p>
                  </div>
                )
              })}
              {!loading && transactions.length === 0 && (
                <p className="px-6 py-12 text-center text-sm text-black/45">
                  Your completed transactions will appear here.
                </p>
              )}
            </div>
          </article>

          <div className="grid gap-4">
            <article className="dashboard-card bg-white/80 p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Lightbulb size={19} />
                <h2 className="text-lg font-medium">Personal banking tips</h2>
              </div>
              <div className="mt-5 space-y-4">
                {tips.map((tip, index) => (
                  <div className="flex gap-3" key={tip}>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-black/60">{tip}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="dashboard-card bg-white/80 p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Saved payees</h2>
                <span className="text-xs text-black/40">
                  {beneficiaries.length} saved
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {beneficiaries.slice(0, 3).map((payee) => (
                  <div className="flex items-center gap-3" key={payee.id}>
                    <span className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold">
                      {(payee.nickname || payee.account_name)
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {payee.nickname || payee.account_name}
                      </p>
                      <p className="truncate text-xs text-black/40">
                        {payee.bank_name} · {maskAccount(payee.account_number)}
                      </p>
                    </div>
                  </div>
                ))}
                {beneficiaries.length === 0 && (
                  <p className="py-3 text-sm text-black/45">
                    Save a beneficiary during your next transfer.
                  </p>
                )}
              </div>
            </article>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Pay a bill', '/pay-bills', ReceiptText],
            ['Set a goal', '/savings-goals', Target],
            ['Statement', '/e-statement', FileText],
            ['New account', '/bank-accounts?screen=add', CreditCard]
          ].map(([label, href, Icon]) => (
            <Link
              className="dashboard-card flex min-h-24 flex-col justify-between bg-white/70 p-4 text-sm font-medium shadow-sm transition-transform hover:-translate-y-1"
              href={href as string}
              key={label as string}
            >
              <Icon size={19} />
              <span className="flex items-center justify-between">
                {label as string} <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </section>
      </section>
    </main>
  )
}

function BarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <div className="mt-7">
      <div className="flex h-44 items-end gap-2 sm:gap-4">
        {data.map((item) => (
          <div
            className="flex h-full flex-1 flex-col justify-end"
            key={item.label}
          >
            <div
              className="w-full bg-black transition-[height] duration-700"
              style={{
                height: `${Math.max(item.value ? (item.value / max) * 100 : 3, 3)}%`
              }}
              title={formatMoney(item.value)}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2 sm:gap-4">
        {data.map((item) => (
          <div
            className="flex-1 text-center text-[11px] text-black/40"
            key={item.label}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function PieChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cursor = 0
  const stops = data.map((item, index) => {
    const start = cursor
    cursor += total ? (item.value / total) * 100 : 0
    return `${categoryColors[index]} ${start}% ${cursor}%`
  })
  const background = total
    ? `conic-gradient(${stops.join(', ')})`
    : 'conic-gradient(#e5e5e5 0 100%)'

  return (
    <div className="mt-6 flex items-center gap-6">
      <div
        aria-label="Spending category pie chart"
        className="relative size-32 shrink-0 rounded-full"
        role="img"
        style={{ background }}
      >
        <div className="absolute inset-7 flex items-center justify-center rounded-full bg-white text-center text-[10px] font-medium">
          {total ? 'Spending' : 'No data'}
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        {data.map((item, index) => (
          <div className="flex items-center gap-2 text-xs" key={item.label}>
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: categoryColors[index] }}
            />
            <span className="min-w-0 flex-1 truncate text-black/55">
              {item.label}
            </span>
            <span className="font-medium">
              {total ? Math.round((item.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function isCurrentMonth(value: string) {
  const date = new Date(value)
  const now = new Date()
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

function formatMoney(value: number) {
  return `Rs. ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

function maskAccount(value: string) {
  return `•••• ${value.slice(-4)}`
}

function firstName(value?: string) {
  return value?.trim().split(/\s+/)[0] || 'Customer'
}

function getDayPeriod() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}
