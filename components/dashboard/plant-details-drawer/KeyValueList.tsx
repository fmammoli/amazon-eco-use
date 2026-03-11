import type { ReactNode } from "react"

type KeyValueRow = {
  label: string
  value: ReactNode
  valueClassName?: string
}

export function KeyValueList({ rows }: { rows: KeyValueRow[] }) {
  return rows.map((row) => (
    <div key={row.label} className="flex justify-between gap-3">
      <span className="font-medium text-foreground">{row.label}</span>
      <span className={row.valueClassName ?? "text-right"}>{row.value}</span>
    </div>
  ))
}

export type { KeyValueRow }
