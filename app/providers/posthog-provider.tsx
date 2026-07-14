'use client'
import { useEffect, useState } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { PostHogIdentify } from '@/components/providers/PostHogIdentify'

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {  
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {  
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,  
        capture_pageview: false, // SPA manual control  
        capture_dead_clicks: false,  
      });  
    }
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <PostHogProvider client={posthog}>
      {children}
      <PostHogIdentify />
    </PostHogProvider>
  )
}
