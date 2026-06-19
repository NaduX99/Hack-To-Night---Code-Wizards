'use client'

import {
  Bell,
  Bot,
  CircleHelp,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  Settings,
  Sparkles,
  UserRound,
  WalletCards,
  X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const menuItems = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Accounts', path: '/bank-accounts', icon: WalletCards },
  { label: 'Transfer', path: '/bank-transfer', icon: CreditCard },
  { label: 'Pay bills', path: '/pay-bills', icon: ReceiptText },
  { label: 'Smart spend', path: '/smart-spend', icon: Sparkles },
  { label: 'Savings goals', path: '/savings-goals', icon: PiggyBank },
  { label: 'AI assistant', path: '/chatbot', icon: Bot },
  { label: 'E-statement', path: '/e-statement', icon: FileText },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Profile', path: '/profile', icon: UserRound },
  { label: 'Settings', path: '/settings', icon: Settings }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <button
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-50 flex size-11 items-center justify-center rounded-full bg-black text-white shadow-lg lg:hidden"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Menu size={20} />
      </button>

      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`sidebar fixed inset-y-0 left-0 z-50 flex w-[270px] shrink-0 flex-col bg-black/90 px-4 py-5 text-white shadow-2xl backdrop-blur-3xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-2">
          <Link className="flex items-center gap-3" href="/dashboard">
            <img
              alt="Nova Bank"
              className="size-11 rounded-full bg-white object-cover"
              src="/loginlogo.png"
            />
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">
                Personal banking
              </p>
              <p className="text-base font-semibold">Nova Bank</p>
            </div>
          </Link>
          <button
            aria-label="Close navigation"
            className="flex size-9 items-center justify-center rounded-full bg-white/10 lg:hidden"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = pathname === item.path
            const Icon = item.icon
            return (
              <Link
                className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-all duration-200 ${active ? 'bg-white text-black shadow-lg' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
                href={item.path}
                key={item.path}
                onClick={() => setOpen(false)}
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-full ${active ? 'bg-black text-white' : 'bg-white/10'}`}
                >
                  <Icon size={16} />
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-4 bg-white/5 p-3">
          <div className="mb-3 flex items-center gap-3 text-xs text-white/55">
            <Settings size={16} />
            <span>Secure session active</span>
            <CircleHelp className="ml-auto" size={16} />
          </div>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
