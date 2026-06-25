"use client"

import { useMemo } from "react"

import { normalizeSpeciesName } from "@/components/dashboard/utils"
import type {
  DashboardInitialData,
  SpeciesMetadata,
} from "@/components/dashboard/types"

export function useDashboardGeoData({
  geojson: rawGeojson,
  speciesMetadata,
}: Pick<DashboardInitialData, "geojson" | "speciesMetadata">) {
  // Assign feature.id from plant_id (mutate in place once on first render)
  const geojson = useMemo(() => {
    rawGeojson.features.forEach((feature) => {
      const props = (feature.properties ?? {}) as Record<string, unknown>
      const plantId = props["plant_id"] as string | number | undefined
      if (plantId != null) feature.id = plantId
    })
    return rawGeojson
  }, [rawGeojson])

  const speciesMetadataByName = useMemo(() => {
    const map = new Map<string, SpeciesMetadata>()
    speciesMetadata.forEach((sp) => {
      const name = normalizeSpeciesName(sp?.Species)
      if (name) map.set(name, sp)
    })
    return map
  }, [speciesMetadata])

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

  return {
    geojson,
    speciesMetadataByName,
    featuresByPlantId,
    numericTraits,
    traitDomains,
  }
}
