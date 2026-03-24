"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type RankAbundanceTreeRow } from "@/components/RankAbundanceChart"
import { FilterPanel } from "@/components/dashboard/FilterPanel"
import { PlantDetailsDrawer } from "@/components/dashboard/PlantDetailsDrawer"
import { speciesUseFilterGroups } from "@/components/dashboard/constants"
import {
  hasSpeciesUse,
  normalizeSpeciesName,
} from "@/components/dashboard/utils"
import { TraitDistributionChart } from "@/components/dashboard/charts/TraitDistributionChart"
import { TraitUseScatterChart } from "@/components/dashboard/charts/TraitUseScatterChart"
import { MapSection } from "@/components/dashboard/sections/MapSection"
const PlantSearchSection = dynamic(
  () =>
    import("@/components/dashboard/sections/PlantSearchSection").then(
      (mod) => mod.PlantSearchSection
    ),
  { ssr: false }
)
import { RankAbundanceSection } from "@/components/dashboard/sections/RankAbundanceSection"
import { SpeciesTreemapSection } from "@/components/dashboard/sections/SpeciesTreemapSection"
import { TreeReferenceScatterSection } from "@/components/dashboard/sections/TreeReferenceScatterSection"
import { UsePrevalenceSection } from "@/components/dashboard/sections/UsePrevalenceSection"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDashboardData } from "@/hooks/useDashboardData"
import { computeSpeciesAbundance } from "@/lib/computeSpeciesAbundance"

const WELCOME_DIALOG_SEEN_KEY = "amazonface_dashboard_welcome_seen"

export function Dashboard() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false)
  const [centerOnCoordinates, setCenterOnCoordinates] = useState<{
    coords: [number, number]
    plantId?: string | number
  } | null>(null)
  const mapSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (centerOnCoordinates && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [centerOnCoordinates])

  const clearCenteredHighlight = useCallback(() => {
    setCenterOnCoordinates(null)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const hasSeenWelcome =
      window.localStorage.getItem(WELCOME_DIALOG_SEEN_KEY) === "1"

    if (!hasSeenWelcome) {
      setWelcomeDialogOpen(true)
    }
  }, [])

  const handleWelcomeDialogOpenChange = useCallback((open: boolean) => {
    setWelcomeDialogOpen(open)

    if (!open && typeof window !== "undefined") {
      window.localStorage.setItem(WELCOME_DIALOG_SEEN_KEY, "1")
    }
  }, [])

  const {
    selectedUseFilters,
    toggleSpeciesUseFilter,
    toggleSpeciesUseFilterGroup,
    traitFilters,
    addTraitFilter,
    updateTraitFilter,
    removeTraitFilter,
    includeMissing,
    setIncludeMissing,
    missingValueCounts,
    showNoUse,
    setShowNoUse,
    highlightedSpecies,
    setHighlightedSpecies,
    scatterChartState,
    setScatterChartState,
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
    dataCoverage,
    speciesMetadataByName,
    mapFilterStats,
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

  const rankAbundanceTask5Data = useMemo(
    () =>
      computeSpeciesAbundance(
        filteredData?.features,
        speciesMetadataByName,
        "task5"
      ),
    [filteredData?.features, speciesMetadataByName]
  )

  const rankAbundanceCoelhoData = useMemo(
    () =>
      computeSpeciesAbundance(
        filteredData?.features,
        speciesMetadataByName,
        "coelho"
      ),
    [filteredData?.features, speciesMetadataByName]
  )

  const rankAbundanceTreeRows = useMemo<RankAbundanceTreeRow[]>(() => {
    if (!filteredData?.features) return []

    return filteredData.features.map((feature, index) => {
      const props = feature.properties as Record<string, unknown> | null
      const fallbackPlantId = feature.id ?? index + 1

      return {
        plant_id:
          (props?.["plant_id"] as string | number | undefined) ??
          fallbackPlantId,
        species_name:
          typeof props?.["species_name"] === "string"
            ? props["species_name"]
            : "Unknown",
        family:
          typeof props?.["Family"] === "string"
            ? props["Family"]
            : typeof props?.["gbif_family"] === "string"
              ? props["gbif_family"]
              : "-",
        height:
          typeof props?.["Height"] === "number" &&
          Number.isFinite(props["Height"])
            ? props["Height"]
            : null,
        dbh_2022:
          typeof props?.["DBH_2022"] === "number" &&
          Number.isFinite(props["DBH_2022"])
            ? props["DBH_2022"]
            : null,
      }
    })
  }, [filteredData?.features])

  const treeReferenceTreeRows = useMemo<RankAbundanceTreeRow[]>(() => {
    if (!filteredData?.features) return []

    return filteredData.features.map((feature, index) => {
      const props = feature.properties as Record<string, unknown> | null
      const fallbackPlantId = feature.id ?? index + 1

      return {
        plant_id:
          (props?.["plant_id"] as string | number | undefined) ??
          fallbackPlantId,
        species_name:
          typeof props?.["species_name"] === "string"
            ? props["species_name"]
            : "Unknown",
        family:
          typeof props?.["Family"] === "string"
            ? props["Family"]
            : typeof props?.["gbif_family"] === "string"
              ? props["gbif_family"]
              : "-",
        height:
          typeof props?.["Height"] === "number" &&
          Number.isFinite(props["Height"])
            ? props["Height"]
            : null,
        dbh_2022:
          typeof props?.["DBH_2022"] === "number" &&
          Number.isFinite(props["DBH_2022"])
            ? props["DBH_2022"]
            : null,
      }
    })
  }, [filteredData?.features])

  const filteredTreeTableRows = useMemo(() => {
    if (!filteredData?.features) return []

    return filteredData.features.map((feature, index) => {
      const props = feature.properties as Record<string, unknown> | null
      const fallbackPlantId = feature.id ?? index + 1

      const task5UsesRaw =
        typeof props?.["task5_use_labels"] === "string"
          ? props["task5_use_labels"]
          : ""
      const coelhoUsesRaw =
        typeof props?.["coelho_arboreal_use_labels"] === "string"
          ? props["coelho_arboreal_use_labels"]
          : ""

      return {
        id:
          (props?.["ID"] as string | number | undefined) ??
          feature.id ??
          index + 1,
        plant_id:
          (props?.["plant_id"] as string | number | undefined) ??
          fallbackPlantId,
        species_name:
          typeof props?.["species_name"] === "string"
            ? props["species_name"]
            : "Unknown",
        genus: typeof props?.["Genus"] === "string" ? props["Genus"] : "-",
        family:
          typeof props?.["Family"] === "string"
            ? props["Family"]
            : typeof props?.["gbif_family"] === "string"
              ? props["gbif_family"]
              : "-",
        vernacular_name:
          typeof props?.["vernacular_name"] === "string"
            ? props["vernacular_name"]
            : "-",
        has_any_use:
          props?.["has_any_use"] === 1 || props?.["has_any_use"] === "1"
            ? "Yes"
            : "No",
        task5_uses: task5UsesRaw ? task5UsesRaw.split("||").join("; ") : "-",
        coelho_uses: coelhoUsesRaw ? coelhoUsesRaw.split("||").join("; ") : "-",
        height:
          typeof props?.["Height"] === "number" &&
          Number.isFinite(props["Height"])
            ? props["Height"]
            : typeof props?.["HEIGHT"] === "number" &&
                Number.isFinite(props["HEIGHT"])
              ? props["HEIGHT"]
              : null,
        dbh_2022:
          typeof props?.["DBH_2022"] === "number" &&
          Number.isFinite(props["DBH_2022"])
            ? props["DBH_2022"]
            : null,
      }
    })
  }, [filteredData?.features])

  const speciesTreemapTreeRows = useMemo(() => {
    if (!filteredData?.features) return []

    return filteredData.features.map((feature, index) => {
      const props = feature.properties as Record<string, unknown> | null
      const fallbackPlantId = feature.id ?? index + 1
      const task5Use =
        (props?.["task5_use"] as Record<string, unknown> | null | undefined) ??
        null
      const task5UsesRaw =
        typeof props?.["task5_use_labels"] === "string"
          ? props["task5_use_labels"]
          : ""

      return {
        id:
          (props?.["ID"] as string | number | undefined) ??
          feature.id ??
          index + 1,
        plant_id:
          (props?.["plant_id"] as string | number | undefined) ??
          fallbackPlantId,
        species_name:
          typeof props?.["species_name"] === "string"
            ? props["species_name"]
            : "Unknown",
        genus: typeof props?.["Genus"] === "string" ? props["Genus"] : "-",
        family:
          typeof props?.["Family"] === "string"
            ? props["Family"]
            : typeof props?.["gbif_family"] === "string"
              ? props["gbif_family"]
              : "-",
        vernacular_name:
          typeof props?.["vernacular_name"] === "string"
            ? props["vernacular_name"]
            : "-",
        task5_uses: task5UsesRaw ? task5UsesRaw.split("||").join("; ") : "-",
        task5_reference:
          typeof task5Use?.["References_x"] === "string" &&
          task5Use["References_x"].trim().length > 0
            ? task5Use["References_x"]
            : "-",
        task5_webpage:
          typeof task5Use?.["Webpage"] === "string" &&
          task5Use["Webpage"].trim().length > 0
            ? task5Use["Webpage"]
            : "-",
        height:
          typeof props?.["Height"] === "number" &&
          Number.isFinite(props["Height"])
            ? props["Height"]
            : typeof props?.["HEIGHT"] === "number" &&
                Number.isFinite(props["HEIGHT"])
              ? props["HEIGHT"]
              : null,
        dbh_2022:
          typeof props?.["DBH_2022"] === "number" &&
          Number.isFinite(props["DBH_2022"])
            ? props["DBH_2022"]
            : null,
      }
    })
  }, [filteredData?.features])

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      await fetch("/api/logout", { method: "POST" })
    } finally {
      router.replace("/login")
      router.refresh()
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <Dialog
        open={welcomeDialogOpen}
        onOpenChange={handleWelcomeDialogOpenChange}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base lg:text-lg">
              Welcome to the AmazonFACE Species Use Dashboard
            </DialogTitle>
            <DialogDescription className="text-xs lg:text-sm">
              This platform supports exploration of species-use patterns within
              the AmazonFACE experimental rings and how these patterns connect
              with functional traits and scientific attention.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs text-muted-foreground lg:text-sm">
            <p>
              This dashboard is derived from data collected by AmazonFACE Task 5
              researchers Beatriz Tristão and Moara Canova.
            </p>
            <div>
              <p className="font-medium text-foreground">How to use it</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>
                  Use the left filters to refine species uses and trait ranges.
                </li>
                <li>
                  Search species by scientific or popular name in the top search
                  bar.
                </li>
                <li>
                  Hover and click map points to inspect tree-level details and
                  use data.
                </li>
                <li>
                  Compare treemaps and charts to relate use categories, traits,
                  and abundance in literature.
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2" showCloseButton={false}>
            <Link
              href="/about"
              className="inline-flex h-7 items-center justify-center rounded-md border border-border bg-input/30 px-3 text-xs font-medium text-foreground transition-colors hover:bg-input/50"
            >
              About this project
            </Link>
            <Button
              type="button"
              onClick={() => handleWelcomeDialogOpenChange(false)}
            >
              Start exploring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PlantDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedFeature={selectedFeature}
        onSelectFeature={setSelectedFeature}
        onCenterOnCoordinates={setCenterOnCoordinates}
      />

      <main className="min-h-screen bg-background px-4 py-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-dvw gap-4 lg:grid-cols-[280px_1fr] lg:grid-rows-[auto_1fr]">
          <section className="col-span-full lg:col-span-2">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <h1 className="bg-linear-to-r from-emerald-500 via-cyan-500 to-sky-500 bg-clip-text font-serif text-2xl font-semibold tracking-tight text-transparent lg:text-4xl">
                  AmazonFACE Species Use Dashboard
                </h1>

                <p className="max-w-6xl text-xs text-muted-foreground lg:text-sm">
                  Explore how plant uses in the AmazonFACE experimental plots
                  relate to species traits, abundance, and documented knowledge.
                  Based on Tristão and Canova (2025).
                </p>
              </div>

              <div className="flex items-center justify-start gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center rounded-md border border-border bg-input/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-input/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
                <Link
                  href="/about"
                  className="inline-flex items-center rounded-md border border-border bg-input/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-input/50"
                >
                  About this dashboard
                </Link>
              </div>
            </div>
          </section>

          <PlantSearchSection
            data={filteredData}
            speciesMetadataByName={speciesMetadataByName}
            selectedSpecies={highlightedSpecies}
            onPlantIdClick={openPlantById}
            onSpeciesSelect={setHighlightedSpecies}
          />

          <FilterPanel
            speciesUseFilterGroups={speciesUseFilterGroups}
            selectedUseFilters={selectedUseFilters}
            onToggleSpeciesUseFilter={toggleSpeciesUseFilter}
            onToggleSpeciesUseFilterGroup={toggleSpeciesUseFilterGroup}
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
            dataCoverage={dataCoverage}
            filteredSpeciesCount={mapFilterStats.selected.species.total}
            filteredTreeRows={filteredTreeTableRows}
            onReset={resetFilters}
          />

          <MapSection
            ref={mapSectionRef}
            data={filteredData}
            onFeatureClick={handleFeatureClick}
            highlightedSpecies={highlightedSpecies}
            selectedFeature={selectedFeature}
            centerOnCoordinates={centerOnCoordinates}
            onClearCenteredHighlight={clearCenteredHighlight}
            mapFilterStats={mapFilterStats}
          />

          <RankAbundanceSection
            task5Data={rankAbundanceTask5Data}
            coelhoData={rankAbundanceCoelhoData}
            treeRows={rankAbundanceTreeRows}
            onPlantIdClick={openPlantById}
          />

          <UsePrevalenceSection
            groups={useCategoryChartData}
            totalTrees={filteredData?.features.length ?? 0}
            totalSpecies={totalUniqueSpecies}
            detailedDataByGroup={useCategoryDetailedData}
            onPlantIdClick={openPlantById}
          />

          <SpeciesTreemapSection
            speciesStudyWithScores={speciesStudyWithScores}
            speciesStudyMaxScore={speciesStudyMaxScore}
            maxTreeCount={maxTreeCount}
            onPlantIdClick={openPlantById}
            speciesTreeRows={speciesTreemapTreeRows}
          />

          <TreeReferenceScatterSection
            data={treeReferenceScatterData}
            treeRows={treeReferenceTreeRows}
            onPlantIdClick={openPlantById}
          />

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
                  state={scatterChartState}
                  onStateChange={setScatterChartState}
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
