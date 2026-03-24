"use client"

import { useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import {
  CartesianGrid,
  Legend,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { type ChartConfig, ChartContainer } from "@/components/ui/chart"
import {
  getUseCategoryColor,
  speciesUseFilterGroups,
} from "@/components/dashboard/constants"
import { DataTableModal } from "@/components/dashboard/charts/DataTableModal"
import { normalizeSpeciesName } from "@/components/dashboard/utils"
import type { RankAbundanceTreeRow } from "@/components/RankAbundanceChart"

const chartConfig = {
  points: { label: "Species" },
} satisfies ChartConfig

export type TreeReferencePoint = {
  treeId: string | number
  species: string
  treeCount: number
  referenceCount: number
  useCategory: string
  x: number
  y: number
}

type TreeCountReferenceScatterChartProps = {
  data: TreeReferencePoint[]
  treeRows: RankAbundanceTreeRow[]
  onPlantIdClick?: (plantId: string | number) => void
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: TreeReferencePoint }>
}) {
  if (!active || !payload || !payload[0]?.payload) return null

  const point = payload[0].payload

  return (
    <div className="rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md">
      <p className="mb-1 text-sm font-semibold">{point.species}</p>
      <p className="text-xs">
        <strong>Tree count (species):</strong> {point.treeCount}
      </p>
      <p className="text-xs">
        <strong>References (species):</strong> {point.referenceCount}
      </p>
      <p className="text-xs">
        <strong>Use category:</strong> {point.useCategory}
      </p>
    </div>
  )
}

export function TreeCountReferenceScatterChart({
  data,
  treeRows,
  onPlantIdClick,
}: TreeCountReferenceScatterChartProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null)

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

  const task5Categories = useMemo(() => {
    const labels =
      speciesUseFilterGroups
        .find((group) => group.id === "task5")
        ?.filters.map((filter) => filter.label) ?? []
    return [...labels, "No use"]
  }, [])

  const chartData = useMemo(() => data, [data])

  const pointsByCategory = useMemo(() => {
    const grouped = new Map<string, TreeReferencePoint[]>()
    task5Categories.forEach((category) => grouped.set(category, []))

    chartData.forEach((point) => {
      const category = point.useCategory || "No use"
      const existing = grouped.get(category) ?? []
      existing.push(point)
      grouped.set(category, existing)
    })

    return grouped
  }, [chartData, task5Categories])

  if (chartData.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-muted-foreground">
        No tree-level data available
      </div>
    )
  }

  const maxX = Math.max(...chartData.map((point) => point.treeCount), 1)
  const maxY = Math.max(...chartData.map((point) => point.referenceCount), 1)

  return (
    <div className="space-y-2">
      <div className="text-[11px] text-muted-foreground">
        {chartData.length} points (one point per species)
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
        id="tree-count-reference-scatter"
        config={chartConfig}
        className="h-105 w-full"
      >
        <ScatterChart margin={{ top: 10, right: 8, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="Tree count"
            label={{
              value: "Tree count",
              position: "insideBottom",
              offset: -4,
              fontSize: 11,
            }}
            domain={[0, maxX + 1]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => Math.round(value).toString()}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="References"
            label={{
              value: "Reference count",
              angle: -90,
              position: "insideLeft",
              fontSize: 11,
            }}
            domain={[0, maxY + 1]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(value) => Math.round(value).toString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            content={() => (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px]">
                {Array.from(pointsByCategory.entries()).map(
                  ([category, points]) => {
                    if (points.length === 0) return null

                    return (
                      <div
                        key={category}
                        className="inline-flex items-center gap-1.5"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            background: getUseCategoryColor(
                              category,
                              task5Categories
                            ),
                          }}
                        />
                        <span>{category}</span>
                        <span className="text-muted-foreground">
                          ({points.length})
                        </span>
                      </div>
                    )
                  }
                )}
              </div>
            )}
          />
          {Array.from(pointsByCategory.entries()).map(([category, points]) => {
            if (points.length === 0) return null

            return (
              <Scatter
                key={category}
                name={`${category} (${points.length})`}
                data={points}
                fill={getUseCategoryColor(category, task5Categories)}
                fillOpacity={0.55}
                cursor="pointer"
                onClick={(pointData) => {
                  const point = (
                    pointData as { payload?: TreeReferencePoint } | undefined
                  )?.payload

                  if (!point || !point.species) return

                  setSelectedSpecies(point.species)
                  setModalOpen(true)
                }}
              />
            )
          })}
        </ScatterChart>
      </ChartContainer>
    </div>
  )
}
