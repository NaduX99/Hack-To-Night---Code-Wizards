'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const revealSelector = [
  'main > section',
  'main header',
  'main article',
  'main form',
  'main footer',
  '.dashboard-card',
  '.transfer-card',
  '.auth-enter',
  '.landing-enter',
  '.landing-rise',
  '.carosel-stage'
].join(',')

export default function ScrollAnimations() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(revealSelector)
    ).filter(
      (element) =>
        !element.closest('.sidebar') &&
        !element.closest('.floating-assistant-root')
    )

    targets.forEach((element, index) => {
      element.classList.add('scroll-reveal')
      element.style.setProperty(
        '--scroll-delay',
        `${Math.min(index, 8) * 55}ms`
      )
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('scroll-reveal-visible')
          observer.unobserve(entry.target)
        })
      },
      {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.12
      }
    )

    targets.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [pathname])

  return null
}
