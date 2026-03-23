"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { CircleHelp } from "lucide-react"
import { SpeciesStudyTreeMap } from "@/components/dashboard/charts/SpeciesStudyTreeMap"
import { SpeciesTreeCountTreeMap } from "@/components/dashboard/charts/SpeciesTreeCountTreeMap"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SpeciesStudyMetric = {
  species: string
  referenceCount: number
  treeCount: number
  score: number
}

type LinkedSpeciesTreemapSectionProps = {
  speciesStudyWithScores: SpeciesStudyMetric[]
  speciesStudyMaxScore: number
  maxTreeCount: number
}

export const LinkedSpeciesTreemapSection = memo(
  function LinkedSpeciesTreemapSection({
    speciesStudyWithScores,
    speciesStudyMaxScore,
    maxTreeCount,
  }: LinkedSpeciesTreemapSectionProps) {
    const [hoveredTreemapSpecies, setHoveredTreemapSpecies] = useState<
      string | null
    >(null)
    const hoverDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      return () => {
        if (hoverDebounceRef.current) {
          clearTimeout(hoverDebounceRef.current)
        }
      }
    }, [])

    const handleTreemapHoverSpecies = useCallback((species: string | null) => {
      if (hoverDebounceRef.current) {
        clearTimeout(hoverDebounceRef.current)
        hoverDebounceRef.current = null
      }

      if (species === null) {
        setHoveredTreemapSpecies(null)
        return
      }

      hoverDebounceRef.current = setTimeout(() => {
        setHoveredTreemapSpecies((current) =>
          current === species ? current : species
        )
        hoverDebounceRef.current = null
      }, 50)
    }, [])

    return (
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <h3>Scientific Attention (Task 5 Use)</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  className="inline-flex items-center rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  aria-label="Scientific Attention chart help"
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-sm whitespace-normal"
                >
                  <div className="space-y-1.5 text-xs">
                    <p>
                      Each rectangle is one species. Larger rectangles indicate
                      more references for that species.
                    </p>
                    <p>
                      Color intensity reflects scientific attention score
                      (higher references = darker tone).
                    </p>
                    <p>
                      Task 5 use information in this section is based on data
                      collected by AmazonFACE Task 5 researchers Beatriz Tristão
                      and Moara Canova.
                    </p>
                    <p>
                      Source data: filtered trees from
                      `final_AmzFACE_merged_by_coords.with_ids.geojson` and
                      references from `species_references_by_species.json`.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <SpeciesStudyTreeMap
            data={speciesStudyWithScores}
            maxScore={speciesStudyMaxScore}
            hoveredSpecies={hoveredTreemapSpecies}
            onHoverSpecies={handleTreemapHoverSpecies}
          />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <h3>Tree Abundance</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  className="inline-flex items-center rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  aria-label="Tree Abundance chart help"
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-sm whitespace-normal"
                >
                  <div className="space-y-1.5 text-xs">
                    <p>
                      Each rectangle is one species. Larger rectangles indicate
                      more individual trees in the filtered plot.
                    </p>
                    <p>
                      Colors indicate Task 5 use context at species level and
                      keep visual consistency with other charts.
                    </p>
                    <p>
                      Task 5 species-use information is from AmazonFACE
                      researchers Beatriz Tristao and Moara Canova.
                    </p>
                    <p>
                      Source data: tree counts from
                      `final_AmzFACE_merged_by_coords.with_ids.geojson`.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <SpeciesTreeCountTreeMap
            data={speciesStudyWithScores}
            maxTreeCount={maxTreeCount}
            hoveredSpecies={hoveredTreemapSpecies}
            onHoverSpecies={handleTreemapHoverSpecies}
          />
        </div>
      </div>
    )
  }
)
