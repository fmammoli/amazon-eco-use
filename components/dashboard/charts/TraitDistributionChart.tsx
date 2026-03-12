"use client"

import { useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts"
import { type ColumnDef } from "@tanstack/react-table"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { DataTableModal } from "./DataTableModal"

export type TraitDistributionBin = {
  label: string
  treeCount: number
  speciesCount: number
  start?: number
  end?: number
}

export type TraitSummary = {
  totalWithValue: number
  totalSpeciesWithValue: number
  missingValues: number
  min: number | null
  median: number | null
  mean: number | null
  max: number | null
}

const chartConfig = {
  treeCount: { label: "Trees" },
  speciesCount: { label: "Species" },
} satisfies ChartConfig

const formatStat = (value: number | null) => {
  if (value == null || !Number.isFinite(value)) return "-"
  return value.toFixed(2)
}

export function TraitDistributionChart({
  traitLabel,
  color,
  domainRange,
  bins,
  summary,
  detailedData = [],
  onPlantIdClick,
}: {
  traitLabel: string
  color: string
  domainRange: [number, number]
  bins: TraitDistributionBin[]
  summary: TraitSummary
  detailedData?: Array<{
    tree_id: string | number
    species: string
    value: number | null
  }>
  onPlantIdClick?: (plantId: string | number) => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedBinLabel, setSelectedBinLabel] = useState<string | null>(null)

  const maxCount = Math.max(
    ...bins.flatMap((bin) => [bin.treeCount, bin.speciesCount]),
    1
  )

  const selectedBin = useMemo(
    () => bins.find((bin) => bin.label === selectedBinLabel),
    [bins, selectedBinLabel]
  )

  const modalData = useMemo(() => {
    if (!selectedBin || selectedBin.start == null || selectedBin.end == null) {
      return detailedData
    }

    const start = selectedBin.start
    const end = selectedBin.end

    return detailedData.filter((row) => {
      if (row.value == null || !Number.isFinite(row.value)) return false

      const isLastBin = selectedBinLabel === bins[bins.length - 1]?.label
      if (isLastBin) {
        return row.value >= start && row.value <= end
      }

      return row.value >= start && row.value < end
    })
  }, [bins, detailedData, selectedBin, selectedBinLabel])

  const modalTitle = selectedBinLabel
    ? `${traitLabel}: ${selectedBinLabel}`
    : `${traitLabel} Distribution Data`

  const modalDescription = selectedBinLabel
    ? `Trees contributing to bin ${selectedBinLabel}`
    : `All trees with ${traitLabel} values`

  const openBinRows = (label: string) => {
    setSelectedBinLabel(label)
    setModalOpen(true)
  }

  const openAllRows = () => {
    setSelectedBinLabel(null)
    setModalOpen(true)
  }

  const detailedColumns: ColumnDef<{
    tree_id: string | number
    species: string
    value: number | null
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
        accessorKey: "value",
        header: `${traitLabel} Value`,
        cell: (info) => {
          const value = info.getValue() as number | null
          return value !== null ? value.toFixed(2) : "—"
        },
      },
    ],
    [onPlantIdClick, traitLabel]
  )

  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">{traitLabel}</p>
          <p className="text-[11px] text-muted-foreground">
            Histogram range: {domainRange[0].toFixed(2)} to{" "}
            {domainRange[1].toFixed(2)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="text-right text-[11px] text-muted-foreground">
            <p>{summary.totalWithValue} trees with value</p>
            <p>{summary.totalSpeciesWithValue} unique species with value</p>
            <p>{summary.missingValues} missing</p>
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
        <AreaChart
          data={bins}
          margin={{ top: 12, right: 4, bottom: 0, left: -12 }}
          onClick={(state) => {
            const label = state?.activeLabel
            if (typeof label === "string") {
              openBinRows(label)
            }
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={1}
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
          <Legend
            wrapperStyle={{ paddingTop: 8 }}
            content={() => (
              <div className="flex justify-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: color, opacity: 0.85 }}
                  />
                  <span style={{ color: "rgba(0,0,0,0.85)" }}>Trees</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: color, opacity: 0.38 }}
                  />
                  <span style={{ color: "rgba(0,0,0,0.38)" }}>Species</span>
                </span>
              </div>
            )}
          />
          <Area
            type="monotone"
            dataKey="treeCount"
            fill={color}
            stroke={color}
            strokeWidth={2}
            fillOpacity={0.42}
          />
          <Area
            type="monotone"
            dataKey="speciesCount"
            fill={color}
            stroke={color}
            strokeWidth={2}
            strokeOpacity={0.45}
            fillOpacity={0.18}
          />
        </AreaChart>
      </ChartContainer>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <p>Min: {formatStat(summary.min)}</p>
        <p>Median: {formatStat(summary.median)}</p>
        <p>Mean: {formatStat(summary.mean)}</p>
        <p>Max: {formatStat(summary.max)}</p>
      </div>
    </div>
  )
}
