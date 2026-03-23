"use client"

import { useCallback, useMemo, useState } from "react"

import {
  allFilterIds,
  speciesUseFilterGroups,
} from "@/components/dashboard/constants"
import {
  mergeSpeciesMetadataIntoProps,
  normalizeSpeciesName,
} from "@/components/dashboard/utils"
import { useDashboardGeoData } from "@/hooks/dashboard/useDashboardGeoData"
import { useDashboardUrlSync } from "./dashboard/useDashboardUrlSync"
import { useDataCoverage } from "@/hooks/dashboard/useDataCoverage"
import { useFilteredDashboardData } from "@/hooks/dashboard/useFilteredDashboardData"
import { useTraitDistributionData } from "@/hooks/dashboard/useTraitDistributionData"
import { useTraitUseScatterData } from "@/hooks/dashboard/useTraitUseScatterData"
import { useUseCategoryData } from "@/hooks/dashboard/useUseCategoryData"
import { useSpeciesStudyScore } from "@/hooks/useSpeciesStudyScore"

export function useDashboardData() {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [traitFilters, setTraitFilters] = useState<
    Array<{ id: string; trait: string; range: [number, number] }>
  >([])
  const [selectedUseFilters, setSelectedUseFilters] =
    useState<string[]>(allFilterIds)
  const [includeMissing, setIncludeMissing] = useState(true)
  const [showNoUse, setShowNoUse] = useState(true)
  const [highlightedSpecies, setHighlightedSpecies] = useState<string | null>(
    null
  )
  const [scatterChartState, setScatterChartState] = useState({
    xTrait: "",
    yTrait: "",
    useGroupId: "task5",
    showNoUsePoints: true,
    activeCategoryFilter: null as string | null,
  })
  const [selectedFeature, setSelectedFeature] =
    useState<GeoJSON.Feature | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const {
    geojson,
    speciesMetadataByName,
    featuresByPlantId,
    numericTraits,
    traitDomains,
  } = useDashboardGeoData()

  const selectedPlantId = useMemo(() => {
    if (!selectedFeature) return null

    const props = selectedFeature.properties as Record<string, unknown> | null
    const plantId =
      (props?.["plant_id"] as string | number | undefined) ?? selectedFeature.id

    if (plantId === null || plantId === undefined) return null

    return String(plantId)
  }, [selectedFeature])

  const handleFeatureClick = useCallback(
    (feature: GeoJSON.Feature) => {
      const clickedProps = feature.properties as Record<string, unknown> | null
      const plantId =
        (clickedProps?.["plant_id"] as string | number | undefined) ??
        feature.id
      const baseFeature =
        (plantId != null ? featuresByPlantId.get(plantId) : null) ?? feature
      const baseProps = (baseFeature.properties ?? {}) as Record<
        string,
        unknown
      >
      const speciesName = baseProps["species_name"] as string | undefined
      const normalizedSpeciesName = normalizeSpeciesName(speciesName)
      const speciesMetadata = normalizedSpeciesName
        ? speciesMetadataByName.get(normalizedSpeciesName)
        : undefined

      setSelectedFeature({
        ...baseFeature,
        properties: mergeSpeciesMetadataIntoProps(
          {
            ...baseProps,
          },
          speciesMetadata
        ),
      })

      setDrawerOpen(true)
    },
    [featuresByPlantId, speciesMetadataByName]
  )

  const openPlantById = useCallback(
    (plantId: string | number) => {
      const directMatch = featuresByPlantId.get(plantId)
      const normalizedMatch =
        typeof plantId === "string"
          ? featuresByPlantId.get(Number(plantId))
          : featuresByPlantId.get(String(plantId))

      const feature = directMatch ?? normalizedMatch
      if (!feature) return false

      handleFeatureClick(feature)
      return true
    },
    [featuresByPlantId, handleFeatureClick]
  )

  useDashboardUrlSync({
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
  })

  const missingValueCounts = useMemo(() => {
    if (!geojson || traitFilters.length === 0)
      return {} as Record<string, number>

    const accum: Record<string, number> = {}
    traitFilters.forEach((filter) => {
      accum[filter.id] = 0
    })

    geojson.features.forEach((feature) => {
      const props = feature.properties as Record<string, unknown> | null
      if (!props) {
        traitFilters.forEach((filter) => {
          accum[filter.id] += 1
        })
        return
      }

      traitFilters.forEach((filter) => {
        const value = props[filter.trait]
        if (typeof value !== "number" || !Number.isFinite(value)) {
          accum[filter.id] += 1
        }
      })
    })

    return accum
  }, [geojson, traitFilters])

  const filteredData = useFilteredDashboardData({
    geojson,
    traitFilters,
    includeMissing,
    selectedUseFilters,
    showNoUse,
    speciesMetadataByName,
  })

  const dataCoverage = useDataCoverage({
    features: filteredData?.features ?? [],
    traitFilters,
    numericTraits,
  })

  const { useCategoryDetailedData, useCategoryChartData, totalUniqueSpecies } =
    useUseCategoryData({
      filteredData,
      speciesMetadataByName,
    })

  const { traitDetailedData, traitDistributionChartData } =
    useTraitDistributionData({
      filteredData,
      traitDomains,
    })

  const { getTraitUseScatterData } = useTraitUseScatterData({
    filteredData,
    numericTraits,
    speciesMetadataByName,
  })

  const {
    speciesWithScores: speciesStudyWithScores,
    maxScore: speciesStudyMaxScore,
  } = useSpeciesStudyScore(filteredData?.features ?? null)

  const toggleSpeciesUseFilter = (filterId: string) => {
    setSelectedUseFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    )
  }

  const toggleSpeciesUseFilterGroup = (
    groupId: string,
    shouldSelect: boolean
  ) => {
    const group = speciesUseFilterGroups.find((entry) => entry.id === groupId)
    if (!group) return

    const groupFilterIds = group.filters.map((filter) => filter.id)

    setSelectedUseFilters((prev) => {
      if (shouldSelect) {
        return Array.from(new Set([...prev, ...groupFilterIds]))
      }

      return prev.filter((id) => !groupFilterIds.includes(id))
    })
  }

  const addTraitFilter = () => {
    const nextTrait = numericTraits[0]
    if (!nextTrait) return

    const nextRange = traitDomains[nextTrait]
    if (!nextRange) return

    setTraitFilters((prev) => [
      ...prev,
      {
        id: `${nextTrait}-${Date.now()}`,
        trait: nextTrait,
        range: nextRange,
      },
    ])
  }

  const updateTraitFilter = (
    id: string,
    updater: Partial<{ trait: string; range: [number, number] }>
  ) => {
    setTraitFilters((prev) =>
      prev.map((filter) =>
        filter.id === id ? { ...filter, ...updater } : filter
      )
    )
  }

  const removeTraitFilter = (id: string) => {
    setTraitFilters((prev) => prev.filter((filter) => filter.id !== id))
  }

  const resetFilters = () => {
    setSelectedFilter("all")
    setSelectedUseFilters(allFilterIds)
    setShowNoUse(true)
    setIncludeMissing(true)

    const firstTrait = numericTraits[0]
    const firstRange = firstTrait ? traitDomains[firstTrait] : null

    setTraitFilters(
      firstTrait && firstRange
        ? [
            {
              id: `${firstTrait}-${Date.now()}`,
              trait: firstTrait,
              range: firstRange,
            },
          ]
        : []
    )
  }

  return {
    selectedFilter,
    setSelectedFilter,
    speciesMetadataByName,
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
  }
}
