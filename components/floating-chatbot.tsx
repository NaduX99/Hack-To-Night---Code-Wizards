'use client'

import Link from 'next/link'
import { useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi, how can I help with your banking today?'
    }
  ])

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault()
    const message = input.trim()
    if (!message || loading) return

    setMessages((current) => [...current, { role: 'user', content: message }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      const payload = await response.json().catch(() => ({}))
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            payload.answer ||
            payload.message ||
            'The assistant is unavailable right now.'
        }
      ])
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Unable to connect to the assistant.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="floating-assistant-root fixed bottom-5 right-5 z-50">
      {open && (
        <section className="mb-3 flex h-[520px] max-h-[70vh] w-[370px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-[#450043] px-4 py-3 text-white">
            <div>
              <h2 className="font-bold">Nova AI Assistant</h2>
              <p className="text-xs text-white/75">Powered by Groq</p>
            </div>
            <button
              aria-label="Close assistant"
              className="size-9 rounded-full text-xl hover:bg-white/10"
              onClick={() => setOpen(false)}
              type="button"
            >
              x
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f5f5f5] p-4">
            {messages.map((message, index) => (
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-5 ${
                  message.role === 'user'
                    ? 'ml-auto bg-[#450043] text-white'
                    : 'bg-white text-black shadow-sm'
                }`}
                key={`${message.role}-${index}`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="w-fit rounded-lg bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
                Thinking...
              </div>
            )}
          </div>

          <form
            className="border-t border-gray-200 bg-white p-3"
            onSubmit={sendMessage}
          >
            <div className="flex gap-2">
              <input
                aria-label="Message Nova AI Assistant"
                className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm text-black outline-none focus:border-[#450043]"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a message"
                value={input}
              />
              <button
                aria-label="Send message"
                className="size-10 rounded-full bg-[#450043] font-bold text-white disabled:opacity-50"
                disabled={loading || !input.trim()}
                type="submit"
              >
                &gt;
              </button>
            </div>
            <Link
              className="mt-2 block text-center text-xs font-semibold text-[#450043]"
              href="/chatbot"
            >
              Open full assistant
            </Link>
          </form>
        </section>
      )}

      <button
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        className="ml-auto flex size-14 items-center justify-center rounded-full bg-[#450043] text-white shadow-xl transition hover:bg-[#6a1767]"
        onClick={() => setOpen((current) => !current)}
        title="Nova AI Assistant"
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="26"
          viewBox="0 0 24 24"
          width="26"
        >
          <path
            d="M5 5h14v10H9l-4 4V5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M8 9h8M8 12h5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      </button>
    </div>
  )
}
