"use client"

import { memo } from "react"
import { LinkedSpeciesTreemapSection } from "@/components/dashboard/sections/LinkedSpeciesTreemapSection"

type SpeciesStudyMetric = {
  species: string
  referenceCount: number
  treeCount: number
  score: number
}

type SpeciesTreemapSectionProps = {
  speciesStudyWithScores: SpeciesStudyMetric[]
  speciesStudyMaxScore: number
  maxTreeCount: number
  onPlantIdClick: (plantId: string | number) => boolean
  speciesTreeRows: Array<{
    id: string | number
    plant_id: string | number
    species_name: string
    genus: string
    family: string
    vernacular_name: string
    task5_uses: string
    task5_reference: string
    task5_webpage: string
    height: number | null
    dbh_2022: number | null
  }>
}

export const SpeciesTreemapSection = memo(function SpeciesTreemapSection({
  speciesStudyWithScores,
  speciesStudyMaxScore,
  maxTreeCount,
  onPlantIdClick,
  speciesTreeRows,
}: SpeciesTreemapSectionProps) {
  return (
    <section className="col-span-full rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">
            Species Distribution in Experimental Plots
          </h2>
          <p className="text-xs text-muted-foreground">
            Treemaps showing study attention (left) and tree abundance (right)
            by species.
          </p>
        </div>
      </div>

      <LinkedSpeciesTreemapSection
        speciesStudyWithScores={speciesStudyWithScores}
        speciesStudyMaxScore={speciesStudyMaxScore}
        maxTreeCount={maxTreeCount}
        onPlantIdClick={onPlantIdClick}
        speciesTreeRows={speciesTreeRows}
      />
    </section>
  )
})
