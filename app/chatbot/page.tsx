'use client'

import { useState } from 'react'
import Sidebar from '@/components/sidebar'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi, I can help with budgets, savings goals, transaction history, and where to find banking actions.'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault()
    const nextInput = input.trim()
    if (!nextInput) return

    setMessages((current) => [...current, { role: 'user', content: nextInput }])
    setInput('')
    setLoading(true)

    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: nextInput })
    })
    const payload = await response.json().catch(() => ({}))

    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        content:
          payload.answer ||
          payload.message ||
          'Chatbot is unavailable. Check GROQ_API_KEY.'
      }
    ])
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen bg-[#f3f4f6] text-black">
      <Sidebar />
      <section className="flex flex-1 flex-col p-10">
        <h1 className="text-3xl font-bold">Nova AI Assistant</h1>
        <div className="mt-6 flex min-h-[560px] flex-1 flex-col rounded-lg bg-white p-6 shadow">
          <div className="flex-1 space-y-4 overflow-auto">
            {messages.map((message, index) => (
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'ml-auto bg-[#450043] text-white'
                    : 'bg-gray-100 text-black'
                }`}
                key={`${message.role}-${index}`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                </p>
              </div>
            ))}
          </div>

          <form className="mt-5 flex gap-3" onSubmit={sendMessage}>
            <input
              className="min-w-0 flex-1 rounded-full border border-gray-200 px-5 py-3 outline-none focus:border-[#450043]"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about spending, savings, goals, or transactions"
              value={input}
            />
            <button
              className="rounded-full bg-[#450043] px-7 py-3 font-bold text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Thinking' : 'Send'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
