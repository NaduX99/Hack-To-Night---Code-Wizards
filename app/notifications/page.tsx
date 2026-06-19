'use client'

import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock3,
  MailOpen,
  RefreshCw
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'

type Notification = {
  id: number
  email: string
  subject: string
  body: string
  status: string
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadNotifications() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/notifications')
      const payload = await response.json().catch(() => ({}))

      if (!response.ok || !payload.ok) {
        setMessage(payload.message || 'Unable to load notifications.')
        setNotifications([])
        return
      }

      setNotifications(payload.notifications || [])
    } catch {
      setMessage('Unable to load notifications.')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [])

  return (
    <main className="banking-shell flex min-h-dvh bg-[#ededed] text-black">
      <Sidebar />
      <section className="min-w-0 flex-1 px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-7">
        <header className="dashboard-enter flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-black/45">
              Account messages
            </p>
            <h1 className="mt-1 text-3xl font-medium">Notifications</h1>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
            disabled={loading}
            onClick={loadNotifications}
            type="button"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <section className="dashboard-rise mt-7 grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
          <aside className="dashboard-card bg-black p-6 text-white shadow-sm">
            <Bell size={24} />
            <h2 className="mt-6 text-2xl font-medium text-white">
              Recent account updates
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Profile updates, transfer confirmations, and email queue events
              appear here from the Nova notification service.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="bg-white/10 p-4">
                <p className="text-2xl font-semibold">{notifications.length}</p>
                <p className="mt-1 text-xs text-white/55">Messages</p>
              </div>
              <div className="bg-white/10 p-4">
                <p className="text-2xl font-semibold">
                  {
                    notifications.filter((item) => item.status === 'sent')
                      .length
                  }
                </p>
                <p className="mt-1 text-xs text-white/55">Sent</p>
              </div>
            </div>
          </aside>

          <div className="dashboard-card overflow-hidden bg-white/85 shadow-sm">
            {loading && (
              <div className="flex min-h-72 items-center justify-center text-sm text-black/50">
                Loading notifications...
              </div>
            )}

            {!loading && message && (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <AlertCircle size={26} />
                <p className="mt-3 text-sm font-semibold">{message}</p>
              </div>
            )}

            {!loading && !message && notifications.length === 0 && (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <MailOpen size={28} />
                <h2 className="mt-4 text-xl font-medium">
                  No notifications yet
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-black/50">
                  Account notices will appear here after profile updates,
                  statement emails, or other banking actions.
                </p>
              </div>
            )}

            {!loading && !message && notifications.length > 0 && (
              <div className="divide-y divide-black/5">
                {notifications.map((item) => (
                  <article
                    className="grid gap-4 px-5 py-5 sm:grid-cols-[auto_1fr_auto] sm:px-6"
                    key={item.id}
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-neutral-100">
                      {statusIcon(item.status)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-medium">
                          {item.subject}
                        </h2>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-black/55">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/55">
                        {item.body}
                      </p>
                      <p className="mt-2 truncate text-xs text-black/40">
                        {item.email}
                      </p>
                    </div>
                    <time className="text-xs text-black/40">
                      {formatDate(item.created_at)}
                    </time>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

function statusIcon(status: string) {
  if (status === 'sent') return <CheckCircle2 size={18} />
  if (status === 'failed') return <AlertCircle size={18} />
  return <Clock3 size={18} />
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}
