import { Suspense } from "react"
import { LoginForm } from "./LoginForm"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
          <p className="text-xs text-muted-foreground">Loading login...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
