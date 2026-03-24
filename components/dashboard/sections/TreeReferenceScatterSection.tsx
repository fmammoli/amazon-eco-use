"use client"

import { memo } from "react"
import { CircleHelp } from "lucide-react"
import {
  TreeCountReferenceScatterChart,
  type TreeReferencePoint,
} from "@/components/dashboard/charts/TreeCountReferenceScatterChart"
import { type RankAbundanceTreeRow } from "@/components/RankAbundanceChart"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type TreeReferenceScatterSectionProps = {
  data: TreeReferencePoint[]
  treeRows: RankAbundanceTreeRow[]
  onPlantIdClick?: (plantId: string | number) => void
}

export const TreeReferenceScatterSection = memo(
  function TreeReferenceScatterSection({
    data,
    treeRows,
    onPlantIdClick,
  }: TreeReferenceScatterSectionProps) {
    return (
      <section className="col-span-full rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold">
                Tree-Level Abundance vs References (Tristão and Canova, 2025)
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    className="inline-flex items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    aria-label="Abundance vs References scatter help"
                  >
                    <CircleHelp className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-sm whitespace-normal"
                  >
                    <div className="space-y-1.5 text-xs">
                      <p>
                        Each point is one species. X is number of trees and Y is
                        number of references for that species.
                      </p>
                      <p>
                        Point color shows Tristao and Canova (2025) category
                        (Food, Medicinal, Raw Material, or No use).
                      </p>
                      <p>
                        Tristao and Canova (2025) species-use categories are
                        based on ethnobotanical data curated by AmazonFACE
                        researchers Beatriz Tristao and Moara Canova.
                      </p>
                      <p>
                        Source data: filtered trees from
                        `final_AmzFACE_merged_by_coords.with_ids.geojson`,
                        references from `species_references_by_species.json`,
                        and Tristao and Canova (2025) data from
                        `final_data_species_with_gbif_inaturalist copy.json`.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">
              X-axis is species tree count and Y-axis is species reference
              count, with one point per species.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <TreeCountReferenceScatterChart
            data={data}
            treeRows={treeRows}
            onPlantIdClick={onPlantIdClick}
          />
        </div>
      </section>
    )
  }
)
