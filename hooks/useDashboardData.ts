"use client"

import { useEffect, useMemo, useState } from "react"

import { allFilterIds, filters } from "@/components/dashboard/constants"
import {
  hasSpeciesUse,
  mergeSpeciesMetadataIntoProps,
  normalizeSpeciesName,
} from "@/components/dashboard/utils"
import type { SpeciesMetadata } from "@/components/dashboard/types"
import { useTraitDistributionData } from "@/hooks/dashboard/useTraitDistributionData"
import { useTraitUseScatterData } from "@/hooks/dashboard/useTraitUseScatterData"
import { useUseCategoryData } from "@/hooks/dashboard/useUseCategoryData"
import { useSpeciesStudyScore } from "@/hooks/useSpeciesStudyScore"

export function useDashboardData() {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null)
  const [speciesMetadataByName, setSpeciesMetadataByName] = useState<
    Map<string, SpeciesMetadata>
  >(new Map())
  const [traitFilters, setTraitFilters] = useState<
    Array<{ id: string; trait: string; range: [number, number] }>
  >([])
  const [selectedUseFilters, setSelectedUseFilters] =
    useState<string[]>(allFilterIds)
  const [includeMissing, setIncludeMissing] = useState(true)
  const [showNoUse, setShowNoUse] = useState(false)
  const [selectedFeature, setSelectedFeature] =
    useState<GeoJSON.Feature | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const activeFilterLabel = useMemo(() => {
    return (
      filters.find((filter) => filter.id === selectedFilter)?.label ??
      "All locations"
    )
  }, [selectedFilter])

  const featuresByPlantId = useMemo(() => {
    const lookup = new Map<string | number, GeoJSON.Feature>()

    geojson?.features.forEach((feature) => {
      const props = feature.properties as Record<string, unknown> | null
      const plantId =
        (props?.["plant_id"] as string | number | undefined) ?? feature.id

      if (plantId != null) {
        lookup.set(plantId, feature)
      }
    })

    return lookup
  }, [geojson])

  const handleFeatureClick = (feature: GeoJSON.Feature) => {
    const clickedProps = feature.properties as Record<string, unknown> | null
    const plantId =
      (clickedProps?.["plant_id"] as string | number | undefined) ?? feature.id
    const baseFeature =
      (plantId != null ? featuresByPlantId.get(plantId) : null) ?? feature
    const baseProps = (baseFeature.properties ?? {}) as Record<string, unknown>
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
  }

  const openPlantById = (plantId: string | number) => {
    const directMatch = featuresByPlantId.get(plantId)
    const normalizedMatch =
      typeof plantId === "string"
        ? featuresByPlantId.get(Number(plantId))
        : featuresByPlantId.get(String(plantId))

    const feature = directMatch ?? normalizedMatch
    if (!feature) return

    handleFeatureClick(feature)
  }

  useEffect(() => {
    let canceled = false

    const load = async () => {
      try {
        const geoRes = await fetch(
          "/data/final_AmzFACE_merged_by_coords.with_ids.geojson"
        )
        if (!geoRes.ok) throw new Error("Failed to load geojson")
        const geoData = (await geoRes.json()) as GeoJSON.FeatureCollection

        const speciesRes = await fetch(
          "/data/final_data_species_with_gbif_inaturalist copy.json"
        )
        if (!speciesRes.ok) throw new Error("Failed to load species metadata")
        const speciesMetadata = (await speciesRes.json()) as SpeciesMetadata[]

        const speciesMap = new Map<string, SpeciesMetadata>()
        speciesMetadata.forEach((sp) => {
          const normalizedName = normalizeSpeciesName(sp?.Species)
          if (!normalizedName) return

          speciesMap.set(normalizedName, sp)
        })

        geoData.features.forEach((feature) => {
          const props = (feature.properties ?? {}) as Record<string, unknown>
          const plantId = props?.["plant_id"] as string | number | undefined

          if (plantId != null) {
            feature.id = plantId
          }
        })

        if (!canceled) {
          setSpeciesMetadataByName(speciesMap)
          setGeojson(geoData)
        }
      } catch {
        // ignore for now
      }
    }

    load()
    return () => {
      canceled = true
    }
  }, [])

  const numericTraits = useMemo(() => {
    if (!geojson) return [] as string[]
    const sample = geojson.features[0]?.properties
    if (!sample) return [] as string[]

    return Object.entries(sample)
      .filter(([, value]) => typeof value === "number")
      .map(([key]) => key)
  }, [geojson])

  const traitDomains = useMemo(() => {
    if (!geojson) return {} as Record<string, [number, number]>

    const domains: Record<string, [number, number]> = {}

    numericTraits.forEach((trait) => {
      let min = Number.POSITIVE_INFINITY
      let max = Number.NEGATIVE_INFINITY

      geojson.features.forEach((feature) => {
        const value = (feature.properties as Record<string, unknown> | null)?.[
          trait
        ]
        if (typeof value === "number" && Number.isFinite(value)) {
          min = Math.min(min, value)
          max = Math.max(max, value)
        }
      })

      if (
        min !== Number.POSITIVE_INFINITY &&
        max !== Number.NEGATIVE_INFINITY
      ) {
        domains[trait] = [min, max]
      }
    })

    return domains
  }, [geojson, numericTraits])

  useEffect(() => {
    if (numericTraits.length > 0 && traitFilters.length === 0) {
      const firstTrait = numericTraits[0]
      const firstDomain = traitDomains[firstTrait]
      if (firstDomain) {
        setTraitFilters([
          {
            id: `${firstTrait}-${Date.now()}`,
            trait: firstTrait,
            range: firstDomain,
          },
        ])
      }
    }
  }, [numericTraits, traitDomains, traitFilters.length])

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

  const filteredData = useMemo(() => {
    if (!geojson) return null

    const filteredFeatures = geojson.features.filter((feature) => {
      const props = feature.properties as Record<string, unknown> | null

      const speciesName = props
        ? (props["species_name"] as string | undefined)
        : undefined
      const normalizedName = normalizeSpeciesName(speciesName)
      const metadata = normalizedName
        ? speciesMetadataByName.get(normalizedName)
        : undefined

      const hasSelectedUse = selectedUseFilters.some((filterId) =>
        hasSpeciesUse(metadata, filterId)
      )
      const speciesHasAnyUse = allFilterIds.some((id) =>
        hasSpeciesUse(metadata, id)
      )

      const passesUseFilter = hasSelectedUse || (showNoUse && !speciesHasAnyUse)
      if (!passesUseFilter) return false

      if (traitFilters.length === 0) return true

      return traitFilters.every((filter) => {
        const value = props ? props[filter.trait] : undefined

        if (typeof value !== "number" || !Number.isFinite(value)) {
          return includeMissing
        }

        return value >= filter.range[0] && value <= filter.range[1]
      })
    })

    return {
      ...geojson,
      features: filteredFeatures,
    }
  }, [
    geojson,
    traitFilters,
    includeMissing,
    selectedUseFilters,
    showNoUse,
    speciesMetadataByName,
  ])

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
    setShowNoUse(false)
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
    activeFilterLabel,
    speciesMetadataByName,
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
  }
}
