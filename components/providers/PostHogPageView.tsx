'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return

    const url =
      window.location.origin +
      pathname +
      (searchParams.toString() ? `?${searchParams.toString()}` : '')

    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, posthog])

  return null
}

// Wrapped in Suspense because useSearchParams() requires a Suspense boundary
// in the Next.js App Router — omitting it causes a build error.
export function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  )
}
