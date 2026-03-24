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
import { CircleHelp } from "lucide-react"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { getUseCategoryColor } from "@/components/dashboard/constants"
import { DataTableModal } from "./DataTableModal"

export type UseCategoryDatum = {
  category: string
  treeCount: number
  speciesCount: number
}

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
  const groupSlug = useMemo(
    () =>
      groupLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    [groupLabel]
  )
  const orderedCategories = useMemo(
    () => data.map((entry) => entry.category),
    [data]
  )

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
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-foreground">{groupLabel}</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                id={`use-category-help-${groupSlug || "group"}`}
                className="inline-flex items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              >
                <CircleHelp className="h-3.5 w-3.5" />
                <span className="sr-only">Use prevalence chart help</span>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-sm whitespace-normal"
              >
                <div className="space-y-1.5">
                  <p>
                    This chart compares use prevalence by category for the
                    current filter selection.
                  </p>
                  <p>
                    For each category, the darker bar shows the number of trees
                    and the lighter bar shows the number of species.
                  </p>
                  <p>
                    Categories with tall bars are more prevalent; a large gap
                    between trees and species can indicate repeated use within
                    fewer species.
                  </p>
                  <p>
                    Click any bar to open the corresponding records and inspect
                    the underlying plants.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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

      <ChartContainer
        id={`use-category-${groupSlug || "group"}`}
        config={chartConfig}
        className="h-52 w-full"
      >
        <BarChart
          data={data}
          margin={{ top: 16, right: 4, bottom: 20, left: -12 }}
          barCategoryGap="30%"
          barGap={2}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="category"
            label={{
              value: "Use category",
              position: "insideBottom",
              offset: -4,
              fontSize: 11,
            }}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            label={{
              value: "Count",
              angle: -90,
              position: "insideLeft",
              fontSize: 11,
            }}
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
            {data.map((entry) => {
              const color = getUseCategoryColor(
                entry.category,
                orderedCategories
              )
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
            {data.map((entry) => {
              const color = getUseCategoryColor(
                entry.category,
                orderedCategories
              )
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
