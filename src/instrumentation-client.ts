import posthog from "posthog-js";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {  
 posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {  
 api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,  
 capture_pageview: false, // ← add this too (SPA manual control)  
 capture_dead_clicks: false,  
 });  
}

export default posthog;