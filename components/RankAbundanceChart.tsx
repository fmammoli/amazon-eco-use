"use client"

import { useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { DataTableModal } from "@/components/dashboard/charts/DataTableModal"
import type { SpeciesAbundancePoint } from "@/lib/computeSpeciesAbundance"
import { normalizeSpeciesName } from "@/components/dashboard/utils"

type RankAbundanceChartProps = {
  task5Data: SpeciesAbundancePoint[]
  coelhoData: SpeciesAbundancePoint[]
  treeRows: RankAbundanceTreeRow[]
  onPlantIdClick?: (plantId: string | number) => void
}

export type RankAbundanceTreeRow = {
  plant_id: string | number
  species_name: string
  family: string
  height: number | null
  dbh_2022: number | null
}

type ChartPoint = SpeciesAbundancePoint & {
  x: number
  y: number
  z: number
}

const primaryUseOrder = [
  "Medicinal",
  "Medicine",
  "Food",
  "Raw material",
  "Manufacture",
  "Construction",
  "Thatching",
  "Firewood",
  "Other",
  "No recorded use",
] as const

const primaryUseOrderBySource = {
  task5: ["Medicinal", "Food", "Raw material", "No recorded use"],
  coelho: [
    "Medicine",
    "Food",
    "Manufacture",
    "Construction",
    "Thatching",
    "Firewood",
    "No recorded use",
  ],
} as const

const primaryUseColors: Record<(typeof primaryUseOrder)[number], string> = {
  Medicinal: "#7e22ce",
  Medicine: "#7e22ce",
  Food: "#15803d",
  "Raw material": "#ea580c",
  Manufacture: "#c2410c",
  Construction: "#8b5a2b",
  Thatching: "#0f766e",
  Firewood: "#b45309",
  Other: "#64748b",
  "No recorded use": "#6b7280",
}

const chartConfig = {
  points: { label: "Species" },
} satisfies ChartConfig

function RankAbundanceTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: ChartPoint }>
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className="rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md">
      <p className="mb-1 text-sm font-semibold">{point.species}</p>
      <p className="text-xs">
        <strong>Trees in plot:</strong> {point.abundance}
      </p>
      <p className="text-xs">
        <strong>Rank:</strong> {point.rank}
      </p>
      <div className="mt-1 text-xs">
        <strong>Uses:</strong>
        {point.uses.length > 0 ? (
          <ul className="mt-1 list-disc pl-4">
            {point.uses.map((useItem) => (
              <li key={useItem}>{useItem}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1">No recorded use</p>
        )}
      </div>
    </div>
  )
}

export function RankAbundanceChart({
  task5Data,
  coelhoData,
  treeRows,
  onPlantIdClick,
}: RankAbundanceChartProps) {
  const [useSource, setUseSource] = useState<"task5" | "coelho">("task5")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null)

  const data = useSource === "task5" ? task5Data : coelhoData
  const activeLegendOrder = primaryUseOrderBySource[useSource]

  const chartData = useMemo<ChartPoint[]>(
    () =>
      data.map((d) => ({ ...d, x: d.rank, y: d.abundance, z: d.abundance })),
    [data]
  )

  const groupedSeries = useMemo(() => {
    const grouped = new Map<string, ChartPoint[]>()

    primaryUseOrder.forEach((use) => {
      grouped.set(`${use}__single`, [])
      grouped.set(`${use}__multiple`, [])
    })

    chartData.forEach((point) => {
      const use = primaryUseOrder.includes(point.primaryUse)
        ? point.primaryUse
        : "No recorded use"
      const key = `${use}__${point.hasMultipleUses ? "multiple" : "single"}`
      const rows = grouped.get(key) ?? []
      rows.push(point)
      grouped.set(key, rows)
    })

    return grouped
  }, [chartData])

  const treeRowsBySpecies = useMemo(() => {
    const grouped = new Map<string, RankAbundanceTreeRow[]>()

    treeRows.forEach((row) => {
      const key = normalizeSpeciesName(row.species_name)
      if (!key) return

      const rows = grouped.get(key) ?? []
      rows.push(row)
      grouped.set(key, rows)
    })

    return grouped
  }, [treeRows])

  const modalRows = useMemo(() => {
    if (!selectedSpecies) return []
    return treeRowsBySpecies.get(normalizeSpeciesName(selectedSpecies)) ?? []
  }, [selectedSpecies, treeRowsBySpecies])

  const modalTitle = selectedSpecies
    ? `Trees of ${selectedSpecies}`
    : "Species trees"

  const modalDescription = selectedSpecies
    ? `${modalRows.length} tree${modalRows.length === 1 ? "" : "s"} in current filtered view`
    : "Click a species point to inspect individual trees"

  const columns: ColumnDef<RankAbundanceTreeRow>[] = useMemo(
    () => [
      {
        accessorKey: "plant_id",
        header: "Plant ID",
        cell: (info) => {
          const plantId = info.getValue() as string | number

          if (!onPlantIdClick) {
            return String(plantId)
          }

          return (
            <button
              type="button"
              onClick={() => onPlantIdClick(plantId)}
              className="cursor-pointer text-primary underline underline-offset-2 hover:opacity-80"
            >
              {String(plantId)}
            </button>
          )
        },
      },
      {
        accessorKey: "species_name",
        header: "Species",
      },
      {
        accessorKey: "family",
        header: "Family",
      },
      {
        accessorKey: "height",
        header: "Height",
        cell: (info) => {
          const value = info.getValue() as number | null
          return typeof value === "number" && Number.isFinite(value)
            ? value.toFixed(2)
            : "-"
        },
      },
      {
        accessorKey: "dbh_2022",
        header: "DBH 2022",
        cell: (info) => {
          const value = info.getValue() as number | null
          return typeof value === "number" && Number.isFinite(value)
            ? value.toFixed(2)
            : "-"
        },
      },
    ],
    [onPlantIdClick]
  )

  const handlePointClick = (point: unknown) => {
    if (!point || typeof point !== "object") return

    const directPoint = point as ChartPoint
    const nestedPoint = (point as { payload?: ChartPoint }).payload
    const selectedPoint =
      nestedPoint && typeof nestedPoint.species === "string"
        ? nestedPoint
        : typeof directPoint.species === "string"
          ? directPoint
          : null

    if (!selectedPoint?.species) return

    setSelectedSpecies(selectedPoint.species)
    setModalOpen(true)
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-xs text-muted-foreground">
        No species data available for rank-abundance.
      </div>
    )
  }

  const maxRank = Math.max(...chartData.map((d) => d.rank), 1)
  const maxAbundance = Math.max(...chartData.map((d) => d.abundance), 1)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-muted-foreground">
          Use dataset for color/shape encoding:
        </div>
        <div className="inline-flex items-center rounded-md border border-border bg-background/70 p-0.5">
          <button
            type="button"
            onClick={() => setUseSource("task5")}
            className={`rounded-sm px-2 py-1 text-[11px] font-medium transition-colors ${
              useSource === "task5"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            Tristão and Canova (2025)
          </button>
          <button
            type="button"
            onClick={() => setUseSource("coelho")}
            className={`rounded-sm px-2 py-1 text-[11px] font-medium transition-colors ${
              useSource === "coelho"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            Coelho et al. (2021)
          </button>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground">
        {chartData.length} species ranked by abundance.
      </div>
      <div className="text-[11px] text-muted-foreground">
        Click a point to open the list of individual trees for that species.
      </div>
      <DataTableModal
        title={modalTitle}
        description={modalDescription}
        data={modalRows}
        columns={columns}
        open={modalOpen}
        onOpenChange={setModalOpen}
        showTrigger={false}
      />
      <ChartContainer
        id="rank-abundance-chart"
        config={chartConfig}
        className="h-90 w-full"
      >
        <ScatterChart margin={{ top: 10, right: 12, bottom: 10, left: 56 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="Species rank"
            domain={[1, maxRank]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => Math.round(value).toString()}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Abundance"
            domain={[0, maxAbundance + 1]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value) => Math.round(value).toString()}
          />
          <ZAxis type="number" dataKey="z" range={[28, 220]} />
          <Tooltip content={<RankAbundanceTooltip />} />
          {primaryUseOrder.flatMap((use) => {
            const singleRows = groupedSeries.get(`${use}__single`) ?? []
            const multipleRows = groupedSeries.get(`${use}__multiple`) ?? []

            return [
              singleRows.length > 0 ? (
                <Scatter
                  key={`${use}-single`}
                  data={singleRows}
                  name={`${use} (single use)`}
                  fill={primaryUseColors[use]}
                  fillOpacity={0.85}
                  shape="circle"
                  onClick={handlePointClick}
                />
              ) : null,
              multipleRows.length > 0 ? (
                <Scatter
                  key={`${use}-multiple`}
                  data={multipleRows}
                  name={`${use} (multiple uses)`}
                  fill={primaryUseColors[use]}
                  fillOpacity={0.85}
                  shape="diamond"
                  onClick={handlePointClick}
                />
              ) : null,
            ]
          })}
        </ScatterChart>
      </ChartContainer>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">
          Colors (primary use):
        </span>
        {activeLegendOrder.map((use) => (
          <span key={use} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: primaryUseColors[use] }}
            />
            {use}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Shape:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-foreground" />
          Single use
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[11px] leading-none text-foreground">◆</span>
          Multiple uses
        </span>
      </div>
    </div>
  )
}
