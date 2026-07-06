'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { PostHogIdentify } from '@/components/providers/PostHogIdentify'

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      {children}
      <PostHogIdentify />
    </PostHogProvider>
  )
}
