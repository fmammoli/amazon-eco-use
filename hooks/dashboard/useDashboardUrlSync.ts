"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  allFilterIds,
  speciesUseFilterGroups,
} from "@/components/dashboard/constants"

type TraitFilter = { id: string; trait: string; range: [number, number] }

type ScatterChartState = {
  xTrait: string
  yTrait: string
  useGroupId: string
  showNoUsePoints: boolean
  activeCategoryFilter: string | null
}

export function useDashboardUrlSync({
  selectedFilter,
  setSelectedFilter,
  selectedUseFilters,
  setSelectedUseFilters,
  includeMissing,
  setIncludeMissing,
  showNoUse,
  setShowNoUse,
  highlightedSpecies,
  setHighlightedSpecies,
  scatterChartState,
  setScatterChartState,
  traitFilters,
  setTraitFilters,
  traitDomains,
  numericTraits,
  selectedPlantId,
  drawerOpen,
  openPlantById,
}: {
  selectedFilter: string
  setSelectedFilter: (value: string) => void
  selectedUseFilters: string[]
  setSelectedUseFilters: (value: string[]) => void
  includeMissing: boolean
  setIncludeMissing: (value: boolean) => void
  showNoUse: boolean
  setShowNoUse: (value: boolean) => void
  highlightedSpecies: string | null
  setHighlightedSpecies: (value: string | null) => void
  scatterChartState: ScatterChartState
  setScatterChartState: (
    updater:
      | ScatterChartState
      | ((prev: ScatterChartState) => ScatterChartState)
  ) => void
  traitFilters: TraitFilter[]
  setTraitFilters: (
    updater: TraitFilter[] | ((prev: TraitFilter[]) => TraitFilter[])
  ) => void
  traitDomains: Record<string, [number, number]>
  numericTraits: string[]
  selectedPlantId: string | null
  drawerOpen: boolean
  openPlantById: (plantId: string | number) => boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasHydratedRef = useRef(false)
  const shouldUseDefaultTraitFilterRef = useRef(true)
  const pendingPlantIdRef = useRef<string | null>(null)
  const pendingTraitFiltersRef = useRef<Array<{
    trait: string
    range: [number, number]
  }> | null>(null)

  useEffect(() => {
    if (hasHydratedRef.current) return

    const useFiltersParam = searchParams.get("useFilters")
    const includeMissingParam = searchParams.get("includeMissing")
    const showNoUseParam = searchParams.get("showNoUse")
    const traitFiltersParam = searchParams.get("traitFilters")
    const highlightedSpeciesParam = searchParams.get("species")
    const plantIdParam = searchParams.get("plantId")
    const scatterXTraitParam = searchParams.get("scatterX")
    const scatterYTraitParam = searchParams.get("scatterY")
    const scatterGroupParam = searchParams.get("scatterGroup")
    const scatterNoUseParam = searchParams.get("scatterNoUse")
    const scatterCategoryParam = searchParams.get("scatterCategory")

    if (useFiltersParam !== null) {
      const parsedUseFilters = useFiltersParam
        .split(",")
        .map((id) => id.trim())
        .filter((id) => allFilterIds.includes(id))

      setSelectedUseFilters(parsedUseFilters)
    } else {
      setSelectedUseFilters(allFilterIds)
    }

    if (includeMissingParam !== null) {
      setIncludeMissing(includeMissingParam !== "0")
    } else {
      setIncludeMissing(true)
    }

    if (showNoUseParam !== null) {
      setShowNoUse(showNoUseParam !== "0")
    } else {
      setShowNoUse(true)
    }

    setHighlightedSpecies(
      highlightedSpeciesParam && highlightedSpeciesParam.trim()
        ? highlightedSpeciesParam.trim()
        : null
    )

    pendingPlantIdRef.current =
      plantIdParam && plantIdParam.trim() ? plantIdParam.trim() : null

    setScatterChartState((prev) => ({
      ...prev,
      xTrait: scatterXTraitParam?.trim() ?? "",
      yTrait: scatterYTraitParam?.trim() ?? "",
      useGroupId:
        scatterGroupParam &&
        speciesUseFilterGroups.some((group) => group.id === scatterGroupParam)
          ? scatterGroupParam
          : prev.useGroupId,
      showNoUsePoints: scatterNoUseParam !== "0",
      activeCategoryFilter:
        scatterCategoryParam && scatterCategoryParam.trim()
          ? scatterCategoryParam.trim()
          : null,
    }))

    if (traitFiltersParam !== null) {
      shouldUseDefaultTraitFilterRef.current = false

      try {
        const parsed = JSON.parse(traitFiltersParam) as unknown

        if (Array.isArray(parsed)) {
          const candidateFilters = parsed
            .map((entry) => {
              if (!entry || typeof entry !== "object") return null

              const trait = (entry as { trait?: unknown }).trait
              const range = (entry as { range?: unknown }).range

              if (typeof trait !== "string") return null
              if (!Array.isArray(range) || range.length !== 2) return null

              const min = Number(range[0])
              const max = Number(range[1])

              if (!Number.isFinite(min) || !Number.isFinite(max)) return null

              return {
                trait,
                range: [min, max] as [number, number],
              }
            })
            .filter(
              (
                filter
              ): filter is {
                trait: string
                range: [number, number]
              } => filter !== null
            )

          pendingTraitFiltersRef.current = candidateFilters
        } else {
          pendingTraitFiltersRef.current = []
        }
      } catch {
        pendingTraitFiltersRef.current = []
      }
    } else {
      pendingTraitFiltersRef.current = []
      shouldUseDefaultTraitFilterRef.current = true
    }

    hasHydratedRef.current = true
  }, [
    searchParams,
    setHighlightedSpecies,
    setIncludeMissing,
    setScatterChartState,
    setSelectedFilter,
    setSelectedUseFilters,
    setShowNoUse,
  ])

  useEffect(() => {
    if (!hasHydratedRef.current) return

    const pendingTraitFilters = pendingTraitFiltersRef.current
    if (pendingTraitFilters === null) return

    if (pendingTraitFilters.length > 0) {
      const now = Date.now()
      const nextFilters = pendingTraitFilters
        .map((filter, index) => {
          const domain = traitDomains[filter.trait]
          if (!domain) return null

          const min = Math.max(
            domain[0],
            Math.min(filter.range[0], filter.range[1])
          )
          const max = Math.min(
            domain[1],
            Math.max(filter.range[0], filter.range[1])
          )

          if (min > max) return null

          return {
            id: `${filter.trait}-${now}-${index}`,
            trait: filter.trait,
            range: [min, max] as [number, number],
          }
        })
        .filter(
          (
            filter
          ): filter is {
            id: string
            trait: string
            range: [number, number]
          } => filter !== null
        )

      setTraitFilters(nextFilters)
    } else {
      setTraitFilters([])
    }

    pendingTraitFiltersRef.current = null
  }, [setTraitFilters, traitDomains])

  useEffect(() => {
    if (!hasHydratedRef.current) return

    if (
      shouldUseDefaultTraitFilterRef.current &&
      pendingTraitFiltersRef.current === null &&
      numericTraits.length > 0 &&
      traitFilters.length === 0
    ) {
      const firstTrait = numericTraits[0]
      const firstDomain = traitDomains[firstTrait]
      if (!firstDomain) return

      setTraitFilters([
        {
          id: `${firstTrait}-${Date.now()}`,
          trait: firstTrait,
          range: firstDomain,
        },
      ])
    }
  }, [numericTraits, setTraitFilters, traitDomains, traitFilters.length])

  useEffect(() => {
    if (!hasHydratedRef.current) return

    const pendingPlantId = pendingPlantIdRef.current
    if (!pendingPlantId) return

    const opened = openPlantById(pendingPlantId)
    if (opened) {
      pendingPlantIdRef.current = null
    }
  }, [openPlantById])

  useEffect(() => {
    if (!hasHydratedRef.current) return

    const nextParams = new URLSearchParams(searchParams.toString())

    if (selectedFilter !== "all") {
      nextParams.set("locationFilter", selectedFilter)
    } else {
      nextParams.delete("locationFilter")
    }

    if (selectedUseFilters.length !== allFilterIds.length) {
      nextParams.set("useFilters", selectedUseFilters.join(","))
    } else {
      nextParams.delete("useFilters")
    }

    if (!includeMissing) {
      nextParams.set("includeMissing", "0")
    } else {
      nextParams.delete("includeMissing")
    }

    if (!showNoUse) {
      nextParams.set("showNoUse", "0")
    } else {
      nextParams.delete("showNoUse")
    }

    if (traitFilters.length > 0) {
      nextParams.set(
        "traitFilters",
        JSON.stringify(
          traitFilters.map((filter) => ({
            trait: filter.trait,
            range: filter.range,
          }))
        )
      )
    } else {
      nextParams.delete("traitFilters")
    }

    if (highlightedSpecies) {
      nextParams.set("species", highlightedSpecies)
    } else {
      nextParams.delete("species")
    }

    if (drawerOpen && selectedPlantId) {
      nextParams.set("plantId", selectedPlantId)
    } else {
      nextParams.delete("plantId")
    }

    const defaultScatterXTrait = numericTraits[0] ?? ""
    const defaultScatterYTrait = numericTraits[1] ?? numericTraits[0] ?? ""

    if (
      scatterChartState.xTrait &&
      scatterChartState.xTrait !== defaultScatterXTrait
    ) {
      nextParams.set("scatterX", scatterChartState.xTrait)
    } else {
      nextParams.delete("scatterX")
    }

    if (
      scatterChartState.yTrait &&
      scatterChartState.yTrait !== defaultScatterYTrait
    ) {
      nextParams.set("scatterY", scatterChartState.yTrait)
    } else {
      nextParams.delete("scatterY")
    }

    if (scatterChartState.useGroupId !== "task5") {
      nextParams.set("scatterGroup", scatterChartState.useGroupId)
    } else {
      nextParams.delete("scatterGroup")
    }

    if (!scatterChartState.showNoUsePoints) {
      nextParams.set("scatterNoUse", "0")
    } else {
      nextParams.delete("scatterNoUse")
    }

    if (scatterChartState.activeCategoryFilter) {
      nextParams.set("scatterCategory", scatterChartState.activeCategoryFilter)
    } else {
      nextParams.delete("scatterCategory")
    }

    const currentQuery = searchParams.toString()
    const nextQuery = nextParams.toString()

    if (currentQuery !== nextQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      })
    }
  }, [
    includeMissing,
    highlightedSpecies,
    numericTraits,
    pathname,
    router,
    scatterChartState.activeCategoryFilter,
    scatterChartState.showNoUsePoints,
    scatterChartState.useGroupId,
    scatterChartState.xTrait,
    scatterChartState.yTrait,
    searchParams,
    selectedPlantId,
    selectedFilter,
    selectedUseFilters,
    showNoUse,
    traitFilters,
    drawerOpen,
  ])
}
