import type { Metadata } from 'next'
import './app/globals.css'

export const metadata: Metadata = {
  title: 'Smart Spend - Banking Solutions',
  description: 'Manage your finances with Smart Spend'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
