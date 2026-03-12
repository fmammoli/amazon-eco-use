"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Scatter,
  ScatterChart,
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
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  getTraitDisplayLabel,
  getUseCategoryColor,
  speciesUseFilterGroups,
} from "@/components/dashboard/constants"
import type { TraitUseScatterRow } from "@/components/dashboard/types"
import { DataTableModal } from "./DataTableModal"

type UseGroupOption = {
  id: string
  label: string
  categories: string[]
}

type NumericRange = [number, number]

const chartConfig = {
  points: { label: "Trees" },
} satisfies ChartConfig

const buildUseGroupOptions = (): UseGroupOption[] => {
  return speciesUseFilterGroups.map((group) => ({
    id: group.id,
    label: group.label,
    categories: [...group.filters.map((filter) => filter.label), "No use"],
  }))
}

const normalizeRange = (
  values: number | readonly number[],
  fallback: NumericRange
) => {
  if (!Array.isArray(values) || values.length < 2) return fallback

  const [start, end] = values[0] <= values[1] ? values : [values[1], values[0]]
  return [start, end] as NumericRange
}

const formatRangeValue = (value: number) => value.toFixed(2)

const createDomainWithPadding = (values: number[]): NumericRange | null => {
  if (values.length === 0) return null

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.05, 0.5)
    return [min - padding, max + padding]
  }

  return [min, max]
}

export function TraitUseScatterChart({
  numericTraits,
  getScatterData,
  onPlantIdClick,
}: {
  numericTraits: string[]
  getScatterData: (params: {
    xTrait: string
    yTrait: string
    useGroupId: string
    includeNoUse: boolean
  }) => TraitUseScatterRow[]
  onPlantIdClick?: (plantId: string | number) => void
}) {
  const useGroupOptions = useMemo(() => buildUseGroupOptions(), [])

  const [xTrait, setXTrait] = useState(numericTraits[0] ?? "")
  const [yTrait, setYTrait] = useState(
    numericTraits[1] ?? numericTraits[0] ?? ""
  )
  const [selectedUseGroup, setSelectedUseGroup] = useState(
    useGroupOptions[0]?.id ?? "task5"
  )
  const [showNoUsePoints, setShowNoUsePoints] = useState(true)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    string | null
  >(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalCategory, setModalCategory] = useState<string | null>(null)
  const [xZoomRange, setXZoomRange] = useState<NumericRange | null>(null)
  const [yZoomRange, setYZoomRange] = useState<NumericRange | null>(null)

  const xTraitLabel = getTraitDisplayLabel(xTrait)
  const yTraitLabel = getTraitDisplayLabel(yTrait)

  useEffect(() => {
    if (numericTraits.length < 2) return

    if (!xTrait || !numericTraits.includes(xTrait)) {
      setXTrait(numericTraits[0])
    }

    if (!yTrait || !numericTraits.includes(yTrait)) {
      setYTrait(numericTraits[1] ?? numericTraits[0])
    }
  }, [numericTraits, xTrait, yTrait])

  const scatterRows = useMemo(() => {
    if (!xTrait || !yTrait || numericTraits.length === 0) return []

    return getScatterData({
      xTrait,
      yTrait,
      useGroupId: selectedUseGroup,
      includeNoUse: showNoUsePoints,
    })
  }, [
    getScatterData,
    numericTraits.length,
    selectedUseGroup,
    showNoUsePoints,
    xTrait,
    yTrait,
  ])

  const groupCategories = useMemo(() => {
    return (
      useGroupOptions.find((group) => group.id === selectedUseGroup)
        ?.categories ?? []
    )
  }, [selectedUseGroup, useGroupOptions])

  const visibleRows = useMemo(() => {
    if (!activeCategoryFilter) return scatterRows
    return scatterRows.filter(
      (row) => row.use_category === activeCategoryFilter
    )
  }, [activeCategoryFilter, scatterRows])

  const fullDomains = useMemo(() => {
    const xValues = visibleRows.map((row) => row.x_value)
    const yValues = visibleRows.map((row) => row.y_value)

    const x = createDomainWithPadding(xValues)
    const y = createDomainWithPadding(yValues)

    if (!x || !y) return null

    return { x, y }
  }, [visibleRows])

  useEffect(() => {
    setXZoomRange(fullDomains?.x ?? null)
    setYZoomRange(fullDomains?.y ?? null)
  }, [fullDomains])

  const zoomedRows = useMemo(() => {
    if (!xZoomRange || !yZoomRange) return visibleRows

    return visibleRows.filter((row) => {
      return (
        row.x_value >= xZoomRange[0] &&
        row.x_value <= xZoomRange[1] &&
        row.y_value >= yZoomRange[0] &&
        row.y_value <= yZoomRange[1]
      )
    })
  }, [visibleRows, xZoomRange, yZoomRange])

  const zoomActive = useMemo(() => {
    if (!fullDomains || !xZoomRange || !yZoomRange) return false

    return (
      xZoomRange[0] !== fullDomains.x[0] ||
      xZoomRange[1] !== fullDomains.x[1] ||
      yZoomRange[0] !== fullDomains.y[0] ||
      yZoomRange[1] !== fullDomains.y[1]
    )
  }, [fullDomains, xZoomRange, yZoomRange])

  const pointsByCategory = useMemo(() => {
    const grouped = new Map<string, TraitUseScatterRow[]>()

    groupCategories.forEach((category) => {
      grouped.set(category, [])
    })

    zoomedRows.forEach((row) => {
      const existing = grouped.get(row.use_category) ?? []
      existing.push(row)
      grouped.set(row.use_category, existing)
    })

    if (!showNoUsePoints) {
      grouped.delete("No use")
    }

    return grouped
  }, [groupCategories, showNoUsePoints, zoomedRows])

  const modalRows = useMemo(() => {
    if (modalCategory) {
      return zoomedRows.filter((row) => row.use_category === modalCategory)
    }

    return zoomedRows
  }, [modalCategory, zoomedRows])

  const modalTitle = modalCategory
    ? `Trait-Use: ${modalCategory}`
    : "Trait-Use Relationship Data"

  const selectedUseGroupLabel =
    useGroupOptions.find((group) => group.id === selectedUseGroup)?.label ??
    selectedUseGroup

  const modalDescription = modalCategory
    ? `Trees in ${selectedUseGroupLabel} categorized as ${modalCategory}`
    : `Scatter rows for ${xTraitLabel} vs ${yTraitLabel} in ${selectedUseGroupLabel}`

  const openCategoryRows = (category: string) => {
    setModalCategory(category)
    setModalOpen(true)
  }

  const openAllRows = () => {
    setModalCategory(null)
    setModalOpen(true)
  }

  const resetZoom = () => {
    setXZoomRange(fullDomains?.x ?? null)
    setYZoomRange(fullDomains?.y ?? null)
  }

  const handleLegendClick = (category: string) => {
    setActiveCategoryFilter((prev) => (prev === category ? null : category))
  }

  const columns: ColumnDef<TraitUseScatterRow>[] = useMemo(
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
        accessorKey: "use_category",
        header: "Use Category",
      },
      {
        accessorKey: "x_value",
        header: `${xTraitLabel} (X)`,
        cell: (info) => (info.getValue() as number).toFixed(2),
      },
      {
        accessorKey: "y_value",
        header: `${yTraitLabel} (Y)`,
        cell: (info) => (info.getValue() as number).toFixed(2),
      },
    ],
    [onPlantIdClick, xTraitLabel, yTraitLabel]
  )

  const hasEnoughTraits = numericTraits.length >= 2

  if (!hasEnoughTraits) {
    return (
      <div className="rounded-md border border-border p-3 text-xs text-muted-foreground">
        At least 2 numeric traits are required to render the trait-use scatter
        plot.
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-foreground">
              Trait-Use Relationship
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  id="trait-use-scatter-help"
                  className="inline-flex items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                  <span className="sr-only">Scatter plot help</span>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-sm whitespace-normal"
                >
                  <div className="space-y-1.5">
                    <p>
                      Each point represents one tree plotted by the selected X
                      and Y traits.
                    </p>
                    <p>
                      Point color shows the use category, so clusters of the
                      same color suggest that a use group tends to occur within
                      a particular trait-value region.
                    </p>
                    <p>
                      Mixed colors in the same area indicate overlapping trait
                      space across categories rather than a clear separation.
                    </p>
                    <p>
                      Use the legend to isolate categories and the zoom sliders
                      to inspect dense regions more closely.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Explore clusters by plotting {xTraitLabel} against {yTraitLabel}.
          </p>
          <p className="mt-1 max-w-xl rounded bg-muted p-2 text-[11px] text-muted-foreground/90">
            Note: trees with multiple uses are duplicated across each matching
            use category, so a single plant may appear as multiple points.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="text-right text-[11px] text-muted-foreground">
            n = {zoomedRows.length} points
            {zoomActive ? ` (${visibleRows.length} before zoom)` : ""}
          </p>
          <DataTableModal
            title={modalTitle}
            description={modalDescription}
            data={modalRows}
            columns={columns}
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

      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          Trait X
          <select
            value={xTrait}
            onChange={(event) => setXTrait(event.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
          >
            {numericTraits.map((trait) => (
              <option key={trait} value={trait}>
                {getTraitDisplayLabel(trait)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          Trait Y
          <select
            value={yTrait}
            onChange={(event) => setYTrait(event.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
          >
            {numericTraits.map((trait) => (
              <option key={trait} value={trait}>
                {getTraitDisplayLabel(trait)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          Use Group
          <select
            value={selectedUseGroup}
            onChange={(event) => {
              setSelectedUseGroup(event.target.value)
              setActiveCategoryFilter(null)
            }}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
          >
            {useGroupOptions.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 self-end rounded-md border border-input px-2 py-1.5 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={showNoUsePoints}
            onChange={(event) => {
              setShowNoUsePoints(event.target.checked)
              if (!event.target.checked && activeCategoryFilter === "No use") {
                setActiveCategoryFilter(null)
              }
            }}
            className="h-3.5 w-3.5"
          />
          Show No use points
        </label>
      </div>

      {fullDomains ? (
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-md border border-border bg-muted/30 p-3 lg:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>X zoom: {xTraitLabel}</span>
              <span>
                {xZoomRange
                  ? `${formatRangeValue(xZoomRange[0])} - ${formatRangeValue(xZoomRange[1])}`
                  : "Full range"}
              </span>
            </div>
            <Slider
              value={xZoomRange ?? fullDomains.x}
              min={fullDomains.x[0]}
              max={fullDomains.x[1]}
              step={Math.max((fullDomains.x[1] - fullDomains.x[0]) / 200, 0.01)}
              minStepsBetweenValues={1}
              onValueChange={(values) =>
                setXZoomRange(normalizeRange(values, fullDomains.x))
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>Y zoom: {yTraitLabel}</span>
              <span>
                {yZoomRange
                  ? `${formatRangeValue(yZoomRange[0])} - ${formatRangeValue(yZoomRange[1])}`
                  : "Full range"}
              </span>
            </div>
            <Slider
              value={yZoomRange ?? fullDomains.y}
              min={fullDomains.y[0]}
              max={fullDomains.y[1]}
              step={Math.max((fullDomains.y[1] - fullDomains.y[0]) / 200, 0.01)}
              minStepsBetweenValues={1}
              onValueChange={(values) =>
                setYZoomRange(normalizeRange(values, fullDomains.y))
              }
            />
          </div>

          <div className="flex items-end justify-start lg:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetZoom}
              disabled={!zoomActive}
              className="text-[11px]"
            >
              Reset Zoom
            </Button>
          </div>
        </div>
      ) : null}

      <ChartContainer
        id="trait-use-scatter"
        config={chartConfig}
        className="h-72 w-full"
      >
        <ScatterChart margin={{ top: 10, right: 8, bottom: 10, left: 64 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x_value"
            name={xTraitLabel}
            domain={xZoomRange ?? undefined}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="number"
            dataKey="y_value"
            name={yTraitLabel}
            domain={yZoomRange ?? undefined}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => {
                  const row = item.payload as TraitUseScatterRow
                  if (name === "y_value") {
                    return (
                      <span className="font-medium">
                        {row.species_name} • {row.use_category}
                      </span>
                    )
                  }

                  return <span className="font-medium">{value}</span>
                }}
                labelFormatter={() => `${xTraitLabel} vs ${yTraitLabel}`}
              />
            }
          />
          <Legend
            verticalAlign="bottom"
            content={() => (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px]">
                {Array.from(pointsByCategory.entries()).map(
                  ([category, rows]) => {
                    const color = getUseCategoryColor(category, groupCategories)
                    const isActive = activeCategoryFilter === category

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleLegendClick(category)}
                        onDoubleClick={() => openCategoryRows(category)}
                        className="inline-flex items-center gap-1.5"
                        style={{
                          opacity: activeCategoryFilter && !isActive ? 0.35 : 1,
                        }}
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: color }}
                        />
                        <span>{category}</span>
                        <span className="text-muted-foreground">
                          ({rows.length})
                        </span>
                      </button>
                    )
                  }
                )}
              </div>
            )}
          />

          {Array.from(pointsByCategory.entries()).map(([category, rows]) => {
            if (rows.length === 0) return null

            const color = getUseCategoryColor(category, groupCategories)
            const isActive = activeCategoryFilter === category
            const hasActive = activeCategoryFilter !== null

            return (
              <Scatter
                key={category}
                name={category}
                data={rows}
                fill={color}
                fillOpacity={hasActive && !isActive ? 0.12 : 0.5}
                cursor={onPlantIdClick ? "pointer" : undefined}
                onClick={(pointData) => {
                  const payload = (
                    pointData as { payload?: TraitUseScatterRow } | undefined
                  )?.payload

                  if (!payload) return

                  onPlantIdClick?.(payload.plant_id)
                }}
              />
            )
          })}
        </ScatterChart>
      </ChartContainer>
    </div>
  )
}
