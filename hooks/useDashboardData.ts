"use client"

import { useEffect, useMemo, useState } from "react"

import {
  HISTOGRAM_TRAITS,
  TRAIT_HISTOGRAM_COLORS,
  allFilterIds,
  filters,
  speciesUseFilterGroups,
} from "@/components/dashboard/constants"
import {
  hasSpeciesUse,
  mergeSpeciesMetadataIntoProps,
  normalizeSpeciesName,
} from "@/components/dashboard/utils"
import type {
  SpeciesMetadata,
  TraitDetailRow,
  UseCategoryDetailRow,
} from "@/components/dashboard/types"

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
  }
}
