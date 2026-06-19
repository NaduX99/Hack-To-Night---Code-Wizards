'use client'

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CreditCard,
  Eye,
  EyeOff,
  IdCard,
  LockKeyhole,
  Mail,
  UserRound
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const fields = [
  {
    name: 'accountNumber',
    label: 'Account number',
    type: 'text',
    placeholder: '6 to 20 digits',
    icon: CreditCard,
    autoComplete: 'off'
  },
  {
    name: 'accountName',
    label: 'Full name',
    type: 'text',
    placeholder: 'Name shown on your account',
    icon: UserRound,
    autoComplete: 'name'
  },
  {
    name: 'branch',
    label: 'Branch',
    type: 'text',
    placeholder: 'Your preferred branch',
    icon: Building2,
    autoComplete: 'organization'
  },
  {
    name: 'nic',
    label: 'NIC number',
    type: 'text',
    placeholder: '12 digits or 9 digits + V/X',
    icon: IdCard,
    autoComplete: 'off'
  },
  {
    name: 'email',
    label: 'Email address',
    type: 'email',
    placeholder: 'you@example.com',
    icon: Mail,
    autoComplete: 'email'
  }
] as const

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
    branch: '',
    nic: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(payload.message || 'Account creation failed.')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-enter grid min-h-[calc(100dvh-2.5rem)] overflow-hidden rounded-[2rem] border border-emerald-300/20 shadow-[0_35px_110px_rgba(5,150,105,0.18)] lg:grid-cols-[0.72fr_1.28fr]">
      <aside className="liquid-glass-strong relative hidden flex-col justify-between overflow-hidden p-9 text-white lg:flex">
        <div className="hero-gridline absolute inset-0 opacity-70" />
        <div className="hero-scan absolute inset-x-0 top-0 h-px" />
        <Link className="flex items-center gap-3" href="/">
          <img
            alt="Nova Bank"
            className="size-11 rounded-full bg-white object-cover ring-2 ring-emerald-300/70"
            src="/loginlogo.png"
          />
          <span className="text-xl font-semibold">
            Nova <span className="text-emerald-300">Bank</span>
          </span>
        </Link>
        <div>
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-300 text-black shadow-[0_18px_45px_rgba(52,211,153,0.32)]">
            <BadgeCheck size={28} />
          </span>
          <h1 className="mt-6 text-4xl font-medium leading-tight text-white">
            One account.
            <br />
            <em className="font-[Source_Serif_4] text-emerald-200">
              A clearer future.
            </em>
          </h1>
          <p className="mt-5 text-sm leading-7 text-cyan-50/65">
            Create your secure profile and receive your first test account with
            Rs. 100,000 for exploring Nova Bank.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-xs leading-6 text-emerald-100/75">
          By continuing, you confirm that the information supplied is accurate.
        </div>
      </aside>

      <div className="liquid-glass-strong border-l border-emerald-300/15 bg-[#071811]/70 px-5 py-8 text-white sm:px-10 lg:rounded-l-none lg:px-12">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <Link
              aria-label="Back to home"
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-100 transition-transform hover:scale-105 hover:border-emerald-300/40 hover:bg-emerald-300/10"
              href="/"
            >
              <ArrowLeft size={18} />
            </Link>
            <Link
              className="text-sm text-cyan-50/65 hover:text-emerald-200"
              href="/login"
            >
              Already registered? Sign in
            </Link>
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.25em] text-emerald-200/70">
            Personal banking
          </p>
          <h2 className="mt-2 text-4xl font-medium text-white">
            Open an account
          </h2>

          <form
            className="mt-7 grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit}
          >
            {fields.map((field) => {
              const Icon = field.icon
              return (
                <label
                  className={field.name === 'email' ? 'sm:col-span-2' : ''}
                  key={field.name}
                >
                  <span className="mb-2 block text-xs text-emerald-100/70">
                    {field.label}
                  </span>
                  <span className="flex h-13 items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-4 shadow-inner transition focus-within:border-emerald-300/45 focus-within:bg-emerald-300/10">
                    <Icon className="text-emerald-200/55" size={17} />
                    <input
                      autoComplete={field.autoComplete}
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          [field.name]: event.target.value
                        }))
                      }
                      placeholder={field.placeholder}
                      required
                      type={field.type}
                      value={formData[field.name]}
                    />
                  </span>
                </label>
              )
            })}

            {(['password', 'confirmPassword'] as const).map((name) => (
              <label key={name}>
                <span className="mb-2 block text-xs text-emerald-100/70">
                  {name === 'password' ? 'Password' : 'Confirm password'}
                </span>
                <span className="flex h-13 items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-4 shadow-inner transition focus-within:border-emerald-300/45 focus-within:bg-emerald-300/10">
                  <LockKeyhole className="text-emerald-200/55" size={17} />
                  <input
                    autoComplete={
                      name === 'password' ? 'new-password' : 'new-password'
                    }
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    minLength={6}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        [name]: event.target.value
                      }))
                    }
                    placeholder="Minimum 6 characters"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={formData[name]}
                  />
                  {name === 'password' && (
                    <button
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      className="text-emerald-200/55 hover:text-emerald-200"
                      onClick={() => setShowPassword((current) => !current)}
                      type="button"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  )}
                </span>
              </label>
            ))}

            {message && (
              <p className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-50 sm:col-span-2">
                {message}
              </p>
            )}

            <button
              className="mt-2 flex h-14 items-center justify-center gap-2 rounded-full bg-emerald-300 font-semibold text-black shadow-[0_18px_45px_rgba(52,211,153,0.28)] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 sm:col-span-2"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Creating your account...' : 'Create secure account'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
