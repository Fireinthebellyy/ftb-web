'use client'

import posthog from 'posthog-js'

export default function CheckoutPage() {
    function handlePurchase() {
        posthog.capture('purchase_completed', { amount: 99 })
    }

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 p-8">
            <h1 className="text-2xl font-bold">Checkout Page</h1>
            <p className="text-neutral-600">Click the button below to simulate a purchase and track it in PostHog.</p>
            <button
                onClick={handlePurchase}
                className="rounded-full bg-orange-500 px-6 py-2 font-bold text-white transition-colors hover:bg-orange-600"
            >
                Complete purchase
            </button>
        </div>
    )
}
