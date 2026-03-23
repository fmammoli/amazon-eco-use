"use client"

import { useEffect, useMemo, useState } from "react"

import { normalizeSpeciesName } from "@/components/dashboard/utils"
import type { SpeciesMetadata } from "@/components/dashboard/types"

export function useDashboardGeoData() {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null)
  const [speciesMetadataByName, setSpeciesMetadataByName] = useState<
    Map<string, SpeciesMetadata>
  >(new Map())

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
