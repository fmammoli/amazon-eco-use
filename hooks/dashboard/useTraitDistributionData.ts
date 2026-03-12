"use client"

import { useMemo } from "react"

import {
  HISTOGRAM_TRAITS,
  TRAIT_HISTOGRAM_COLORS,
} from "@/components/dashboard/constants"
import { normalizeSpeciesName } from "@/components/dashboard/utils"
import type { TraitDetailRow } from "@/components/dashboard/types"

export function useTraitDistributionData({
  filteredData,
  traitDomains,
}: {
  filteredData: GeoJSON.FeatureCollection | null
  traitDomains: Record<string, [number, number]>
}) {
  const traitDetailedData = useMemo(() => {
    const features = filteredData?.features ?? []
    const result: Record<string, TraitDetailRow[]> = {}

    HISTOGRAM_TRAITS.forEach((trait) => {
      const records: TraitDetailRow[] = []

      features.forEach((feature) => {
        const props = feature.properties as Record<string, unknown> | null
        const treeId = props?.["plant_id"] as string | number | undefined
        const speciesName =
          (props?.["species_name"] as string | undefined) || "Unknown"
        const value = props?.[trait] as number | undefined

        if (treeId != null) {
          records.push({
            tree_id: treeId,
            species: speciesName,
            value:
              typeof value === "number" && Number.isFinite(value)
                ? value
                : null,
          })
        }
      })

      result[trait] = records
    })

    return result
  }, [filteredData])

  const traitDistributionChartData = useMemo(() => {
    const features = filteredData?.features ?? []
    const BIN_COUNT = 10

    const createBins = (domainMin: number, domainMax: number) => {
      if (!Number.isFinite(domainMin) || !Number.isFinite(domainMax)) return []

      const span = domainMax - domainMin
      if (span <= 0) {
        return [
          {
            label: domainMin.toFixed(2),
            start: domainMin,
            end: domainMax,
            treeCount: 0,
            speciesSet: new Set<string>(),
          },
        ]
      }

      const binWidth = span / BIN_COUNT

      return Array.from({ length: BIN_COUNT }, (_, idx) => {
        const start = domainMin + idx * binWidth
        const end = idx === BIN_COUNT - 1 ? domainMax : start + binWidth

        return {
          label: `${start.toFixed(1)}-${end.toFixed(1)}`,
          start,
          end,
          treeCount: 0,
          speciesSet: new Set<string>(),
        }
      })
    }

    return HISTOGRAM_TRAITS.map((trait) => {
      const domain = traitDomains[trait]
      if (!domain) return null

      const [domainMin, domainMax] = domain
      const bins = createBins(domainMin, domainMax)
      const numericValues: number[] = []
      const speciesWithValue = new Set<string>()
      let missingValues = 0

      features.forEach((feature) => {
        const props = feature.properties as Record<string, unknown> | null
        const rawValue = props ? props[trait] : undefined
        const speciesName = props ? props["species_name"] : undefined
        const normalizedSpeciesName = normalizeSpeciesName(speciesName)

        if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
          missingValues += 1
          return
        }

        numericValues.push(rawValue)
        if (normalizedSpeciesName) {
          speciesWithValue.add(normalizedSpeciesName)
        }

        if (bins.length === 1) {
          bins[0].treeCount += 1
          if (normalizedSpeciesName) {
            bins[0].speciesSet.add(normalizedSpeciesName)
          }
          return
        }

        const span = domainMax - domainMin
        const normalized = (rawValue - domainMin) / span
        const idx = Math.min(
          bins.length - 1,
          Math.max(0, Math.floor(normalized * bins.length))
        )
        bins[idx].treeCount += 1
        if (normalizedSpeciesName) {
          bins[idx].speciesSet.add(normalizedSpeciesName)
        }
      })

      const sortedValues = [...numericValues].sort((a, b) => a - b)
      const median =
        sortedValues.length === 0
          ? null
          : sortedValues.length % 2 === 1
            ? sortedValues[Math.floor(sortedValues.length / 2)]
            : (sortedValues[sortedValues.length / 2 - 1] +
                sortedValues[sortedValues.length / 2]) /
              2

      const mean =
        numericValues.length > 0
          ? numericValues.reduce((sum, value) => sum + value, 0) /
            numericValues.length
          : null

      return {
        id: trait,
        trait,
        color: TRAIT_HISTOGRAM_COLORS[trait],
        domainRange: domain,
        bins: bins.map(({ label, start, end, treeCount, speciesSet }) => ({
          label,
          start,
          end,
          treeCount,
          speciesCount: speciesSet.size,
        })),
        summary: {
          totalWithValue: numericValues.length,
          totalSpeciesWithValue: speciesWithValue.size,
          missingValues,
          min: sortedValues.length > 0 ? sortedValues[0] : null,
          median,
          mean,
          max:
            sortedValues.length > 0
              ? sortedValues[sortedValues.length - 1]
              : null,
        },
      }
    }).filter((item): item is NonNullable<typeof item> => item !== null)
  }, [filteredData, traitDomains])

  return {
    traitDetailedData,
    traitDistributionChartData,
  }
}
