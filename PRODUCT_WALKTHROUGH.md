# Product Walkthrough Component

This document outlines how the Product Walkthrough feature is implemented in this repository and serves as a strict guideline for AI agents modifying this codebase in the future.

## 📌 Overview
The product walkthrough is a responsive, cross-platform onboarding component that guides authenticated users through the core features of the application (`/opportunities`, `/intern`, `/toolkit`, `/ungatekeep`, `/tracker`).

## 🏗️ Architecture & Core Files

- **`components/home/WalkthroughFigma.tsx`**: The core state machine and UI component. Handles the UI rendering, `framer-motion` animations, pointer calculations, and completion persistence.
- **`components/Navbar.tsx` (Desktop) & `components/BottomNav.tsx` (Mobile)**: The wrapper components that conditionally mount the walkthrough. They utilize a `showWalkthrough` boolean that matches against a `normalizedPath` to determine if the current route is part of the walkthrough steps.
- **`public/images/walkthrough-pointer.svg`**: The absolute-positioned pointer icon asset, rendered via Next.js `<Image>`.

## ⚙️ Trigger Logic & Persistence Rules

1. **Auth Gated**: The walkthrough *must only* render for authenticated users (`useSession`).
2. **Strict Homepage Initialization**: The walkthrough only triggers if the user navigates directly to the homepage (`/`). It sets `sessionStorage.setItem("ftb_walkthrough_active", "true")`. If a user bypasses the homepage and lands directly on `/opportunities`, the walkthrough remains hidden.
3. **Finish vs. Skip All**:
   - **Finish**: When the user clicks "Finish" on the final slide, it sets a *permanent* `localStorage` key tied to their user ID (`ftb_walkthrough_completed_${userId}`). The walkthrough will never appear again for them.
   - **Skip All**: Removes the `sessionStorage` active flag, dismissing the walkthrough for the current session only. It will reappear if they visit the homepage again.

## ⚠️ CRITICAL INSTRUCTIONS FOR AI AGENTS

If you are an AI agent tasked with modifying this walkthrough, you **MUST** adhere to the following rules:

### 1. React Hook Order & Hydration
- **Never place hooks after early returns.** `WalkthroughFigma.tsx` contains early returns for unauthenticated users (`if (!user) return null;`). All `useState` and `useEffect` calls **must** remain above these guard clauses to prevent fatal "Rules of Hooks" crashes and generic React Hydration Mismatch errors.

### 2. Client-Side Rendering Mismatches
- `WalkthroughFigma` relies heavily on browser APIs (`localStorage`, `sessionStorage`, `document.querySelector`). Because of this, its initial server render will naturally mismatch its client render. 
- To handle this, `BottomNav.tsx` intentionally wraps the walkthrough in a `<div suppressHydrationWarning={true}>`. **Do not remove this suppression** unless you are completely refactoring the component to use a strictly dynamic client-only import (`next/dynamic` with `ssr: false`).

### 3. Pointer Positioning Logic
- The desktop pointer absolute positioning relies on the DOM. It uses a resilient `setInterval` polling loop (up to 20 attempts at 50ms) to wait for the target `<header>` links to fully render and acquire width (`targetRect.width > 0`) before calculating offsets.
- **Do not replace this with a raw `setTimeout`**. The retry loop is required because Next.js layout shifts and hydration timings can vary.

### 4. Image Optimization
- The pointer asset (`walkthrough-pointer.svg`) is an SVG. When using the Next.js `<Image>` component for it, always ensure the file extension remains `.svg`. Next.js optimization will fail if an SVG payload is disguised with a `.png` or `.jpg` extension.

---
*Last Updated: May 2026*
