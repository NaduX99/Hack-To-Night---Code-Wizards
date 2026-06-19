'use client'

import { CreditCard, ShieldCheck, Wifi } from 'lucide-react'

type AccountCardPreviewProps = {
  accountName?: string
  accountNumber?: string
  branch?: string
  label?: string
}

function maskAccountNumber(value?: string) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 20)

  if (!digits) return '**** **** ****'

  return digits
    .padEnd(12, '*')
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

export default function AccountCardPreview({
  accountName,
  accountNumber,
  branch,
  label = 'Nova Savings'
}: AccountCardPreviewProps) {
  const holder = accountName?.trim() || 'Account Holder'
  const displayBranch = branch?.trim() || 'Main Branch'

  return (
    <section
      aria-label="Account card preview"
      className="relative w-full max-w-[390px] overflow-hidden rounded-[26px] border border-emerald-300/25 bg-[#06130f] p-5 text-white shadow-[0_28px_70px_rgba(0,0,0,0.28)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(52,211,153,0.28),transparent_36%),linear-gradient(245deg,rgba(34,211,238,0.18),transparent_48%),linear-gradient(20deg,transparent_55%,rgba(251,191,36,0.16))]" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full border border-cyan-200/20" />
      <div className="pointer-events-none absolute -bottom-28 left-10 h-56 w-56 rounded-full border border-emerald-200/15" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-100/65">
            {label}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">Nova Bank</h2>
        </div>
        <span className="flex size-11 items-center justify-center rounded-full bg-emerald-300 text-[#04130f] shadow-lg shadow-emerald-950/30">
          <CreditCard size={20} />
        </span>
      </div>

      <div className="relative z-10 mt-10">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-9 w-12 rounded-lg bg-[linear-gradient(135deg,#fde68a,#f59e0b)] shadow-inner" />
          <Wifi className="text-cyan-100/75" size={22} />
        </div>

        <p className="font-mono text-[22px] font-semibold tracking-[0.14em] text-white drop-shadow-sm">
          {maskAccountNumber(accountNumber)}
        </p>

        <div className="mt-8 grid grid-cols-[1fr_auto] gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-50/50">
              Account name
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {holder}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-50/50">
              Branch
            </p>
            <p className="mt-1 max-w-28 truncate text-sm font-semibold text-white">
              {displayBranch}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-100">
        <ShieldCheck size={15} />
        Secure account preview
      </div>
    </section>
  )
}
