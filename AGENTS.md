# AGENTS.md

This document provides guidelines for AI agents working on this codebase.

## Project Overview

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with `tw-animate-css`
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Validation**: Zod with React Hook Form
- **UI Components**: Radix UI primitives + custom components

## Build, Lint, and Test Commands

### Development

```bash
npm run dev                    # Start dev server with Turbopack
```

### Production

```bash
npm run build                  # Build for production
npm start                      # Start production server
```

### Code Quality

```bash
npm run lint                   # Run ESLint
npx prettier --write .         # Format all files
```

### Database Migrations (Drizzle)

```bash
npm run dz:generate            # Generate migrations
npm run dz:pull                # Pull schema from database
npm run dz:push                # Push schema changes
```

## Code Style Guidelines

### Imports

Order imports alphabetically within groups:

1. React imports
2. Next.js imports
3. Third-party libraries (alphabetical)
4. Path aliases (@/\*)
5. Relative imports

Use barrel exports from `@/lib` and `@/components/ui`:

```typescript
import { cn, formatDate } from "@/lib/utils";
import { Button, Input, Card } from "@/components/ui";
```

### TypeScript

Use explicit types for props and function parameters. Avoid `any` - use `unknown` or explicit types instead. Use interface for object types, type for unions/primitives:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

type LoadingState = "idle" | "loading" | "success" | "error";
```

### Naming Conventions

- **Components**: PascalCase for file names and exports
- **Variables and functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE for globals, camelCase for locals
- **Boolean props**: prefix with `is`, `has`, `should`

### React Patterns

Client components must have `"use client"` at the top. Use generic type parameters for refs. Type event handlers explicitly:

```typescript
"use client";
import { useState } from "react";

const menuRef = useRef<HTMLDivElement>(null);
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
};
```

### Styling with Tailwind

Use `cn()` utility for class merging (from `@/lib/utils`). Order classes logically: layout → spacing → sizing → typography → colors → effects.

### Error Handling

Use try-catch with async/await. Ignore expected errors when appropriate. Use guard clauses for validation:

```typescript
if (!user) {
  return null;
}
```

### Database (Drizzle ORM)

Schema files are in `lib/schema.ts`, migrations in `migrations/`. Use proper column types from `drizzle-orm/pg-core`.

### Form Handling (React Hook Form + Zod)

Define schema with Zod and use with React Hook Form:

```typescript
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
```

### File Structure

```
app/              # Next.js App Router pages
components/       # React components (ui/, auth/, opportunity/)
lib/              # Utilities (auth.ts, db.ts, schema.ts, utils.ts)
types/            # TypeScript types
migrations/       # Drizzle migrations
```

### Git Workflow

Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`. Branch naming: `k/` for features, `fix/` for bugs.

### Additional Notes

- Use `.env.local` for local environment variables
- Use `next/font/google` for optimized fonts
- Use `next/image` for image optimization
- Use `lucide-react` for icons
- Prefer React Query for server state management
