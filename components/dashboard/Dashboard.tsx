"use client"

import { FilterPanel } from "@/components/dashboard/FilterPanel"
import { MapView } from "@/components/dashboard/MapView"
import { PlantDetailsDrawer } from "@/components/dashboard/PlantDetailsDrawer"
import {
  filters,
  speciesUseFilterGroups,
} from "@/components/dashboard/constants"
import { TraitDistributionChart } from "@/components/dashboard/charts/TraitDistributionChart"
import { UseCategoryChart } from "@/components/dashboard/charts/UseCategoryChart"
import { useDashboardData } from "@/hooks/useDashboardData"

export function Dashboard() {
  const {
    selectedFilter,
    setSelectedFilter,
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
  } = useDashboardData()

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
          <FilterPanel
            filters={filters}
            selectedFilter={selectedFilter}
            activeFilterLabel={activeFilterLabel}
            onSelectFilter={setSelectedFilter}
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
        </div>
      </main>
    </>
  )
}
