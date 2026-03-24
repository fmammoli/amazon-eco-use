"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CircleHelp } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTableModal } from "@/components/dashboard/charts/DataTableModal"
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

export const LinkedSpeciesTreemapSection = memo(
  function LinkedSpeciesTreemapSection({
    speciesStudyWithScores,
    speciesStudyMaxScore,
    maxTreeCount,
    onPlantIdClick,
    speciesTreeRows,
  }: LinkedSpeciesTreemapSectionProps) {
    const [hoveredTreemapSpecies, setHoveredTreemapSpecies] = useState<
      string | null
    >(null)
    const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null)
    const [isSpeciesTableOpen, setIsSpeciesTableOpen] = useState(false)
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

    const handleTreemapCellClick = useCallback((species: string | null) => {
      if (!species) return
      setSelectedSpecies(species)
      setIsSpeciesTableOpen(true)
    }, [])

    const handlePlantIdClick = useCallback(
      (plantId: string | number) => {
        const opened = onPlantIdClick(plantId)
        if (opened) {
          setIsSpeciesTableOpen(false)
        }
      },
      [onPlantIdClick]
    )

    const selectedSpeciesRows = useMemo(() => {
      if (!selectedSpecies) return []

      const normalizedSelected = selectedSpecies.trim().toLowerCase()

      return speciesTreeRows.filter(
        (row) => row.species_name.trim().toLowerCase() === normalizedSelected
      )
    }, [selectedSpecies, speciesTreeRows])

    const speciesTreeColumns = useMemo<
      ColumnDef<(typeof speciesTreeRows)[number]>[]
    >(
      () => [
        {
          accessorKey: "id",
          header: "ID",
        },
        {
          accessorKey: "plant_id",
          header: "Plant ID",
          cell: ({ row }) => (
            <button
              type="button"
              onClick={() => handlePlantIdClick(row.original.plant_id)}
              className="cursor-pointer font-medium text-primary underline underline-offset-2 hover:opacity-80"
            >
              {row.original.plant_id}
            </button>
          ),
        },
        {
          accessorKey: "species_name",
          header: "Species",
        },
        {
          accessorKey: "genus",
          header: "Genus",
        },
        {
          accessorKey: "family",
          header: "Family",
        },
        {
          accessorKey: "vernacular_name",
          header: "Vernacular",
        },
        {
          accessorKey: "task5_uses",
          header: "Task 5 Uses",
        },
        {
          accessorKey: "task5_reference",
          header: "Task 5 Reference",
        },
        {
          accessorKey: "task5_webpage",
          header: "Task 5 Webpage",
        },
        {
          accessorKey: "height",
          header: "Height",
          cell: ({ row }) => {
            const value = row.original.height
            return value == null ? "-" : value.toFixed(2)
          },
        },
        {
          accessorKey: "dbh_2022",
          header: "DBH 2022",
          cell: ({ row }) => {
            const value = row.original.dbh_2022
            return value == null ? "-" : value.toFixed(2)
          },
        },
      ],
      [handlePlantIdClick]
    )

    return (
      <>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <h3>Scientific Attention (Tristão and Canova, 2025)</h3>
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
                        Each rectangle is one species. Larger rectangles
                        indicate more references for that species.
                      </p>
                      <p>
                        Color intensity reflects scientific attention score
                        (higher references = darker tone).
                      </p>
                      <p>
                        Tristao and Canova (2025) information in this section is
                        based on data collected by AmazonFACE Task 5 researchers
                        Beatriz Tristão and Moara Canova.
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
              onCellClick={handleTreemapCellClick}
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
                        Each rectangle is one species. Larger rectangles
                        indicate more individual trees in the filtered plot.
                      </p>
                      <p>
                        Colors indicate Tristao and Canova (2025) context at
                        species level and keep visual consistency with other
                        charts.
                      </p>
                      <p>
                        Tristao and Canova (2025) species-use information is
                        from AmazonFACE researchers Beatriz Tristao and Moara
                        Canova.
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
              onCellClick={handleTreemapCellClick}
            />
          </div>
        </div>

        <DataTableModal
          data={selectedSpeciesRows}
          columns={speciesTreeColumns}
          title={selectedSpecies ? `${selectedSpecies} trees` : "Species trees"}
          description="Trees for the selected species, including Task 5 uses and references."
          open={isSpeciesTableOpen}
          onOpenChange={setIsSpeciesTableOpen}
          showTrigger={false}
        />
      </>
    )
  }
)
