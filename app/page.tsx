import {
  ArrowRight,
  Download,
  Menu,
  ShieldCheck,
  Sparkles,
  WalletCards
} from 'lucide-react'
import Link from 'next/link'
import BankingCarousel from '@/components/carousel'

const videoUrl =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4'

export default function Home() {
  return (
    <main className="nova-landing colorful-landing relative min-h-screen overflow-hidden bg-[#06130f] text-white">
      <video
        aria-hidden="true"
        autoPlay
        className="absolute inset-0 z-0 size-full object-cover opacity-70 saturate-150"
        loop
        muted
        playsInline
        src={videoUrl}
      />
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(115deg,rgba(5,18,14,0.92),rgba(6,24,38,0.74)_48%,rgba(8,13,18,0.82))]" />
      <div className="landing-color-wash absolute inset-0 z-[2]" />
      <div className="relative z-10 min-h-screen p-4 lg:p-6">
        <section className="modern-hero relative flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[2rem] border border-emerald-300/20 p-5 shadow-[0_35px_110px_rgba(5,150,105,0.18)] lg:min-h-[calc(100vh-3rem)] lg:p-8">
          <div className="hero-gridline absolute inset-0" />
          <div className="hero-scan absolute inset-x-0 top-0 h-px" />

          <nav className="landing-enter relative z-10 flex items-center justify-between">
            <Link className="flex items-center gap-3" href="/">
              <img
                alt="Nova Bank"
                className="size-10 rounded-full bg-white object-cover ring-2 ring-emerald-300/70"
                src="/loginlogo.png"
              />
              <span className="text-xl font-semibold tracking-normal">
                Nova<span className="text-emerald-300">.</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/80 transition hover:border-emerald-300/40 hover:text-emerald-100 sm:inline-flex"
                href="/login"
              >
                My account
              </Link>
              <button
                aria-label="Open navigation menu"
                className="liquid-glass flex items-center gap-2 rounded-full border border-emerald-300/25 px-4 py-2 text-sm text-emerald-100 transition-transform hover:scale-105 hover:bg-emerald-300/10 active:scale-95"
                type="button"
              >
                <Menu size={17} />
                Menu
              </button>
            </div>
          </nav>

          <div className="relative z-10 grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_0.9fr] lg:py-8">
            <section className="max-w-3xl text-left">
              <div className="landing-enter inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.22em] text-emerald-100">
                <Sparkles size={14} />
                Nova signal banking
              </div>
              <h1 className="landing-enter mt-7 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-8xl">
                Money that feels
                <span className="hero-gradient-text block">alive, clear,</span>
                and under control.
              </h1>
              <p className="landing-enter mt-6 max-w-2xl text-base leading-7 text-cyan-50/70 sm:text-lg">
                A modern banking workspace for secure transfers, spending
                signals, savings goals, and AI guidance that keeps your next
                move obvious.
              </p>

              <div className="landing-enter mt-8 flex flex-wrap items-center gap-3">
                <Link
                  className="landing-pop inline-flex items-center gap-3 rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-black shadow-[0_18px_45px_rgba(52,211,153,0.32)] transition-transform hover:scale-105 active:scale-95"
                  href="/login"
                >
                  Login
                  <span className="flex size-7 items-center justify-center rounded-full bg-black/15">
                    <Download size={15} />
                  </span>
                </Link>
                <Link
                  className="landing-pop inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition-transform hover:scale-105 hover:bg-cyan-300/15 active:scale-95"
                  href="/sign-up"
                >
                  Open an account
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="landing-enter mt-9 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  ['Rs. 142K', 'tracked balance'],
                  ['24/7', 'AI guidance'],
                  ['3 sec', 'quick actions']
                ].map(([value, label]) => (
                  <div
                    className="border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md"
                    key={label}
                  >
                    <p className="text-lg font-semibold text-emerald-200">
                      {value}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-cyan-50/45">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="hero-visual landing-rise relative min-h-[520px] lg:min-h-[620px]">
              <div className="hero-orbit absolute inset-4" />
              <div className="hero-ledger absolute left-0 top-14 w-[82%] border border-emerald-300/20 bg-[#0d211a]/85 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:w-[72%]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                      Live balance
                    </p>
                    <p className="mt-3 text-4xl font-semibold text-white">
                      Rs. 142,000
                    </p>
                  </div>
                  <span className="flex size-11 items-center justify-center rounded-full bg-emerald-300 text-black">
                    <WalletCards size={20} />
                  </span>
                </div>
                <div className="mt-8 grid gap-3">
                  {[
                    ['Smart spend', '+18% clarity', 'bg-emerald-300'],
                    ['Bill paid', 'Water Board', 'bg-cyan-300'],
                    ['Goal saved', 'Daily reserve', 'bg-amber-300']
                  ].map(([label, meta, color]) => (
                    <div
                      className="flex items-center justify-between border border-white/10 bg-white/5 px-3 py-3"
                      key={label}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`size-2.5 rounded-full ${color}`} />
                        <span className="text-sm font-medium text-white">
                          {label}
                        </span>
                      </div>
                      <span className="text-xs text-cyan-50/50">{meta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hero-card-float absolute right-0 top-0 w-[52%] border border-cyan-200/20 bg-cyan-100/10 p-4 backdrop-blur-xl sm:w-[46%]">
                <img
                  alt="Nova Bank app preview"
                  className="h-36 w-full object-cover saturate-150"
                  src="/loginmainbg.png"
                />
                <p className="mt-4 text-sm font-medium text-white">
                  Spending pulse
                </p>
                <div className="mt-3 flex h-16 items-end gap-2">
                  {[45, 72, 38, 88, 61, 96].map((height) => (
                    <span
                      className="flex-1 bg-emerald-300/80"
                      key={height}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="hero-metric-pulse absolute bottom-10 right-8 w-64 border border-amber-200/25 bg-amber-200/10 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-amber-300 text-black">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Protected transfer
                    </p>
                    <p className="text-xs text-cyan-50/50">Verified now</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="relative z-10 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
            {['Secure Transfers', 'Smart Spend', 'Savings Goals'].map(
              (label) => (
                <Link
                  className="group flex items-center justify-between border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-cyan-50 transition hover:border-emerald-300/40 hover:bg-emerald-300/10"
                  href={
                    label === 'Secure Transfers'
                      ? '/bank-transfer'
                      : label === 'Smart Spend'
                        ? '/smart-spend'
                        : '/savings-goals'
                  }
                  key={label}
                >
                  {label}
                  <ArrowRight
                    className="transition-transform group-hover:translate-x-1"
                    size={15}
                  />
                </Link>
              )
            )}
          </div>
        </section>
      </div>
      <section className="relative z-10 bg-[#071811] px-6 py-10 text-white lg:hidden">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/70">
          Everything in one place
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {['Secure transfers', 'AI spending insight', 'Goal-based saving'].map(
            (item) => (
              <div className="liquid-glass rounded-2xl p-4" key={item}>
                <p className="text-sm text-white/80">{item}</p>
              </div>
            )
          )}
        </div>
      </section>
      <BankingCarousel />
      <footer className="relative z-10 bg-[#06130f] px-6 py-12 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 border-t border-white/10 pt-10 md:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
          <div>
            <Link className="flex items-center gap-3" href="/">
              <img
                alt="Nova Bank"
                className="size-11 rounded-full bg-white object-cover ring-2 ring-emerald-300/60"
                src="/loginlogo.png"
              />
              <span className="text-xl font-semibold">
                Nova <span className="text-emerald-300">Bank</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">
              Digital banking for transfers, spending insight, bill payments,
              savings goals, and everyday financial clarity.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.22em] text-white/35">
              Secure personal banking
            </p>
          </div>

          <FooterGroup
            links={[
              ['Dashboard', '/dashboard'],
              ['Bank transfer', '/bank-transfer'],
              ['Pay bills', '/pay-bills'],
              ['Smart spend', '/smart-spend']
            ]}
            title="Product"
          />
          <FooterGroup
            links={[
              ['Login', '/login'],
              ['Open account', '/sign-up'],
              ['Profile', '/profile'],
              ['Settings', '/settings']
            ]}
            title="Account"
          />
          <FooterGroup
            links={[
              ['AI assistant', '/chatbot'],
              ['Notifications', '/notifications'],
              ['E-statement', '/e-statement'],
              ['Savings goals', '/savings-goals']
            ]}
            title="Support"
          />
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40">
          <span>Copyright 2026 Nova Bank. Built for Hack-To-Night.</span>
          <span>Protected sessions - Encrypted banking APIs</span>
        </div>
      </footer>
    </main>
  )
}

function FooterGroup({
  links,
  title
}: {
  links: Array<[string, string]>
  title: string
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <nav className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <Link
            className="text-sm text-cyan-50/55 transition-colors hover:text-emerald-200"
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
