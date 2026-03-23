"use client"

import { useMemo } from "react"

import { allFilterIds } from "@/components/dashboard/constants"
import {
  hasSpeciesUse,
  mergeSpeciesMetadataIntoProps,
  normalizeSpeciesName,
} from "@/components/dashboard/utils"
import type { SpeciesMetadata } from "@/components/dashboard/types"

export function useFilteredDashboardData({
  geojson,
  traitFilters,
  includeMissing,
  selectedUseFilters,
  showNoUse,
  speciesMetadataByName,
}: {
  geojson: GeoJSON.FeatureCollection | null
  traitFilters: Array<{ id: string; trait: string; range: [number, number] }>
  includeMissing: boolean
  selectedUseFilters: string[]
  showNoUse: boolean
  speciesMetadataByName: Map<string, SpeciesMetadata>
}) {
  return useMemo(() => {
    if (!geojson) return null

    const filteredFeatures = geojson.features.flatMap((feature) => {
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
      if (!passesUseFilter) return []

      if (traitFilters.length > 0) {
        const passesTraits = traitFilters.every((filter) => {
          const value = props ? props[filter.trait] : undefined

          if (typeof value !== "number" || !Number.isFinite(value)) {
            return includeMissing
          }

          return value >= filter.range[0] && value <= filter.range[1]
        })

        if (!passesTraits) return []
      }

      const enrichedFeature: GeoJSON.Feature = {
        ...feature,
        properties: {
          ...mergeSpeciesMetadataIntoProps(
            {
              ...(props ?? {}),
              has_any_use: speciesHasAnyUse ? 1 : 0,
            },
            metadata
          ),
        },
      }

      return [enrichedFeature]
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
}
