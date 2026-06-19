const videoUrl =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4'

export default function AccountsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <main className="auth-stage relative min-h-dvh overflow-hidden bg-black px-4 py-5 font-[Poppins] sm:px-6 sm:py-6">
      <video
        aria-hidden="true"
        autoPlay
        className="fixed inset-0 size-full object-cover grayscale"
        loop
        muted
        playsInline
        src={videoUrl}
      />
      <div className="fixed inset-0 bg-black/45" />
      <div className="relative z-10 mx-auto min-h-[calc(100dvh-2.5rem)] w-full max-w-[1280px]">
        {children}
      </div>
    </main>
  )
}
