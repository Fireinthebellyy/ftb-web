'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { PostHogIdentify } from '@/components/providers/PostHogIdentify'
import { PostHogPageView } from '@/components/providers/PostHogPageView'

// Initialize PostHog at module load time — this runs before any component
// renders, so posthog.__loaded is true by the time child useEffects fire.
// The !posthog.__loaded guard prevents double-init in React Strict Mode.
if (typeof window !== 'undefined' && !posthog.__loaded) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false,        // fired manually in PostHogPageView
    capture_dead_clicks: false,
    person_profiles: 'identified_only', // only create profiles for signed-in users
  })
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogPageView />
      <PostHogIdentify />
      {children}
    </PostHogProvider>
  )
}
