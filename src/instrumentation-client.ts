import posthog from 'posthog-js'

console.log('instrumentation-client.ts is loading', process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'Has Key' : 'No Key');

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30'
})
