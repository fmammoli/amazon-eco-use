import {
  KeyValueList,
  type KeyValueRow,
} from "@/components/dashboard/plant-details-drawer/KeyValueList"
import { SectionCard } from "@/components/dashboard/plant-details-drawer/SectionCard"

const normalizeExternalUrl = (url: string) => {
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function CoelhoEthnobotanicalSection({ rows }: { rows: KeyValueRow[] }) {
  if (rows.length === 0) return null

  return (
    <SectionCard title="Ethnobotanical Uses: Coelho Arboreal Uses">
      <KeyValueList rows={rows} />
    </SectionCard>
  )
}

export function Task5EthnobotanicalSection({
  rows,
  plantParts,
  reference,
  webpage,
}: {
  rows: KeyValueRow[]
  plantParts: string[]
  reference?: string
  webpage?: string
}) {
  const extraRows: KeyValueRow[] = [
    ...(plantParts.length > 0
      ? [{ label: "Plant Parts", value: plantParts.join(", ") }]
      : []),
  ]

  if (rows.length === 0 && extraRows.length === 0) return null

  return (
    <SectionCard title="Ethnobotanical Uses: Task 5 Literature">
      <KeyValueList rows={[...rows, ...extraRows]} />
    </SectionCard>
  )
}
