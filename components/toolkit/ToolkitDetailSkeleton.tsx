import { Skeleton } from "@/components/ui/skeleton";

export default function ToolkitDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 inline-flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-12" />
        </div>

        <div className="grid gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="mb-6 overflow-hidden rounded-lg border bg-white">
              <div className="relative aspect-video bg-gray-100">
                <Skeleton className="h-full w-full rounded-none" />
              </div>
              <div className="p-6">
                <div className="mb-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>

                <Skeleton className="mb-3 h-10 w-4/5" />
                <Skeleton className="mb-4 h-4 w-1/2" />

                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                <div className="mt-6">
                  <Skeleton className="mb-3 h-5 w-36" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <Skeleton className="mb-4 h-7 w-44" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border bg-white p-6">
              <Skeleton className="mb-4 h-7 w-24" />
              <Skeleton className="aspect-video w-full" />
            </div>
          </div>

          <div className="hidden xl:col-span-1 xl:block">
            <div className="sticky top-8 rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-baseline gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-6 w-20" />
              </div>

              <div className="mb-4 flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-20" />
                </div>
                <Skeleton className="h-11 w-full" />
                <Skeleton className="mx-auto h-3 w-40" />
              </div>

              <Skeleton className="my-6 h-px w-full" />

              <Skeleton className="mb-3 h-4 w-36" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Skeleton className="mt-0.5 h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
