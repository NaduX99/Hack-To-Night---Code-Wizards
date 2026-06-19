'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'

type Errors = Partial<{
  fromAccount: string
  amount: string
  accountNumber: string
  accountName: string
  bank: string
  purpose: string
  form: string
}>

type BankAccount = {
  account_number: string
  account_name: string
  balance: string
}

type Beneficiary = {
  id: number
  account_number: string
  account_name: string
  bank_name: string
  nickname: string | null
}

type Transaction = {
  id: number
  from_account: string
  to_account: string
  amount: string
  purpose: string | null
  category: string | null
  status: string
  created_at: string
}

type Toast = {
  type: 'success' | 'error' | 'info'
  message: string
}

export default function Home() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState('')
  const [fromAccount, setFromAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [bank, setBank] = useState('')
  const [purpose, setPurpose] = useState('')
  const [description, setDescription] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [saveBeneficiary, setSaveBeneficiary] = useState(true)
  const [errors, setErrors] = useState<Errors>({})
  const [toast, setToast] = useState<Toast | null>(null)
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<'form' | 'confirm' | 'success' | 'failure'>(
    'form'
  )
  const [confirmation, setConfirmation] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/accounts')
      .then((response) => response.json())
      .then((payload) => {
        const loaded = payload.accounts || []
        setAccounts(loaded)
        setFromAccount(loaded[0]?.account_number || '')
        if (loaded[0]?.account_number) {
          loadTransactions(loaded[0].account_number)
        }
      })
      .catch(() => setAccounts([]))

    loadBeneficiaries()
  }, [])

  function loadBeneficiaries() {
    fetch('/api/beneficiaries')
      .then((response) => response.json())
      .then((payload) => setBeneficiaries(payload.beneficiaries || []))
      .catch(() => setBeneficiaries([]))
  }

  function loadTransactions(account: string) {
    if (!account) return
    fetch(`/api/transactions?account=${account}`)
      .then((response) => response.json())
      .then((payload) => setTransactions(payload.transactions || []))
      .catch(() => setTransactions([]))
  }

  function showToast(nextToast: Toast) {
    setToast(nextToast)
    window.setTimeout(() => {
      setToast((current) =>
        current?.message === nextToast.message ? null : current
      )
    }, 4500)
  }

  function validate() {
    const e: Errors = {}
    if (!/^\d{6,20}$/.test(fromAccount))
      e.fromAccount = 'Enter a valid source account'

    if (!amount) e.amount = 'Amount is required'
    else if (Number(amount) <= 0 || isNaN(Number(amount)))
      e.amount = 'Enter a valid positive amount'

    if (!accountNumber) e.accountNumber = 'Account number is required'
    else if (!/^\d{6,}$/.test(accountNumber))
      e.accountNumber = 'Enter a valid account number'

    if (!accountName) e.accountName = 'Account name is required'

    if (!bank) e.bank = 'Select a bank'

    if (purpose.trim().length < 3) e.purpose = 'Purpose is required'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      // show confirmation step first
      setStep('confirm')
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setBusy(true)

    const response = await fetch('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromAccount,
        toAccount: accountNumber,
        toAccountName: accountName,
        bankName: bank,
        amount,
        purpose,
        description,
        saveBeneficiary
      })
    })
    const payload = await response.json().catch(() => ({}))
    setBusy(false)

    if (!response.ok) {
      setErrors({ form: payload.message || 'Transfer failed' })
      showToast({
        type: 'error',
        message: payload.message || 'Transfer failed.'
      })
      setStep('failure')
      return
    }

    setConfirmation(String(payload.transaction?.id || ''))
    loadBeneficiaries()
    loadTransactions(fromAccount)
    showToast({
      type: 'success',
      message: `Transfer completed. Ref: ${payload.transaction?.id || 'saved'}`
    })
    setStep('success')
  }

  function selectBeneficiary(beneficiary: Beneficiary) {
    setSelectedBeneficiaryId(String(beneficiary.id))
    setAccountNumber(beneficiary.account_number)
    setAccountName(beneficiary.account_name)
    setBank(beneficiary.bank_name)
    showToast({
      type: 'info',
      message: `${beneficiary.account_name} selected as beneficiary.`
    })
  }

  async function handleSaveBeneficiary() {
    setErrors({})

    if (!/^\d{6,20}$/.test(accountNumber) || accountName.trim().length < 2) {
      setErrors({
        accountNumber: 'Enter valid beneficiary account details first',
        accountName: 'Account name is required'
      })
      showToast({
        type: 'error',
        message: 'Enter valid beneficiary details before saving.'
      })
      return
    }

    if (!bank) {
      setErrors({ bank: 'Select a bank before saving beneficiary' })
      showToast({ type: 'error', message: 'Select bank before saving.' })
      return
    }

    setBusy(true)
    const response = await fetch('/api/beneficiaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountNumber,
        accountName,
        bankName: bank,
        nickname: accountName
      })
    })
    const payload = await response.json().catch(() => ({}))
    setBusy(false)

    if (!response.ok) {
      showToast({
        type: 'error',
        message: payload.message || 'Beneficiary save failed.'
      })
      return
    }

    loadBeneficiaries()
    setSaveBeneficiary(true)
    showToast({
      type: 'success',
      message: payload.message || 'Beneficiary saved.'
    })
  }

  return (
    <div className="min-h-screen bg-bg-light font-geist p-0">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1 p-12">
          {toast && (
            <div className={`transfer-toast ${toast.type}`} role="status">
              {toast.message}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Bank Transfer</h2>
            <div className="flex items-center gap-3">
              <button className="topbar-icon" aria-label="search">
                <img src="/search.png" alt="search" />
              </button>
              <button className="topbar-icon" aria-label="notifications">
                <img src="/notification.png" alt="notifications" />
              </button>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                <img
                  src="/avatar.png"
                  alt="avatar"
                  className="w-full h-full object-cover bg-white"
                />
              </div>
            </div>
          </div>
          <section className="mb-6 grid gap-4 xl:grid-cols-[360px_1fr]">
            <div className="rounded-lg bg-white p-5 shadow">
              <h3 className="text-lg font-bold text-black">
                Saved Beneficiaries
              </h3>
              <div className="mt-4 max-h-56 space-y-2 overflow-auto">
                {beneficiaries.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No saved beneficiaries yet.
                  </p>
                )}
                {beneficiaries.map((beneficiary) => (
                  <button
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-sm text-black hover:border-[#450043]"
                    key={beneficiary.id}
                    onClick={() => selectBeneficiary(beneficiary)}
                    type="button"
                  >
                    <strong>
                      {beneficiary.nickname || beneficiary.account_name}
                    </strong>
                    <span className="block text-gray-500">
                      {beneficiary.account_number} - {beneficiary.bank_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-black">
                  Past Transactions
                </h3>
                <select
                  className="rounded border border-gray-200 px-3 py-2 text-sm text-black"
                  value={fromAccount}
                  onChange={(event) => {
                    setFromAccount(event.target.value)
                    loadTransactions(event.target.value)
                  }}
                >
                  {accounts.map((account) => (
                    <option
                      key={account.account_number}
                      value={account.account_number}
                    >
                      {account.account_number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 max-h-56 overflow-auto">
                {transactions.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No transaction history for this account.
                  </p>
                )}
                {transactions.slice(0, 8).map((transaction) => (
                  <div
                    className="grid gap-2 border-b border-gray-100 py-3 text-sm text-black md:grid-cols-[1fr_110px_110px]"
                    key={transaction.id}
                  >
                    <div>
                      <strong>
                        {transaction.purpose ||
                          transaction.category ||
                          'Transaction'}
                      </strong>
                      <p className="text-gray-500">
                        {transaction.from_account} to {transaction.to_account}
                      </p>
                    </div>
                    <span>{formatMoney(Number(transaction.amount))}</span>
                    <span className="text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {step === 'form' ? (
            <form onSubmit={handleNext} className="transfer-card p-8">
              <div className="grid grid-cols-12 gap-y-6 gap-x-8 items-center">
                <label className="col-span-3 text-gray-700">
                  From Account :
                </label>
                <div className="col-span-9">
                  <select
                    aria-label="from account"
                    value={fromAccount}
                    onChange={(e) => {
                      setFromAccount(e.target.value)
                      loadTransactions(e.target.value)
                    }}
                    className="underline-input bg-transparent"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option
                        key={account.account_number}
                        value={account.account_number}
                      >
                        {account.account_name} - {account.account_number} - Rs.
                        {Number(account.balance).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {errors.fromAccount && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.fromAccount}
                    </div>
                  )}
                </div>

                <label className="col-span-3 text-gray-700">Amount :</label>
                <div className="col-span-9">
                  <input
                    aria-label="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="underline-input"
                    placeholder=""
                  />
                  {errors.amount && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.amount}
                    </div>
                  )}
                </div>

                <label className="col-span-3 text-gray-700">
                  Account Number :
                </label>
                <div className="col-span-9">
                  {beneficiaries.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2 text-sm font-semibold text-gray-700">
                        Saved beneficiaries
                      </p>
                      <select
                        aria-label="saved beneficiary"
                        className="underline-input bg-transparent mb-3"
                        value={selectedBeneficiaryId}
                        onChange={(event) => {
                          const selected = beneficiaries.find(
                            (beneficiary) =>
                              String(beneficiary.id) === event.target.value
                          )
                          if (selected) selectBeneficiary(selected)
                        }}
                      >
                        <option value="">Select saved beneficiary</option>
                        {beneficiaries.map((beneficiary) => (
                          <option key={beneficiary.id} value={beneficiary.id}>
                            {beneficiary.nickname || beneficiary.account_name} -{' '}
                            {beneficiary.account_number} -{' '}
                            {beneficiary.bank_name}
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        {beneficiaries.slice(0, 6).map((beneficiary) => (
                          <button
                            className="rounded-full border border-[#9a5c97] bg-white px-4 py-2 text-sm font-semibold text-[#450043]"
                            key={beneficiary.id}
                            onClick={() => selectBeneficiary(beneficiary)}
                            type="button"
                          >
                            {beneficiary.nickname || beneficiary.account_name} -{' '}
                            {beneficiary.account_number}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="underline-input"
                  />
                  {errors.accountNumber && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.accountNumber}
                    </div>
                  )}
                </div>

                <label className="col-span-3 text-gray-700">
                  Account Name :
                </label>
                <div className="col-span-9">
                  <input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="underline-input"
                  />
                  {errors.accountName && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.accountName}
                    </div>
                  )}
                </div>

                <label className="col-span-3 text-gray-700">
                  Select Bank :
                </label>
                <div className="col-span-9">
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="underline-input bg-transparent"
                  >
                    <option value="">Choose bank</option>
                    <option>Nova Bank</option>
                    <option>First National</option>
                    <option>Global Trust</option>
                    <option>Union Bank</option>
                  </select>
                  {errors.bank && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.bank}
                    </div>
                  )}
                </div>

                <label className="col-span-3 text-gray-700">Purpose :</label>
                <div className="col-span-9">
                  <input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="underline-input"
                    placeholder="Family support, rent, invoice payment"
                  />
                  {errors.purpose && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.purpose}
                    </div>
                  )}
                </div>

                <label className="col-span-3 text-gray-700">Notes :</label>
                <div className="col-span-9">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="description-box"
                  />
                </div>

                <div className="col-span-3" />
                <div className="col-span-9 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <input
                      checked={saveBeneficiary}
                      onChange={(event) =>
                        setSaveBeneficiary(event.target.checked)
                      }
                      type="checkbox"
                    />
                    Save beneficiary after successful transfer
                  </label>
                  <button
                    className="rounded-full border border-[#450043] px-5 py-2 text-sm font-bold text-[#450043] disabled:opacity-60"
                    disabled={busy}
                    onClick={handleSaveBeneficiary}
                    type="button"
                  >
                    SAVE BENEFICIARY NOW
                  </button>
                </div>
              </div>

              <div className="flex justify-center mt-10">
                <button disabled={busy} type="submit" className="next-btn">
                  NEXT
                </button>
              </div>
            </form>
          ) : step === 'confirm' ? (
            <div className="transfer-card p-8">
              <h3 className="text-center text-2xl font-semibold mb-6">
                Confirm Transfer
              </h3>
              <div className="bg-white rounded-lg p-6 shadow-lg max-w-xl mx-auto text-center">
                <p className="mb-4">
                  Confirm your transfer of <strong>Rs. {amount || '0'}</strong>{' '}
                  to <strong>{accountName || 'recipient'}</strong>
                </p>
                <p className="mb-4 text-sm text-gray-600">
                  Purpose: <strong>{purpose}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  Additional fee of Rs.50 will be charged.
                </p>
                <div className="mb-6">
                  <img
                    src="/transfer-illustration.png"
                    alt="illustration"
                    className="mx-auto"
                  />
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setStep('form')}
                    className="next-btn"
                    aria-label="back"
                  >
                    BACK
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={busy}
                    className="next-btn transfer-btn"
                  >
                    {busy ? 'PROCESSING' : 'TRANSFER'}
                  </button>
                </div>
              </div>
            </div>
          ) : step === 'success' ? (
            // success page
            <div className="transfer-card p-8">
              <div className="relative">
                <div className="success-check inside-check">
                  <svg
                    viewBox="0 0 120 120"
                    width="100"
                    height="100"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <radialGradient id="g" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#28a745" />
                        <stop offset="100%" stopColor="#138a3e" />
                      </radialGradient>
                    </defs>
                    <circle cx="60" cy="60" r="50" fill="#dff7e7" />
                    <circle cx="60" cy="60" r="40" fill="#10a654" />
                    <path
                      d="M38 62 L54 78 L82 42"
                      stroke="#fff"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>

                <h3 className="text-center text-2xl font-semibold mb-4">
                  Transfer Successful!
                </h3>
                <p className="text-center text-sm text-gray-500 mb-10">
                  Confirmation number : {confirmation}
                </p>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      // go back to home (reset form)
                      setAmount('')
                      setFromAccount(accounts[0]?.account_number || '')
                      setAccountNumber('')
                      setAccountName('')
                      setBank('')
                      setPurpose('')
                      setDescription('')
                      setSelectedBeneficiaryId('')
                      setErrors({})
                      setConfirmation(null)
                      setStep('form')
                    }}
                    className="transfer-btn success-btn"
                  >
                    <span className="mr-3">&lt;</span> BACK TO HOME
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // failure page
            <div className="transfer-card p-8">
              <div className="relative">
                <div className="success-check inside-check">
                  <svg
                    viewBox="0 0 120 120"
                    width="220"
                    height="220"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="60" cy="60" r="50" fill="#ffdede" />
                    <circle cx="60" cy="60" r="40" fill="#ffb6b6" />
                    <path
                      d="M60 30 L93 86 L27 86 Z"
                      fill="#ff4d4f"
                      stroke="#fff"
                      strokeWidth="4"
                      strokeLinejoin="round"
                    />
                    <text
                      x="60"
                      y="78"
                      textAnchor="middle"
                      fontSize="36"
                      fill="#fff"
                      fontWeight="700"
                    >
                      !
                    </text>
                  </svg>
                </div>

                <h3 className="text-center text-2xl font-semibold mb-4">
                  Transaction Failed!
                </h3>
                <p className="text-center text-sm text-gray-500 mb-6">
                  {errors.form || 'Transfer could not be completed'}
                  <br />
                  Please check the transfer details and try again.
                </p>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setAmount('')
                      setFromAccount(accounts[0]?.account_number || '')
                      setAccountNumber('')
                      setAccountName('')
                      setBank('')
                      setPurpose('')
                      setDescription('')
                      setSelectedBeneficiaryId('')
                      setErrors({})
                      setConfirmation(null)
                      setStep('form')
                    }}
                    className="transfer-btn success-btn"
                  >
                    <span className="mr-3">&lt;</span> BACK TO HOME
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <style jsx>{`
        .transfer-toast {
          position: fixed;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 40;
          max-width: min(380px, calc(100vw - 2rem));
          border-radius: 14px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
          color: white;
          font-weight: 800;
          line-height: 1.35;
          padding: 1rem 1.25rem;
        }
        .transfer-toast.success {
          background: #15803d;
        }
        .transfer-toast.error {
          background: #b91c1c;
        }
        .transfer-toast.info {
          background: #450043;
        }
      `}</style>
    </div>
  )
}

function formatMoney(value: number) {
  return `Rs. ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}
