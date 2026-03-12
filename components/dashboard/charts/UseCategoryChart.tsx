"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"
import { type ColumnDef } from "@tanstack/react-table"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { DataTableModal } from "./DataTableModal"

export type UseCategoryDatum = {
  category: string
  treeCount: number
  speciesCount: number
}

// One distinct hue per category slot. Trees bar = full opacity, species bar = 40% opacity of same color.
const CATEGORY_COLORS = [
  "oklch(0.65 0.19 250)", // blue
  "oklch(0.68 0.18 55)", // orange
  "oklch(0.60 0.18 145)", // green
  "oklch(0.65 0.18 25)", // red
  "oklch(0.62 0.18 300)", // purple
  "oklch(0.68 0.17 185)", // teal
  "oklch(0.72 0.16 90)", // yellow-green
  "oklch(0.65 0.18 330)", // pink
  "oklch(0.60 0.15 220)", // slate-blue
]

const chartConfig = {
  treeCount: { label: "Trees" },
  speciesCount: { label: "Species" },
} satisfies ChartConfig

export function UseCategoryChart({
  groupLabel,
  data,
  totalTrees,
  totalSpecies,
  detailedData = [],
  onPlantIdClick,
}: {
  groupLabel: string
  data: UseCategoryDatum[]
  totalTrees: number
  totalSpecies: number
  detailedData?: Array<{
    tree_id: string | number
    species: string
    use_category: string
  }>
  onPlantIdClick?: (plantId: string | number) => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const maxCount = Math.max(
    ...data.flatMap((d) => [d.treeCount, d.speciesCount]),
    1
  )

  const modalData = useMemo(() => {
    if (!selectedCategory) return detailedData
    return detailedData.filter((row) => row.use_category === selectedCategory)
  }, [detailedData, selectedCategory])

  const modalTitle = selectedCategory
    ? `${groupLabel}: ${selectedCategory}`
    : `${groupLabel} Data`

  const modalDescription = selectedCategory
    ? `Trees contributing to ${selectedCategory} in ${groupLabel}`
    : `All trees and their species for ${groupLabel}`

  const openCategoryRows = (category: string) => {
    setSelectedCategory(category)
    setModalOpen(true)
  }

  const openAllRows = () => {
    setSelectedCategory(null)
    setModalOpen(true)
  }

  const detailedColumns: ColumnDef<{
    tree_id: string | number
    species: string
    use_category: string
  }>[] = useMemo(
    () => [
      {
        accessorKey: "tree_id",
        header: "Tree ID",
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
        accessorKey: "species",
        header: "Species",
      },
      {
        accessorKey: "use_category",
        header: "Use Category",
      },
    ],
    [onPlantIdClick]
  )

  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">{groupLabel}</p>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="space-y-0.5 text-right text-[11px] text-muted-foreground">
            <p>{totalTrees} trees in view</p>
            <p>{totalSpecies} species in view</p>
          </div>
          <DataTableModal
            title={modalTitle}
            description={modalDescription}
            data={modalData}
            columns={detailedColumns}
            open={modalOpen}
            onOpenChange={setModalOpen}
            showTrigger={false}
          />
          <Button
            onClick={openAllRows}
            variant="outline"
            size="sm"
            className="text-[11px]"
          >
            View Data
          </Button>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-52 w-full">
        <BarChart
          data={data}
          margin={{ top: 16, right: 4, bottom: 0, left: -12 }}
          barCategoryGap="30%"
          barGap={2}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="category"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            domain={[0, maxCount]}
            width={44}
            tickMargin={6}
            tick={{ fontSize: 10 }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 8 }}
            content={() => (
              <div className="flex justify-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: "rgba(0,0,0,0.85)" }}
                  />
                  <span style={{ color: "rgba(0,0,0,0.85)" }}>Trees</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: "rgba(0,0,0,0.38)" }}
                  />
                  <span style={{ color: "rgba(0,0,0,0.38)" }}>Species</span>
                </span>
              </div>
            )}
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <span className="font-medium">
                    {value} {name === "speciesCount" ? "species" : "trees"}
                  </span>
                )}
              />
            }
          />
          <Bar dataKey="treeCount" name="treeCount" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => {
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
              return (
                <Cell
                  key={entry.category}
                  fill={color}
                  fillOpacity={entry.treeCount === 0 ? 0.15 : 0.85}
                  onClick={() => openCategoryRows(entry.category)}
                  style={{ cursor: "pointer" }}
                />
              )
            })}
            <LabelList
              dataKey="treeCount"
              position="top"
              style={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              formatter={(v: number) => (v === 0 ? "" : v)}
            />
          </Bar>
          <Bar dataKey="speciesCount" name="speciesCount" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => {
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
              return (
                <Cell
                  key={entry.category}
                  fill={color}
                  fillOpacity={entry.speciesCount === 0 ? 0.1 : 0.38}
                  onClick={() => openCategoryRows(entry.category)}
                  style={{ cursor: "pointer" }}
                />
              )
            })}
            <LabelList
              dataKey="speciesCount"
              position="top"
              style={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              formatter={(v: number) => (v === 0 ? "" : v)}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}
