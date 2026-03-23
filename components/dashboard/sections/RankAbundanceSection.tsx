"use client"

import { memo } from "react"
import {
  RankAbundanceChart,
  type RankAbundanceTreeRow,
} from "@/components/RankAbundanceChart"
import type { SpeciesAbundancePoint } from "@/lib/computeSpeciesAbundance"

type RankAbundanceSectionProps = {
  task5Data: SpeciesAbundancePoint[]
  coelhoData: SpeciesAbundancePoint[]
  treeRows: RankAbundanceTreeRow[]
  onPlantIdClick?: (plantId: string | number) => void
}

export const RankAbundanceSection = memo(function RankAbundanceSection({
  task5Data,
  coelhoData,
  treeRows,
  onPlantIdClick,
}: RankAbundanceSectionProps) {
  return (
    <section className="col-span-full rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">
            Species Rank-Abundance Curve
          </h2>
          <p className="text-xs text-muted-foreground">
            This chart ranks species by abundance in the experimental plots.
            Point color indicates primary ethnobotanical use and point shape
            indicates single vs multiple uses.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <RankAbundanceChart
          task5Data={task5Data}
          coelhoData={coelhoData}
          treeRows={treeRows}
          onPlantIdClick={onPlantIdClick}
        />
      </div>
    </section>
  )
})
