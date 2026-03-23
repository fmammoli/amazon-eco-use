import { Suspense } from "react"

import { Dashboard } from "@/components/dashboard/Dashboard"

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-dvw text-sm text-muted-foreground">
            Loading dashboard...
          </div>
        </main>
      }
    >
      <Dashboard />
    </Suspense>
  )
}
