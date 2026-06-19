'use client'

import { signInWithPopup } from 'firebase/auth'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  getFirebaseAuth,
  getGoogleProvider,
  isFirebaseClientConfigured
} from '@/lib/firebase-client'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(payload.message || 'Login failed.')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setMessage('')
    if (!isFirebaseClientConfigured()) {
      setMessage('Google sign-in is not configured yet.')
      return
    }

    setGoogleLoading(true)
    try {
      const result = await signInWithPopup(
        getFirebaseAuth(),
        getGoogleProvider()
      )
      const idToken = await result.user.getIdToken()
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(payload.message || 'Google login failed.')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Google login failed.'
      )
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <section className="auth-enter grid min-h-[calc(100dvh-2.5rem)] overflow-hidden rounded-3xl lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="liquid-glass-strong relative hidden flex-col justify-between p-10 text-white lg:flex">
        <Link className="flex items-center gap-3" href="/">
          <img
            alt="Nova Bank"
            className="size-11 rounded-full bg-white object-cover"
            src="/loginlogo.png"
          />
          <span className="text-xl font-semibold">Nova Bank</span>
        </Link>

        <div className="max-w-xl">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/10">
            <Sparkles size={21} />
          </span>
          <h1 className="mt-7 text-5xl font-medium leading-[1.05] text-white">
            Your money,
            <br />
            <em className="font-[Source_Serif_4] text-white/75">
              thoughtfully managed.
            </em>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
            A secure place to transfer, save, pay bills, understand spending,
            and plan what comes next.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-white/55">
          <ShieldCheck size={17} />
          Encrypted sessions · Protected banking APIs
        </div>
      </aside>

      <div className="liquid-glass-strong flex items-center justify-center bg-black/35 px-5 py-10 text-white sm:px-10 lg:rounded-l-none">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between">
            <Link
              aria-label="Back to home"
              className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-transform hover:scale-105"
              href="/"
            >
              <ArrowLeft size={18} />
            </Link>
            <Link
              className="text-sm text-white/65 transition-colors hover:text-white"
              href="/sign-up"
            >
              Open an account
            </Link>
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-white/45">
            Welcome back
          </p>
          <h2 className="mt-2 text-4xl font-medium text-white">Sign in</h2>
          <p className="mt-3 text-sm text-white/55">
            Access your Nova Bank personal dashboard.
          </p>

          <form className="mt-9 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs text-white/55">
                Username or account name
              </span>
              <span className="flex h-14 items-center gap-3 rounded-xl bg-white/10 px-4 shadow-inner transition focus-within:bg-white/15">
                <Mail className="text-white/45" size={18} />
                <input
                  autoComplete="username"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  required
                  value={username}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs text-white/55">Password</span>
              <span className="flex h-14 items-center gap-3 rounded-xl bg-white/10 px-4 shadow-inner transition focus-within:bg-white/15">
                <LockKeyhole className="text-white/45" size={18} />
                <input
                  autoComplete="current-password"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-white/45 hover:text-white"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <div className="text-right">
              <Link
                className="text-xs text-white/60 hover:text-white"
                href="/reset-password"
              >
                Forgot password?
              </Link>
            </div>

            {message && (
              <p className="rounded-lg bg-white/10 px-4 py-3 text-sm text-white">
                {message}
              </p>
            )}

            <button
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Signing in...' : 'Sign in securely'}
              {!loading && <ArrowRight size={17} />}
            </button>

            <button
              className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white/10 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-60"
              disabled={googleLoading}
              onClick={handleGoogleLogin}
              type="button"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                G
              </span>
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
