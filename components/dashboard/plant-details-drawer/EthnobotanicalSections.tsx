import {
  KeyValueList,
  type KeyValueRow,
} from "@/components/dashboard/plant-details-drawer/KeyValueList"
import { SectionCard } from "@/components/dashboard/plant-details-drawer/SectionCard"

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
    ...(reference ? [{ label: "Reference", value: reference }] : []),
    ...(webpage
      ? [
          {
            label: "Webpage",
            value: webpage,
            valueClassName: "break-all text-right",
          },
        ]
      : []),
  ]

  if (rows.length === 0 && extraRows.length === 0) return null

  return (
    <SectionCard title="Ethnobotanical Uses: Task 5 Literature">
      <KeyValueList rows={[...rows, ...extraRows]} />
    </SectionCard>
  )
}
