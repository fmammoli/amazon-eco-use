import type { ReactNode } from "react"

type KeyValueRow = {
  label: string
  value: ReactNode
  valueClassName?: string
}

export function KeyValueList({ rows }: { rows: KeyValueRow[] }) {
  return rows.map((row) => (
    <div
      key={row.label}
      className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-start gap-3"
    >
      <span className="min-w-0 font-medium whitespace-normal text-foreground select-text">
        {row.label}
      </span>
      <span
        className={
          row.valueClassName ??
          "min-w-0 text-right whitespace-normal select-text"
        }
      >
        {row.value}
      </span>
    </div>
  ))
}

export type { KeyValueRow }
