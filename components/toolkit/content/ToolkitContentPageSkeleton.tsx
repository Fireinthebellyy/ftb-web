import { Skeleton } from "@/components/ui/skeleton";

export default function ToolkitContentPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="min-w-0 space-y-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md lg:hidden" />
            <Skeleton className="hidden h-9 w-9 rounded-md lg:block" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="hidden h-9 w-20 rounded-md sm:block" />
          </div>
        </div>
      </header>

      <div className="lg:flex">
        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto space-y-6 lg:max-w-3xl">
            <Skeleton className="aspect-video w-full rounded-xl" />

            <div className="rounded-lg border bg-white p-4 sm:p-6">
              <Skeleton className="mb-4 h-7 w-3/5" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-10 w-full rounded-md sm:w-28" />
              <Skeleton className="h-10 w-full rounded-md sm:w-28" />
            </div>
          </div>
        </main>

        <aside className="hidden w-72 shrink-0 border-l bg-white lg:block lg:h-[calc(100vh-4rem)]">
          <div className="space-y-3 p-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-28" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
