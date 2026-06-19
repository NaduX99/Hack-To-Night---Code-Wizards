'use client'

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.ok) {
          setMessage(payload.message || 'Unable to load profile.')
          return
        }
        setProfile(payload.profile)
      })
      .catch(() => setMessage('Unable to load profile.'))
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!profile) return

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
      payload.message || (response.ok ? 'Profile updated.' : 'Update failed.')
    )
  }

  return (
    <main className="flex min-h-screen bg-[#f3f4f6] text-black">
      <Sidebar />
      <section className="flex-1 p-10">
        <h1 className="text-3xl font-bold">Profile</h1>
        {message && <p className="mt-4 text-sm font-semibold">{message}</p>}

        <form
          onSubmit={handleSubmit}
          className="mt-8 max-w-2xl rounded-lg bg-white p-6 shadow"
        >
          <div className="mb-6">
            <span className="text-sm font-semibold text-gray-600">
              Select Avatar
            </span>
            <div className="mt-3 flex flex-wrap gap-3">
              {avatarOptions.map((avatar) => (
                <button
                  className={`size-20 overflow-hidden rounded-full border-4 bg-gray-50 ${
                    profile?.avatar_url === avatar
                      ? 'border-[#450043]'
                      : 'border-transparent'
                  }`}
                  key={avatar}
                  onClick={() =>
                    setProfile((current) =>
                      current ? { ...current, avatar_url: avatar } : current
                    )
                  }
                  type="button"
                >
                  <img
                    alt="Avatar option"
                    className="size-full object-cover"
                    src={avatar}
                  />
                </button>
              ))}
            </div>
          </div>
          <Field
            label="Username"
            value={profile?.username || ''}
            disabled
            onChange={() => undefined}
          />
          <Field
            label="Full Name"
            value={profile?.full_name || ''}
            onChange={(value) =>
              setProfile((current) =>
                current ? { ...current, full_name: value } : current
              )
            }
          />
          <Field
            label="Email"
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
          <button className="mt-5 rounded-full bg-[#450043] px-7 py-3 font-bold text-white">
            Update Profile
          </button>
        </form>
      </section>
    </main>
  )
}

function Field({
  label,
  value,
  disabled = false,
  onChange
}: {
  label: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-semibold text-gray-600">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-black"
      />
    </label>
  )
}
