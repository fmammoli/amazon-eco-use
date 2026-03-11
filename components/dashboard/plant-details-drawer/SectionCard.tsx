import type { ReactNode } from "react"

export function SectionCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <h3 className="text-xs font-semibold">{title}</h3>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        {children}
      </div>
    </div>
  )
}
