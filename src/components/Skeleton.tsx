export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded ${className}`} />;
}

export function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <Skeleton className="w-40 h-6" />
          <Skeleton className="w-56 h-4" />
        </div>
        <div className="space-y-4">
          <Skeleton className="w-full h-11 rounded-lg" />
          <Skeleton className="w-full h-11 rounded-lg" />
          <Skeleton className="w-full h-11 rounded-lg" />
          <Skeleton className="w-full h-11 rounded-lg" />
          <Skeleton className="w-full h-11 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Skeleton className="w-32 h-8" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="w-64 h-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-16 h-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
