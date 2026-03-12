"use client"

import { useMemo } from "react"

import { speciesUseFilterGroups } from "@/components/dashboard/constants"
import {
  hasSpeciesUse,
  normalizeSpeciesName,
} from "@/components/dashboard/utils"
import type {
  SpeciesMetadata,
  UseCategoryDetailRow,
} from "@/components/dashboard/types"

export function useUseCategoryData({
  filteredData,
  speciesMetadataByName,
}: {
  filteredData: GeoJSON.FeatureCollection | null
  speciesMetadataByName: Map<string, SpeciesMetadata>
}) {
  const useCategoryDetailedData = useMemo(() => {
    const features = filteredData?.features ?? []
    const result: Record<string, UseCategoryDetailRow[]> = {}

    speciesUseFilterGroups.forEach((group) => {
      const records: UseCategoryDetailRow[] = []

      features.forEach((feature) => {
        const props = feature.properties as Record<string, unknown> | null
        const treeId = props?.["plant_id"] as string | number | undefined
        const speciesName =
          (props?.["species_name"] as string | undefined) || "Unknown"
        const normalizedName = normalizeSpeciesName(speciesName)
        const metadata = normalizedName
          ? speciesMetadataByName.get(normalizedName)
          : undefined

        group.filters.forEach((filter) => {
          if (hasSpeciesUse(metadata, filter.id) && treeId != null) {
            records.push({
              tree_id: treeId,
              species: speciesName,
              use_category: filter.label,
            })
          }
        })

        const hasAnyUse = group.filters.some((f) =>
          hasSpeciesUse(metadata, f.id)
        )
        if (!hasAnyUse && treeId != null) {
          records.push({
            tree_id: treeId,
            species: speciesName,
            use_category: "No use",
          })
        }
      })

      result[group.id] = records
    })

    return result
  }, [filteredData, speciesMetadataByName])

  const useCategoryChartData = useMemo(() => {
    const features = filteredData?.features ?? []

    const getMetadataForFeature = (feature: GeoJSON.Feature) => {
      const props = feature.properties as Record<string, unknown> | null
      const speciesName = props
        ? (props["species_name"] as string | undefined)
        : undefined
      const normalizedName = normalizeSpeciesName(speciesName)

      return normalizedName
        ? speciesMetadataByName.get(normalizedName)
        : undefined
    }

    const getNormalizedSpeciesNameForFeature = (feature: GeoJSON.Feature) => {
      const props = feature.properties as Record<string, unknown> | null
      const speciesName = props
        ? (props["species_name"] as string | undefined)
        : undefined

      return normalizeSpeciesName(speciesName)
    }

    const countForCategory = (
      predicate: (feature: GeoJSON.Feature) => boolean
    ) => {
      const matchingFeatures = features.filter(predicate)
      const speciesSet = new Set<string>()

      matchingFeatures.forEach((feature) => {
        const normalizedName = getNormalizedSpeciesNameForFeature(feature)
        if (normalizedName) {
          speciesSet.add(normalizedName)
        }
      })

      return {
        treeCount: matchingFeatures.length,
        speciesCount: speciesSet.size,
      }
    }

    return speciesUseFilterGroups.map((group) => {
      const noUseMetrics = countForCategory((feature) => {
        const metadata = getMetadataForFeature(feature)
        return !group.filters.some((f) => hasSpeciesUse(metadata, f.id))
      })

      return {
        groupId: group.id,
        groupLabel: group.label,
        data: [
          ...group.filters.map((f) => ({
            category: f.label,
            ...countForCategory((feature) => {
              const metadata = getMetadataForFeature(feature)
              return hasSpeciesUse(metadata, f.id)
            }),
          })),
          {
            category: "No use",
            ...noUseMetrics,
          },
        ],
      }
    })
  }, [filteredData, speciesMetadataByName])

  const totalUniqueSpecies = useMemo(() => {
    const speciesSet = new Set<string>()

    filteredData?.features.forEach((feature) => {
      const props = feature.properties as Record<string, unknown> | null
      const speciesName = props
        ? (props["species_name"] as string | undefined)
        : undefined
      const normalizedName = normalizeSpeciesName(speciesName)

      if (normalizedName) {
        speciesSet.add(normalizedName)
      }
    })

    return speciesSet.size
  }, [filteredData])

  return {
    useCategoryDetailedData,
    useCategoryChartData,
    totalUniqueSpecies,
  }
}
