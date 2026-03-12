"use client"

import { useMemo } from "react"
import Link from "next/link"
import { CircleHelp } from "lucide-react"
import { FilterPanel } from "@/components/dashboard/FilterPanel"
import { MapView } from "@/components/dashboard/MapView"
import { PlantDetailsDrawer } from "@/components/dashboard/PlantDetailsDrawer"
import { speciesUseFilterGroups } from "@/components/dashboard/constants"
import {
  hasSpeciesUse,
  normalizeSpeciesName,
} from "@/components/dashboard/utils"
import { TraitDistributionChart } from "@/components/dashboard/charts/TraitDistributionChart"
import { TraitUseScatterChart } from "@/components/dashboard/charts/TraitUseScatterChart"
import { UseCategoryChart } from "@/components/dashboard/charts/UseCategoryChart"
import { SpeciesStudyTreeMap } from "@/components/dashboard/charts/SpeciesStudyTreeMap"
import { SpeciesTreeCountTreeMap } from "@/components/dashboard/charts/SpeciesTreeCountTreeMap"
import { TreeCountReferenceScatterChart } from "@/components/dashboard/charts/TreeCountReferenceScatterChart"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDashboardData } from "@/hooks/useDashboardData"

export function Dashboard() {
  const {
    activeFilterLabel,
    selectedUseFilters,
    toggleSpeciesUseFilter,
    traitFilters,
    addTraitFilter,
    updateTraitFilter,
    removeTraitFilter,
    includeMissing,
    setIncludeMissing,
    missingValueCounts,
    showNoUse,
    setShowNoUse,
    resetFilters,
    filteredData,
    handleFeatureClick,
    openPlantById,
    selectedFeature,
    setSelectedFeature,
    drawerOpen,
    setDrawerOpen,
    numericTraits,
    traitDomains,
    useCategoryChartData,
    useCategoryDetailedData,
    totalUniqueSpecies,
    traitDistributionChartData,
    traitDetailedData,
    speciesStudyWithScores,
    speciesStudyMaxScore,
    getTraitUseScatterData,
    speciesMetadataByName,
  } = useDashboardData()

  const maxTreeCount = useMemo(() => {
    if (!speciesStudyWithScores || speciesStudyWithScores.length === 0) return 0
    return Math.max(...speciesStudyWithScores.map((d) => d.treeCount))
  }, [speciesStudyWithScores])

  const treeReferenceScatterData = useMemo(() => {
    if (!filteredData?.features || speciesStudyWithScores.length === 0)
      return []

    const task5Filters =
      speciesUseFilterGroups.find((group) => group.id === "task5")?.filters ??
      []

    const firstTreeBySpecies = new Map<string, string | number>()

    filteredData.features.forEach((feature, index) => {
      const props = feature.properties as Record<string, unknown> | null
      const species =
        typeof props?.["species_name"] === "string"
          ? props["species_name"]
          : null

      if (!species || firstTreeBySpecies.has(species)) return

      const treeId =
        (props?.["plant_id"] as string | number | undefined) ??
        feature.id ??
        index

      firstTreeBySpecies.set(species, treeId)
    })

    return speciesStudyWithScores
      .map((speciesMetrics) => {
        const species = speciesMetrics.species
        if (!firstTreeBySpecies.has(species)) return null

        const metadata = speciesMetadataByName.get(
          normalizeSpeciesName(species)
        )
        const firstTask5Use =
          task5Filters.find((filter) => hasSpeciesUse(metadata, filter.id))
            ?.label ?? "No use"

        const treeId = firstTreeBySpecies.get(species)
        if (treeId == null) return null

        return {
          treeId,
          species,
          treeCount: speciesMetrics.treeCount,
          referenceCount: speciesMetrics.referenceCount,
          useCategory: firstTask5Use,
          x: speciesMetrics.treeCount,
          y: speciesMetrics.referenceCount,
        }
      })
      .filter(
        (
          point
        ): point is {
          treeId: string | number
          species: string
          treeCount: number
          referenceCount: number
          useCategory: string
          x: number
          y: number
        } => point !== null
      )
  }, [filteredData?.features, speciesMetadataByName, speciesStudyWithScores])

  return (
    <>
      <PlantDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedFeature={selectedFeature}
        onSelectFeature={setSelectedFeature}
      />

      <main className="min-h-screen bg-background px-4 py-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-dvw gap-4 lg:grid-cols-[280px_1fr] lg:grid-rows-[auto_1fr]">
          <section className="col-span-full lg:col-span-2">
            <div className="flex items-center justify-end">
              <Link
                href="/about"
                className="inline-flex items-center rounded-md border border-border bg-input/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-input/50"
              >
                About this dashboard
              </Link>
            </div>
          </section>

          <FilterPanel
            activeFilterLabel={activeFilterLabel}
            speciesUseFilterGroups={speciesUseFilterGroups}
            selectedUseFilters={selectedUseFilters}
            onToggleSpeciesUseFilter={toggleSpeciesUseFilter}
            numericTraits={numericTraits}
            traitDomains={traitDomains}
            traitFilters={traitFilters}
            onAddTraitFilter={addTraitFilter}
            onUpdateTraitFilter={updateTraitFilter}
            onRemoveTraitFilter={removeTraitFilter}
            includeMissing={includeMissing}
            missingValueCounts={missingValueCounts}
            onToggleIncludeMissing={() => setIncludeMissing((prev) => !prev)}
            showNoUse={showNoUse}
            onToggleShowNoUse={() => setShowNoUse((prev) => !prev)}
            onReset={resetFilters}
          />

          <section className="row-span-1 rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl">
            <header className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">Map</h2>
                <p className="text-xs text-muted-foreground">
                  Showing {activeFilterLabel.toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">Zoom</span>
                <span className="rounded-full bg-muted px-2 py-0.5">
                  Layers
                </span>
              </div>
            </header>

            <MapView data={filteredData} onFeatureClick={handleFeatureClick} />
          </section>

          <section className="col-span-full rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">
                  Species Use Prevalence
                </h2>
                <p className="text-xs text-muted-foreground">
                  How many trees in the current view match each use category.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {useCategoryChartData.map((group) => (
                <UseCategoryChart
                  key={group.groupId}
                  groupLabel={group.groupLabel}
                  data={group.data}
                  totalTrees={filteredData?.features.length ?? 0}
                  totalSpecies={totalUniqueSpecies}
                  detailedData={useCategoryDetailedData[group.groupId] ?? []}
                  onPlantIdClick={openPlantById}
                />
              ))}
            </div>
          </section>

          <section className="col-span-full rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">
                  Species Distribution in Experimental Plots
                </h2>
                <p className="text-xs text-muted-foreground">
                  Treemaps showing study attention (left) and tree abundance
                  (right) by species.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <h3>Scientific Attention</h3>
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
                            Species-use context in this section follows the
                            ethnobotanical curation by AmazonFACE researchers
                            Beatriz Tristao and Moara Canova.
                          </p>
                          <p>
                            Source data: filtered trees from
                            `final_AmzFACE_merged_by_coords.with_ids.geojson`
                            and references from
                            `species_references_by_species.json`.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <SpeciesStudyTreeMap
                  data={speciesStudyWithScores}
                  maxScore={speciesStudyMaxScore}
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
                            Colors indicate Task 5 use context at species level
                            and keep visual consistency with other charts.
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
                />
              </div>
            </div>
          </section>

          <section className="col-span-full rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold">
                    Tree-Level Abundance vs References
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
                            Each point is one species. X is number of trees and
                            Y is number of references for that species.
                          </p>
                          <p>
                            Point color shows Task 5 use category (Food,
                            Medicinal, Raw Material, or No use).
                          </p>
                          <p>
                            Task 5 species-use categories are based on
                            ethnobotanical data curated by AmazonFACE
                            researchers Beatriz Tristao and Moara Canova.
                          </p>
                          <p>
                            Source data: filtered trees from
                            `final_AmzFACE_merged_by_coords.with_ids.geojson`,
                            references from
                            `species_references_by_species.json`, and Task 5 use
                            from `final_data_species_with_gbif_inaturalist
                            copy.json`.
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
                data={treeReferenceScatterData}
                onPlantIdClick={openPlantById}
              />
            </div>
          </section>

          {traitDistributionChartData.length > 0 ? (
            <section className="col-span-full rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Traits Distribution</h2>
                  <p className="text-xs text-muted-foreground">
                    Distribution of trait values in the current filtered view.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {traitDistributionChartData.map((traitChart) => (
                  <TraitDistributionChart
                    key={traitChart.id}
                    traitLabel={traitChart.trait}
                    color={traitChart.color}
                    domainRange={traitChart.domainRange}
                    bins={traitChart.bins}
                    summary={traitChart.summary}
                    detailedData={traitDetailedData[traitChart.trait] ?? []}
                    onPlantIdClick={openPlantById}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {numericTraits.length > 1 ? (
            <section className="col-span-full rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold">
                    Trait-Use Relationship
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Scatter analysis of use categories across trait-value space.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <TraitUseScatterChart
                  numericTraits={numericTraits}
                  getScatterData={getTraitUseScatterData}
                  onPlantIdClick={openPlantById}
                />
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  )
}
