"use client"

import { memo } from "react"
import {
  UseCategoryChart,
  type UseCategoryDatum,
} from "@/components/dashboard/charts/UseCategoryChart"
import type { UseCategoryDetailRow } from "@/components/dashboard/types"

type UseCategoryChartGroup = {
  groupId: string
  groupLabel: string
  data: UseCategoryDatum[]
}

type UsePrevalenceSectionProps = {
  groups: UseCategoryChartGroup[]
  totalTrees: number
  totalSpecies: number
  detailedDataByGroup: Record<string, UseCategoryDetailRow[]>
  onPlantIdClick?: (plantId: string | number) => void
}

export const UsePrevalenceSection = memo(function UsePrevalenceSection({
  groups,
  totalTrees,
  totalSpecies,
  detailedDataByGroup,
  onPlantIdClick,
}: UsePrevalenceSectionProps) {
  return (
    <section className="col-span-full rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Species Use Prevalence</h2>
          <p className="text-xs text-muted-foreground">
            How many trees in the current view match each use category.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <UseCategoryChart
            key={group.groupId}
            groupLabel={group.groupLabel}
            data={group.data}
            totalTrees={totalTrees}
            totalSpecies={totalSpecies}
            detailedData={detailedDataByGroup[group.groupId] ?? []}
            onPlantIdClick={onPlantIdClick}
          />
        ))}
      </div>
    </section>
  )
})
