# SEO Fixes — Fire in the Belly (ftb-web)

> Analysis date: 2026-08-30
> Branch: `seo-fix`
> Framework: Next.js 15 App Router

---

## Summary

| Priority | Issues found |
|----------|-------------|
| Critical | 6 |
| High | 7 |
| Medium | 5 |
| Low / Nice-to-have | 4 |

---

## Critical Issues

### 1. No `sitemap.xml`

**File:** `app/sitemap.ts` — does not exist.

Search engines cannot efficiently crawl or index the site. Without a sitemap, pages like `/opportunities`, `/toolkit`, `/ungatekeep`, and cohort landing pages may never be discovered.

**Fix — create `app/sitemap.ts`:**

```ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.ftbhustle.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/opportunities`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/toolkit`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/ungatekeep`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/internships`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/changelog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // TODO: fetch dynamic routes (opportunities, toolkits, ungatekeep posts)
  // and append them with their own lastModified timestamps.

  return staticRoutes;
}
```

---

### 2. No `robots.txt`

**File:** `app/robots.ts` — does not exist.

Without `robots.txt`, crawlers have no guidance on what to index. Admin routes (`/admin/*`), API routes (`/api/*`), and auth pages are unnecessarily consuming crawl budget.

**Fix — create `app/robots.ts`:**

```ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/opportunities", "/toolkit", "/ungatekeep", "/internships", "/changelog", "/privacy", "/terms"],
        disallow: [
          "/admin/",
          "/api/",
          "/login",
          "/signup",
          "/onboarding/",
          "/profile/",
          "/tracker/",
          "/checkout/",
          "/reset-password/",
          "/forgot-password/",
          "/intern/",
        ],
      },
    ],
    sitemap: "https://www.ftbhustle.com/sitemap.xml",
  };
}
```

---

### 3. Home page is `"use client"` — zero server-side metadata

**File:** `app/page.tsx`

The entire home page is a client component (`"use client"` on line 1). This means:
- Next.js **cannot export `metadata`** from it
- The title/description defined in `app/layout.tsx` is the only metadata Google sees for the home page
- No OG image, no Twitter card, no structured data

**Fix:** Refactor `app/page.tsx` to be a **server component** that renders a `<HomeClient />` client component.

```ts
// app/page.tsx (server component — no "use client")
import type { Metadata } from "next";
import HomeClient from "./HomeClient"; // move all current page.tsx content here

export const metadata: Metadata = {
  title: "Fire in the Belly — Internships, Opportunities & Career Toolkits for Students",
  description:
    "India's #1 platform for ambitious students. Discover verified internships, fellowships, hackathons, and career toolkits. Trusted by students from DU, IIMs, SRCC, Manipal & more.",
  openGraph: {
    title: "Fire in the Belly — Everything You Need to Get Ahead",
    description: "Discover internships, career toolkits, and opportunities in one place. Zero gatekeeping. Built for India's ambitious 20s.",
    url: "https://www.ftbhustle.com",
    siteName: "Fire in the Belly",
    images: [{ url: "https://www.ftbhustle.com/images/og-home.png", width: 1200, height: 630, alt: "Fire in the Belly" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fire in the Belly — Internships, Opportunities & Toolkits",
    description: "India's career platform for ambitious students. Internships, fellowships, toolkits & more.",
    images: ["https://www.ftbhustle.com/images/og-home.png"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
```

---

### 4. Missing Open Graph & Twitter Card metadata globally

**File:** `app/layout.tsx`

The root `metadata` export (lines 35-39) only has `title` and `description`. There are no Open Graph tags, no Twitter cards, no `metadataBase`, and no `icons` configuration. Every page that does not define its own OG metadata will show broken social sharing previews.

**Fix — update `app/layout.tsx` metadata:**

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://www.ftbhustle.com"),
  title: {
    default: "Fire in the Belly — Ignite Your Learning Journey",
    template: "%s | Fire in the Belly",
  },
  description:
    "Connect with mentors, discover verified internships, fellowships, and resources. Accelerate your career with personalized guidance for India's ambitious students.",
  keywords: [
    "internships india",
    "student opportunities",
    "career guidance",
    "fellowships",
    "hackathons",
    "case competitions",
    "career toolkit",
    "ungatekeep",
    "fire in the belly",
    "ftb",
  ],
  authors: [{ name: "Fire in the Belly", url: "https://www.ftbhustle.com" }],
  creator: "Fire in the Belly",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.ftbhustle.com",
    siteName: "Fire in the Belly",
    title: "Fire in the Belly — Ignite Your Learning Journey",
    description: "Discover internships, opportunities, and career toolkits for ambitious Indian students. Zero gatekeeping.",
    images: [{ url: "/images/og-home.png", width: 1200, height: 630, alt: "Fire in the Belly" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fire in the Belly — Ignite Your Learning Journey",
    description: "Discover internships, opportunities, and career toolkits for ambitious Indian students.",
    images: ["/images/og-home.png"],
    creator: "@ftbhustle",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
```

> **Action required:** Create `public/images/og-home.png` (1200x630 px).

---

### 5. Opportunities & Toolkit pages have no OG/Twitter metadata

**Files:**
- `app/opportunities/page.tsx` — title says "OpportunityHub" (wrong brand name)
- `app/toolkit/page.tsx` — `"use client"`, no `metadata` export at all

**Fix for `app/opportunities/page.tsx`:**

```ts
export const metadata: Metadata = {
  title: "Opportunities — Hackathons, Fellowships & Competitions",
  description:
    "Find verified hackathons, grants, case competitions, fellowships, and scholarships in India. Filter by tag and never miss a deadline.",
  openGraph: {
    title: "Discover Opportunities — Fire in the Belly",
    description: "Hackathons, fellowships, case competitions, and more — curated and verified for Indian students.",
    images: [{ url: "/images/og-opportunities.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};
```

**Fix for `app/toolkit/page.tsx`:** Extract client logic into `ToolkitPageClient.tsx`, make `page.tsx` a server component, and add:

```ts
export const metadata: Metadata = {
  title: "Toolkits — Career Playbooks That Actually Work",
  description:
    "Step-by-step playbooks for cold emails, interviews, case competitions, and more. Built for ambitious students who want real results.",
  openGraph: {
    title: "Career Toolkits — Fire in the Belly",
    description: "Playbooks for cold emails, interviews, and case competitions. Built for India's ambitious students.",
    images: [{ url: "/images/og-toolkit.png", width: 1200, height: 630 }],
  },
};
```

---

### 6. Ungatekeep detail page is fully client-side — no dynamic metadata

**File:** `app/ungatekeep/[id]/page.tsx`

Line 1 is `"use client"`, so there is no server-rendered metadata for any individual Ungatekeep post. Every post URL shared on WhatsApp or LinkedIn shows the generic site title/description.

**Fix:** Create a server component wrapper that fetches the post data and exports `generateMetadata`:

```ts
// app/ungatekeep/[id]/page.tsx (server component)
import type { Metadata } from "next";
import UngatekeepDetailClient from "./UngatekeepDetailClient"; // rename current file
import { stripHtml } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ungatekeep/${id}`, {
      next: { revalidate: 3600 },
    });
    const post = await res.json();
    const plainText = stripHtml(post.content ?? "");
    const snippet = plainText.substring(0, 160);
    const image = post.attachments?.[0] ?? null;

    return {
      title: post.linkTitle ?? "Ungatekeep Post — Fire in the Belly",
      description: snippet || "Zero gatekeeping — real answers, real advice for Indian students.",
      openGraph: {
        title: post.linkTitle ?? "Ungatekeep — Fire in the Belly",
        description: snippet,
        ...(image ? { images: [{ url: image }] } : {}),
      },
      twitter: { card: image ? "summary_large_image" : "summary" },
    };
  } catch {
    return {
      title: "Ungatekeep — Fire in the Belly",
      description: "Zero gatekeeping — real answers and advice for ambitious Indian students.",
    };
  }
}

export default function UngatekeepDetailPage() {
  return <UngatekeepDetailClient />;
}
```

---

## High Priority Issues

### 7. Toolkit detail page is fully client-side — no dynamic metadata

**File:** `app/toolkit/[id]/page.tsx`

Same problem as Ungatekeep detail. Social shares of individual toolkit pages show the generic site metadata. Apply the same server component + `generateMetadata` pattern.

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const toolkit = await getToolkitById(id); // create or reuse existing helper
  if (!toolkit) return { title: "Toolkit — Fire in the Belly" };

  return {
    title: `${toolkit.title} — Fire in the Belly Toolkit`,
    description: toolkit.description?.substring(0, 160) ?? "A step-by-step career playbook.",
    openGraph: {
      title: toolkit.title,
      description: toolkit.description?.substring(0, 160),
      images: toolkit.coverImageUrl ? [{ url: toolkit.coverImageUrl }] : [],
    },
    twitter: { card: "summary_large_image" },
  };
}
```

---

### 8. Cohort landing page is fully client-side — no metadata

**File:** `app/toolkit/cohorts/[id]/page.tsx`

Cohort pages are high-value conversion pages shared widely on social media. They have no server-rendered metadata.

**Fix:** Apply the same server component + `generateMetadata` pattern, fetching cohort slug, title, subtitle, and card image server-side.

---

### 9. Ungatekeep list page is fully client-side — no metadata

**File:** `app/ungatekeep/page.tsx`

Line 1: `"use client"`. The Ungatekeep feed page has no server-rendered metadata.

**Fix:** Add a thin server component wrapper:

```ts
// app/ungatekeep/page.tsx (server component wrapper)
import type { Metadata } from "next";
import UngatekeepPageClient from "./UngatekeepPageClient";

export const metadata: Metadata = {
  title: "Ungatekeep — Real Advice for Ambitious Students",
  description:
    "Zero gatekeeping. Cold email scripts, interview breakdowns, college hacks, and AMA drops — everything students usually figure out too late.",
  openGraph: {
    title: "Ungatekeep — Zero Gatekeeping for Indian Students",
    description: "Everything you wish someone had told you. College hacks, cold emails, interview prep & more.",
    images: [{ url: "/images/og-ungatekeep.png", width: 1200, height: 630 }],
  },
};

export default function UngatekeepPage() {
  return <UngatekeepPageClient />;
}
```

---

### 10. Internships page has no metadata

**File:** `app/internships/page.tsx`

The page has no `metadata` export whatsoever.

**Fix:**

```ts
export const metadata: Metadata = {
  title: "Internships — Apply Smarter with Fire in the Belly",
  description:
    "Discover curated internships across India. Track deadlines, save favourites, and apply smarter. Part-time, full-time, and remote roles available.",
};
```

---

### 11. Login page has no metadata & no `noindex` directive

**File:** `app/login/page.tsx`

The login page has no `metadata` export and no `robots: noindex` directive, meaning Google may index it and show it in search results.

**Fix:**

```ts
export const metadata: Metadata = {
  title: "Login — Fire in the Belly",
  description: "Log in to your Fire in the Belly account.",
  robots: { index: false, follow: false },
};
```

> Apply the same `robots: noindex` fix to: `/signup`, `/onboarding`, `/reset-password`, `/forgot-password`, `/profile`, `/tracker`, `/checkout`, `/admin`.

---

### 12. Terms & Privacy pages have no metadata

**Files:** `app/terms/page.tsx`, `app/privacy/page.tsx`

Neither page has a `metadata` export. They inherit the generic root title.

**Fix for `app/terms/page.tsx`:**

```ts
export const metadata: Metadata = {
  title: "Terms of Service — Fire in the Belly",
  description: "Read the Terms of Service for Fire in the Belly.",
  robots: { index: true, follow: false },
};
```

**Fix for `app/privacy/page.tsx`:**

```ts
export const metadata: Metadata = {
  title: "Privacy Policy — Fire in the Belly",
  description: "Read the Privacy Policy for Fire in the Belly.",
  robots: { index: true, follow: false },
};
```

---

### 13. Wrong brand name in Opportunities page title

**File:** `app/opportunities/page.tsx`, line 10.

Current title: `"OpportunityHub - Discover Amazing Opportunities"` — "OpportunityHub" is not the brand name.

**Fix:** Change to `"Opportunities — Hackathons, Fellowships & Competitions | Fire in the Belly"`.

---

## Medium Priority Issues

### 14. Heading hierarchy issues on home page

**File:** `app/page.tsx`

- `HeroSection` — correct `<h1>` (line 52)
- `TaglineSection` — correct `<h2>` (line 73)
- `FaqSection` — uses `<h3>` (line 696) for a top-level section; should be `<h2>`
- `ToolkitCarousel` — uses `<h3>` (line 395) for a top-level section; should be `<h2>`

Crawlers use heading hierarchy to understand content structure. Top-level page sections should be `<h2>`, not `<h3>`.

**Fix:** Change `<h3>` to `<h2>` in `ToolkitCarousel`, `FaqSection`, and `CardCarouselSection`.

---

### 15. University logos have generic `alt` text

**File:** `app/page.tsx`, `TrustedSection` (line 228).

All logos use `alt="University logo"`. This is generic and misses keyword opportunities.

**Fix:**

```ts
const logos = [
  { src: "/images/du.png", alt: "Delhi University" },
  { src: "/images/christ.jpg", alt: "Christ University" },
  { src: "/images/manipal.png", alt: "Manipal University" },
  { src: "/images/srcc.png", alt: "SRCC Delhi" },
  { src: "/images/ssc.png", alt: "SSC" },
  { src: "/images/bhu.png", alt: "BHU Varanasi" },
  { src: "/images/iim.jpg", alt: "IIM" },
];
```

---

### 16. FAQ section not using JSON-LD structured data

**File:** `app/page.tsx`, `FaqSection` (line 642).

The FAQ content is rendered in HTML with no `FAQPage` JSON-LD schema. Google can display FAQ rich results (expandable Q&As directly in search results) for pages that include this schema.

**Fix:** After converting the home page to a server component, add inside the page JSX:

```tsx
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
/>
```

---

### 17. `intern/page.tsx` uses wrong brand name in title

**File:** `app/intern/page.tsx`, line 6.

Current: `"InternshipHub - Find Your Dream Internship"`.

**Fix:** `"Internships in India — Find Your Dream Internship | Fire in the Belly"`.

---

### 18. Changelog metadata title is too short/uses abbreviation

**File:** `app/changelog/page.tsx`, line 11.

Current: `"Changelog - FTB"` — "FTB" is an abbreviation unknown to search engines.

**Fix:** `"What's New — Fire in the Belly Changelog"`.

---

## Low Priority / Nice-to-Have

### 19. Add `Organization` JSON-LD to root layout

Allows Google to show the organization name, logo, and social profiles in Knowledge Panel results.

```tsx
// In app/layout.tsx inside <head>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Fire in the Belly",
      url: "https://www.ftbhustle.com",
      logo: "https://www.ftbhustle.com/images/fire-logo.png",
      sameAs: [
        "https://www.instagram.com/fireinthebellyy",
        "https://www.linkedin.com/company/fireinthebellyy",
      ],
    }),
  }}
/>
```

---

### 20. Add `WebSite` JSON-LD with `SearchAction`

Enables a Sitelinks Search Box in Google search results.

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: "https://www.ftbhustle.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.ftbhustle.com/opportunities?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    }),
  }}
/>
```

---

### 21. Add `<link rel="preconnect">` hints for external domains

Reduces TLS/DNS overhead on first load, improving Core Web Vitals (LCP).

```html
<!-- In app/layout.tsx <head> -->
<link rel="preconnect" href="https://checkout.razorpay.com" />
<link rel="preconnect" href="https://app.posthog.com" />
```

---

### 22. Add `apple-touch-icon` and `manifest.json`

Currently `public/` has only images. Adding these improves home screen appearance and sends quality signals to search engines.

- `public/apple-touch-icon.png` — 180x180 px
- `public/manifest.json` — include `name`, `short_name`, `icons`, `theme_color`

---

## Implementation Checklist

- [ ] Create `app/sitemap.ts` (static routes + dynamic DB fetch for opportunities/toolkits/posts)
- [ ] Create `app/robots.ts`
- [ ] Refactor `app/page.tsx` -> server component + `app/HomeClient.tsx`
- [ ] Update `app/layout.tsx` metadata: `metadataBase`, `openGraph`, `twitter`, `keywords`, `icons`, `robots`
- [ ] Create OG image `public/images/og-home.png` (1200x630 px)
- [ ] Fix `app/opportunities/page.tsx` brand name + add OG/Twitter metadata
- [ ] Refactor `app/toolkit/page.tsx` -> server component + `ToolkitPageClient.tsx` + metadata
- [ ] Refactor `app/ungatekeep/page.tsx` -> server wrapper + `UngatekeepPageClient.tsx` + metadata
- [ ] Refactor `app/ungatekeep/[id]/page.tsx` -> server component + `generateMetadata` + `UngatekeepDetailClient.tsx`
- [ ] Refactor `app/toolkit/[id]/page.tsx` -> server component + `generateMetadata` + `ToolkitDetailClient.tsx`
- [ ] Refactor `app/toolkit/cohorts/[id]/page.tsx` -> server component + `generateMetadata`
- [ ] Add metadata to `app/internships/page.tsx`
- [ ] Add `robots: noindex` to `app/login/page.tsx`, `app/signup/page.tsx`, `app/onboarding/**`, `app/profile/**`, `app/tracker/**`, `app/checkout/**`, `app/reset-password/**`, `app/forgot-password/**`, `app/admin/**`
- [ ] Add metadata to `app/terms/page.tsx` and `app/privacy/page.tsx`
- [ ] Fix heading hierarchy (h3 -> h2) for `ToolkitCarousel`, `FaqSection`, `CardCarouselSection`
- [ ] Add descriptive `alt` text to university logos in `TrustedSection`
- [ ] Add `FAQPage` JSON-LD to home page
- [ ] Fix `app/intern/page.tsx` title brand name
- [ ] Fix `app/changelog/page.tsx` title
- [ ] Add `Organization` + `WebSite` JSON-LD to root layout
- [ ] Add `<link rel="preconnect">` hints in `app/layout.tsx`
- [ ] Add `public/apple-touch-icon.png` and `public/manifest.json`
