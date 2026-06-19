'use client'

import {
  Bell,
  Check,
  LockKeyhole,
  Mail,
  MonitorSmartphone,
  Save,
  ShieldCheck,
  UserRound
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'

type Profile = {
  full_name: string
  email: string
  nic: string | null
  username: string
  role: string
  avatar_url: string | null
}

const avatarOptions = [
  '/avatar.png',
  '/person-logo.png',
  '/person.png',
  '/loginlogo.png'
]

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    transferAlerts: true,
    compactView: false
  })

  useEffect(() => {
    fetch('/api/profile')
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.ok) {
          setMessage(payload.message || 'Unable to load settings.')
          return
        }
        setProfile(payload.profile)
      })
      .catch(() => setMessage('Unable to load settings.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!profile) return

    setSaving(true)
    setMessage('')

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: profile.full_name,
        email: profile.email,
        nic: profile.nic || '',
        avatarUrl: profile.avatar_url || ''
      })
    })
    const payload = await response.json().catch(() => ({}))
    setMessage(
      payload.message || (response.ok ? 'Settings saved.' : 'Update failed.')
    )
    setSaving(false)
  }

  return (
    <main className="banking-shell flex min-h-dvh bg-[#ededed] text-black">
      <Sidebar />
      <section className="min-w-0 flex-1 px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-7">
        <header className="dashboard-enter flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-black/45">
              Account control
            </p>
            <h1 className="mt-1 text-3xl font-medium">Settings</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm shadow-sm">
            <ShieldCheck size={17} />
            Secure session active
          </div>
        </header>

        {message && (
          <p className="mt-5 rounded-lg bg-white px-4 py-3 text-sm font-semibold shadow-sm">
            {message}
          </p>
        )}

        <div className="dashboard-rise mt-7 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <form
            className="dashboard-card bg-white/85 p-5 shadow-sm sm:p-6"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-black text-white">
                <UserRound size={18} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Profile
                </p>
                <h2 className="text-xl font-medium">Personal details</h2>
              </div>
            </div>

            <div className="mt-6">
              <span className="text-sm font-medium text-black/60">Avatar</span>
              <div className="mt-3 flex flex-wrap gap-3">
                {avatarOptions.map((avatar) => (
                  <button
                    aria-label="Select avatar"
                    className={`size-16 overflow-hidden rounded-full border-4 bg-neutral-100 ${
                      profile?.avatar_url === avatar
                        ? 'border-black'
                        : 'border-transparent'
                    }`}
                    disabled={loading}
                    key={avatar}
                    onClick={() =>
                      setProfile((current) =>
                        current ? { ...current, avatar_url: avatar } : current
                      )
                    }
                    type="button"
                  >
                    <img
                      alt=""
                      className="size-full object-cover"
                      src={avatar}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field
                disabled
                label="Username"
                value={profile?.username || ''}
                onChange={() => undefined}
              />
              <Field
                disabled
                label="Role"
                value={profile?.role || ''}
                onChange={() => undefined}
              />
              <Field
                label="Full name"
                value={profile?.full_name || ''}
                onChange={(value) =>
                  setProfile((current) =>
                    current ? { ...current, full_name: value } : current
                  )
                }
              />
              <Field
                label="Email"
                type="email"
                value={profile?.email || ''}
                onChange={(value) =>
                  setProfile((current) =>
                    current ? { ...current, email: value } : current
                  )
                }
              />
              <Field
                label="NIC"
                value={profile?.nic || ''}
                onChange={(value) =>
                  setProfile((current) =>
                    current ? { ...current, nic: value } : current
                  )
                }
              />
            </div>

            <button
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
              disabled={loading || saving || !profile}
              type="submit"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save settings'}
            </button>
          </form>

          <div className="grid gap-4">
            <section className="dashboard-card bg-white/85 p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-neutral-100">
                  <Bell size={18} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                    Preferences
                  </p>
                  <h2 className="text-xl font-medium">Notifications</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <Toggle
                  checked={preferences.emailAlerts}
                  icon={Mail}
                  label="Email alerts"
                  onChange={() =>
                    setPreferences((current) => ({
                      ...current,
                      emailAlerts: !current.emailAlerts
                    }))
                  }
                />
                <Toggle
                  checked={preferences.transferAlerts}
                  icon={Check}
                  label="Transfer confirmations"
                  onChange={() =>
                    setPreferences((current) => ({
                      ...current,
                      transferAlerts: !current.transferAlerts
                    }))
                  }
                />
                <Toggle
                  checked={preferences.compactView}
                  icon={MonitorSmartphone}
                  label="Compact dashboard view"
                  onChange={() =>
                    setPreferences((current) => ({
                      ...current,
                      compactView: !current.compactView
                    }))
                  }
                />
              </div>
            </section>

            <section className="dashboard-card bg-black p-5 text-white shadow-sm sm:p-6">
              <LockKeyhole size={22} />
              <h2 className="mt-5 text-xl font-medium text-white">
                Security status
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Your profile changes use the authenticated Nova session and
                profile updates create an email notification record.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

function Field({
  disabled = false,
  label,
  onChange,
  type = 'text',
  value
}: {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  type?: string
  value: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-black/55">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-lg border border-black/10 bg-neutral-50 px-4 text-sm outline-none disabled:text-black/45"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  )
}

function Toggle({
  checked,
  icon: Icon,
  label,
  onChange
}: {
  checked: boolean
  icon: React.ComponentType<{ size?: number }>
  label: string
  onChange: () => void
}) {
  return (
    <button
      className="flex items-center justify-between gap-3 bg-neutral-100 px-4 py-3 text-left"
      onClick={onChange}
      type="button"
    >
      <span className="flex items-center gap-3 text-sm font-medium">
        <Icon size={17} />
        {label}
      </span>
      <span
        className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
          checked ? 'bg-black' : 'bg-black/20'
        }`}
      >
        <span
          className={`size-4 rounded-full bg-white transition ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}
