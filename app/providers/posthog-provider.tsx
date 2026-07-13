'use client'
import { useEffect, useState } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { PostHogIdentify } from '@/components/providers/PostHogIdentify'

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
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
