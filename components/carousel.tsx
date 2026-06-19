'use client'

import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  PiggyBank,
  ReceiptText,
  Settings,
  ShieldCheck,
  WalletCards
} from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

const slides = [
  {
    title: 'Move money with confidence',
    eyebrow: 'Secure transfers',
    description:
      'Send funds, save trusted payees, and keep every transfer visible from your dashboard.',
    image: '/transfer-illustration.png',
    href: '/bank-transfer',
    icon: CreditCard,
    stat: 'Encrypted',
    tone: 'from-emerald-400/35 via-cyan-300/20 to-black'
  },
  {
    title: 'See your money in full color',
    eyebrow: 'Dashboard view',
    description:
      'Bring balances, activity, and daily decisions into one clear home screen.',
    image: '/Dashboard-logo.png',
    href: '/dashboard',
    icon: WalletCards,
    stat: 'Live overview',
    tone: 'from-cyan-300/35 via-emerald-300/20 to-black'
  },
  {
    title: 'Understand spending sooner',
    eyebrow: 'Smart spend',
    description:
      'Turn account activity into simple signals, category totals, and practical budget targets.',
    image: '/loginmainbg.png',
    href: '/smart-spend',
    icon: BadgeCheck,
    stat: 'Live insight',
    tone: 'from-amber-300/35 via-emerald-300/20 to-black'
  },
  {
    title: 'Build goals one day at a time',
    eyebrow: 'Savings goals',
    description:
      'Plan targets, track progress, and keep daily savings visible beside your accounts.',
    image: '/account-logo.png',
    href: '/savings-goals',
    icon: PiggyBank,
    stat: 'Daily plan',
    tone: 'from-lime-300/35 via-cyan-300/15 to-black'
  },
  {
    title: 'Pay bills without losing context',
    eyebrow: 'Bill payments',
    description:
      'Handle recurring services and keep bill payment history connected to your cash flow.',
    image: '/billers/water-board.png',
    href: '/pay-bills',
    icon: ReceiptText,
    stat: 'Fast pay',
    tone: 'from-sky-300/35 via-emerald-300/20 to-black'
  },
  {
    title: 'Stay alert at every step',
    eyebrow: 'Notifications',
    description:
      'Track profile updates, email notices, and important account messages in one clean view.',
    image: '/notification.png',
    href: '/notifications',
    icon: Bell,
    stat: 'Always visible',
    tone: 'from-rose-300/30 via-amber-300/20 to-black'
  },
  {
    title: 'Shape the app around you',
    eyebrow: 'Settings',
    description:
      'Update profile details, visual preferences, and session controls from a focused page.',
    image: '/settings.png',
    href: '/settings',
    icon: Settings,
    stat: 'Personalized',
    tone: 'from-violet-300/30 via-emerald-300/20 to-black'
  },
  {
    title: 'Ask for help when money gets noisy',
    eyebrow: 'AI assistant',
    description:
      'Use Nova AI to explain transactions, guide common tasks, and make financial next steps clearer.',
    image: '/loginshellbg.png',
    href: '/chatbot',
    icon: Bot,
    stat: 'AI ready',
    tone: 'from-emerald-300/35 via-blue-300/20 to-black'
  }
]

export default function BankingCarousel() {
  const [active, setActive] = useState(0)
  const slide = slides[active]
  const ActiveIcon = slide.icon

  const previewSlides = useMemo(
    () =>
      slides.map((item, index) => ({
        ...item,
        active: index === active,
        index
      })),
    [active]
  )

  function move(direction: -1 | 1) {
    setActive(
      (current) => (current + direction + slides.length) % slides.length
    )
  }

  return (
    <section className="relative z-10 overflow-hidden bg-[#081711] px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
      <div className="carousel-color-field absolute inset-0" />
      <div className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex flex-col justify-between overflow-hidden border border-emerald-300/20 bg-[#0d2018]/90 p-6 shadow-[0_28px_90px_rgba(16,185,129,0.18)] backdrop-blur-xl sm:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/80">
              Colorful banking details
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-medium leading-tight text-white sm:text-4xl">
              Bigger, brighter tools with{' '}
              <span className="text-emerald-300">green signals</span> where it
              matters.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-cyan-50/65">
              Explore the Nova tools customers use most after signing in:
              payments, savings, spending visibility, notifications, settings,
              and on-demand help.
            </p>
          </div>

          <div
            className="carosel-stage mt-10"
            aria-label="Rotating Nova banking carousel"
          >
            <div
              className="carosel-slider"
              style={{ '--quantity': slides.length } as CSSProperties}
            >
              {slides.map((item, index) => (
                <button
                  aria-label={`Show ${item.eyebrow}`}
                  className="carosel-item"
                  key={item.title}
                  onClick={() => setActive(index)}
                  style={{ '--position': index + 1 } as CSSProperties}
                  type="button"
                >
                  <img alt="" src={item.image} />
                  <span>{item.eyebrow}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {previewSlides.map((item) => {
              const Icon = item.icon
              return (
                <button
                  aria-label={`Show ${item.eyebrow}`}
                  className={`min-h-24 border p-4 text-left transition ${
                    item.active
                      ? 'border-emerald-300 bg-emerald-300 text-black shadow-[0_18px_45px_rgba(52,211,153,0.25)]'
                      : 'border-white/10 bg-white/8 text-cyan-50 hover:border-emerald-300/45 hover:bg-emerald-300/10'
                  }`}
                  key={item.title}
                  onClick={() => setActive(item.index)}
                  type="button"
                >
                  <Icon size={18} />
                  <p className="mt-5 text-sm font-medium">{item.eyebrow}</p>
                </button>
              )
            })}
          </div>
        </div>

        <article className="relative min-h-[620px] overflow-hidden border border-emerald-300/20 bg-black text-white shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
          <img
            alt=""
            className="absolute inset-0 size-full object-cover opacity-55 saturate-150"
            src={slide.image}
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${slide.tone}`} />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,18,15,0.88),rgba(6,18,15,0.36)_48%,rgba(0,0,0,0.76))]" />

          <div className="relative z-10 flex min-h-[620px] flex-col justify-between p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-emerald-300 text-black shadow-[0_18px_45px_rgba(52,211,153,0.32)]">
                <ActiveIcon size={23} />
              </span>
              <div className="flex gap-2">
                <button
                  aria-label="Previous banking detail"
                  className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:border-emerald-300 hover:bg-emerald-300 hover:text-black"
                  onClick={() => move(-1)}
                  type="button"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  aria-label="Next banking detail"
                  className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:border-emerald-300 hover:bg-emerald-300 hover:text-black"
                  onClick={() => move(1)}
                  type="button"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-black">
                  {slide.stat}
                </span>
                <span className="flex items-center gap-1 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-50/80">
                  <ShieldCheck size={14} />
                  Nova protected session
                </span>
              </div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/80">
                {slide.eyebrow}
              </p>
              <h3 className="mt-3 max-w-2xl text-4xl font-medium leading-tight text-white sm:text-6xl">
                {slide.title}
              </h3>
              <p className="mt-5 max-w-xl text-sm leading-6 text-cyan-50/70 sm:text-base">
                {slide.description}
              </p>
              <Link
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-black shadow-[0_18px_45px_rgba(52,211,153,0.28)] transition-transform hover:scale-105"
                href={slide.href}
              >
                Open feature <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
