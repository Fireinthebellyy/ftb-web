"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

/**
 * React Query hook for session data.
 * Provides caching, deduplication, and automatic background refetching.
 *
 * Benefits over using authClient.useSession() directly:
 * - Shared cache across all components using this hook
 * - Configurable stale time and refetch intervals
 * - Integrates with React Query devtools for debugging
 *
 * @example
 * ```tsx
 * const { data: session, isLoading } = useSession();
 * if (session?.user) {
 *   // User is logged in
 * }
 * ```
 */
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const response = await authClient.getSession();
      return response.data as Session | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - session doesn't change often
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: false, // Don't retry on auth failures
  });
}

/**
 * Hook to invalidate the session cache.
 * Call this after login/logout to force a refetch.
 *
 * @example
 * ```tsx
 * const invalidateSession = useInvalidateSession();
 * await authClient.signOut();
 * invalidateSession();
 * ```
 */
export function useInvalidateSession() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["session"] });
}
