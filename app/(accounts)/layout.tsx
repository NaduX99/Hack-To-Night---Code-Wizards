const videoUrl =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4'

export default function AccountsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <main className="auth-stage colorful-landing relative min-h-dvh overflow-hidden bg-[#06130f] px-4 py-5 font-[Poppins] sm:px-6 sm:py-6">
      <video
        aria-hidden="true"
        autoPlay
        className="fixed inset-0 size-full object-cover opacity-70 saturate-150"
        loop
        muted
        playsInline
        src={videoUrl}
      />
      <div className="fixed inset-0 bg-[linear-gradient(120deg,rgba(5,18,14,0.94),rgba(6,24,38,0.78)_48%,rgba(8,13,18,0.86))]" />
      <div className="landing-color-wash fixed inset-0 z-[1]" />

      <div className="relative z-10 mx-auto min-h-[calc(100dvh-2.5rem)] w-full max-w-[1280px]">
        {children}
      </div>
    </main>
  )
}
