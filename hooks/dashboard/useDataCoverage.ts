"use client"

import { useMemo } from "react"

export function useDataCoverage({
  features,
  traitFilters,
  numericTraits,
}: {
  features: GeoJSON.Feature[]
  traitFilters: Array<{ id: string; trait: string; range: [number, number] }>
  numericTraits: string[]
}) {
  return useMemo(() => {
    const totalFilteredTrees = features.length
    const activeTraitKeys = traitFilters.map((filter) => filter.trait)
    const traitKeysToCheck =
      activeTraitKeys.length > 0 ? activeTraitKeys : numericTraits

    const hasContent = (value: unknown) => {
      if (value === null || value === undefined) return false
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase()
        return normalized !== "" && normalized !== "." && normalized !== "na"
      }
      if (Array.isArray(value)) return value.length > 0
      return true
    }

    const hasAnyValues = (record: unknown) => {
      if (!record || typeof record !== "object") return false
      return Object.values(record as Record<string, unknown>).some((value) =>
        hasContent(value)
      )
    }

    let missingTraitValueTrees = 0
    let missingUseMetadataTrees = 0

    features.forEach((feature) => {
      const props = feature.properties as Record<string, unknown> | null
      if (!props) return

      const hasMissingTrait = traitKeysToCheck.some((traitKey) => {
        const traitValue = props[traitKey]
        return !(typeof traitValue === "number" && Number.isFinite(traitValue))
      })

      if (hasMissingTrait) {
        missingTraitValueTrees += 1
      }

      const task5 = props["task5_use"]
      const coelho = props["coelho_arboreal_uses"]
      const hasUseMetadata = hasAnyValues(task5) || hasAnyValues(coelho)

      if (!hasUseMetadata) {
        missingUseMetadataTrees += 1
      }
    })

    const traitCoverageLabel =
      activeTraitKeys.length > 0 ? "selected traits" : "available traits"

    return {
      totalFilteredTrees,
      missingTraitValueTrees,
      missingUseMetadataTrees,
      traitCoverageLabel,
    }
  }, [features, traitFilters, numericTraits])
}
