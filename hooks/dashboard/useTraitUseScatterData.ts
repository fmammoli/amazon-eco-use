"use client"

import { useMemo } from "react"

import { speciesUseFilterGroups } from "@/components/dashboard/constants"
import {
  hasSpeciesUse,
  normalizeSpeciesName,
} from "@/components/dashboard/utils"
import type {
  SpeciesMetadata,
  TraitUseScatterPoint,
  TraitUseScatterRow,
} from "@/components/dashboard/types"

export function useTraitUseScatterData({
  filteredData,
  numericTraits,
  speciesMetadataByName,
}: {
  filteredData: GeoJSON.FeatureCollection | null
  numericTraits: string[]
  speciesMetadataByName: Map<string, SpeciesMetadata>
}) {
  const traitUseScatterSourceByGroup = useMemo(() => {
    const features = filteredData?.features ?? []
    const sourceByGroup: Record<string, TraitUseScatterPoint[]> = {}

    speciesUseFilterGroups.forEach((group) => {
      sourceByGroup[group.id] = []
    })

    features.forEach((feature) => {
      const props = feature.properties as Record<string, unknown> | null
      const plantId = props?.["plant_id"] as string | number | undefined

      if (plantId == null) return

      const speciesName =
        (props?.["species_name"] as string | undefined) || "Unknown"
      const normalizedName = normalizeSpeciesName(speciesName)
      const metadata = normalizedName
        ? speciesMetadataByName.get(normalizedName)
        : undefined

      const traitValues: Record<string, number | null> = {}
      numericTraits.forEach((trait) => {
        const rawValue = props?.[trait]
        traitValues[trait] =
          typeof rawValue === "number" && Number.isFinite(rawValue)
            ? rawValue
            : null
      })

      speciesUseFilterGroups.forEach((group) => {
        const matchingFilters = group.filters.filter((filter) =>
          hasSpeciesUse(metadata, filter.id)
        )

        if (matchingFilters.length === 0) {
          sourceByGroup[group.id].push({
            plant_id: plantId,
            species_name: speciesName,
            use_category: "No use",
            use_group: group.id,
            trait_values: traitValues,
          })
          return
        }

        matchingFilters.forEach((filter) => {
          sourceByGroup[group.id].push({
            plant_id: plantId,
            species_name: speciesName,
            use_category: filter.label,
            use_group: group.id,
            trait_values: traitValues,
          })
        })
      })
    })

    return sourceByGroup
  }, [filteredData, numericTraits, speciesMetadataByName])

  const getTraitUseScatterData = ({
    xTrait,
    yTrait,
    useGroupId,
    includeNoUse,
  }: {
    xTrait: string
    yTrait: string
    useGroupId: string
    includeNoUse: boolean
  }): TraitUseScatterRow[] => {
    const sourceRows = traitUseScatterSourceByGroup[useGroupId] ?? []

    return sourceRows
      .filter((row) => includeNoUse || row.use_category !== "No use")
      .map((row) => {
        const xValue = row.trait_values[xTrait]
        const yValue = row.trait_values[yTrait]

        if (
          typeof xValue !== "number" ||
          !Number.isFinite(xValue) ||
          typeof yValue !== "number" ||
          !Number.isFinite(yValue)
        ) {
          return null
        }

        return {
          plant_id: row.plant_id,
          species_name: row.species_name,
          x_trait: xTrait,
          x_value: xValue,
          y_trait: yTrait,
          y_value: yValue,
          use_category: row.use_category,
          use_group: row.use_group,
        }
      })
      .filter((row): row is TraitUseScatterRow => row !== null)
  }

  return {
    getTraitUseScatterData,
  }
}
