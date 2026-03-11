"use client"

import { useEffect, useMemo, useState } from "react"

import { FilterPanel } from "@/components/dashboard/FilterPanel"
import { MapView } from "@/components/dashboard/MapView"
import { PlantDetailsDrawer } from "@/components/dashboard/PlantDetailsDrawer"

type INaturalistPhoto = {
  thumb?: string
  large?: string
  attribution?: string
  photographer?: string
  observation_url?: string
}

type INaturalistDefaultPhoto = {
  attribution?: string
  attribution_name?: string
  square_url?: string
  medium_url?: string
  url?: string
  license_code?: string
}

type NormalizedINaturalistImage = {
  thumbUrl: string
  largeUrl: string
  attribution?: string
  photographer?: string
  observationUrl?: string
  licenseCode?: string
}

type SpeciesMetadata = {
  Species: string
  task5_use?: Record<string, unknown> | null
  coelho_arboreal_uses?: Record<string, unknown> | null
  gbif?: {
    match?: {
      order?: string
      family?: string
      vernacularName?: string
    }
    vernacular?:
      | string
      | {
          vernacularName?: string
        }
      | null
  }
  inaturalist?: {
    taxon?: {
      observations_count: number
      default_photo?: INaturalistDefaultPhoto | null
    }
    images?: INaturalistPhoto[]
  }
}

const normalizeSpeciesName = (value: string) => value.trim().toLowerCase()

const normalizeInaturalistImages = (
  inaturalist: SpeciesMetadata["inaturalist"] | undefined
) => {
  const images: NormalizedINaturalistImage[] = []

  inaturalist?.images?.forEach((image) => {
    if (!image.thumb || !image.large) return

    images.push({
      thumbUrl: image.thumb,
      largeUrl: image.large,
      attribution: image.attribution,
      photographer: image.photographer,
      observationUrl: image.observation_url,
    })
  })

  const defaultPhoto = inaturalist?.taxon?.default_photo
  if (defaultPhoto) {
    const thumbUrl = defaultPhoto.square_url ?? defaultPhoto.url
    const largeUrl = defaultPhoto.medium_url ?? defaultPhoto.square_url

    if (thumbUrl && largeUrl) {
      images.push({
        thumbUrl,
        largeUrl,
        attribution: defaultPhoto.attribution,
        photographer: defaultPhoto.attribution_name,
        licenseCode: defaultPhoto.license_code,
      })
    }
  }

  const seen = new Set<string>()

  return images.filter((image) => {
    const key = `${image.largeUrl}|${image.observationUrl ?? ""}`
    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

const mergeSpeciesMetadataIntoProps = (
  props: Record<string, unknown>,
  metadata: SpeciesMetadata | undefined
) => {
  if (!metadata) return props

  props["task5_use"] = metadata.task5_use ?? null
  props["coelho_arboreal_uses"] = metadata.coelho_arboreal_uses ?? null

  if (metadata.coelho_arboreal_uses) {
    const uses = metadata.coelho_arboreal_uses
    props["Food"] = uses["Food"]
    props["Medicine"] = uses["Medicine"]
    props["Manufacture"] = uses["Manufacture"]
    props["Construction"] = uses["Construction"]
    props["Thatching"] = uses["Thatching"]
    props["Firewood"] = uses["Firewood"]
  }

  if (metadata.gbif?.match) {
    const gbifMatch = metadata.gbif.match as Record<string, unknown>
    props["gbif_order"] = gbifMatch["order"] ?? null
    props["gbif_family"] = gbifMatch["family"] ?? null
  }

  const vernacular = metadata.gbif?.vernacular
  if (typeof vernacular === "string") {
    props["vernacular_name"] = vernacular
  } else if (vernacular && typeof vernacular === "object") {
    props["vernacular_name"] = vernacular.vernacularName ?? null
  }

  if (metadata.inaturalist?.taxon) {
    props["inaturalist_observations"] =
      metadata.inaturalist.taxon.observations_count ?? 0
  }

  const inaturalistGallery = normalizeInaturalistImages(metadata.inaturalist)
  props["inaturalist_images"] = inaturalistGallery.length
  props["inaturalist_image_gallery"] = inaturalistGallery

  return props
}

const filters = [
  { id: "all", label: "All locations" },
  { id: "recent", label: "Recent" },
  { id: "top", label: "Top rated" },
]

export function Dashboard() {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null)
  const [speciesMetadataByName, setSpeciesMetadataByName] = useState<
    Map<string, SpeciesMetadata>
  >(new Map())
  const [traitFilters, setTraitFilters] = useState<
    Array<{ id: string; trait: string; range: [number, number] }>
  >([])
  const [includeMissing, setIncludeMissing] = useState(true)
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
    const speciesMetadata = speciesName
      ? speciesMetadataByName.get(normalizeSpeciesName(speciesName))
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

  useEffect(() => {
    let canceled = false

    const load = async () => {
      try {
        // Load GeoJSON data
        const geoRes = await fetch(
          "/data/final_AmzFACE_merged_by_coords.with_ids.geojson"
        )
        if (!geoRes.ok) throw new Error("Failed to load geojson")
        const geoData = (await geoRes.json()) as GeoJSON.FeatureCollection

        // Load species metadata
        const speciesRes = await fetch(
          "/data/final_data_species_with_gbif_inaturalist copy.json"
        )
        if (!speciesRes.ok) throw new Error("Failed to load species metadata")
        const speciesMetadata = (await speciesRes.json()) as SpeciesMetadata[]

        // Create lookup map by species name
        const speciesMap = new Map(
          speciesMetadata.map((sp) => [normalizeSpeciesName(sp.Species), sp])
        )

        // Keep the map source as tree-level GeoJSON only.
        // Species metadata is joined later for the clicked feature drawer.
        geoData.features.forEach((feature) => {
          const props = (feature.properties ?? {}) as Record<string, unknown>

          const plantId = props?.["plant_id"] as string | number | undefined
          if (plantId != null) {
            // Use the stable plant_id as the GeoJSON feature id.
            // MapLibre uses feature.id for feature-state (hover) updates.
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
        // count missing for all filters if properties are absent
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
    if (traitFilters.length === 0) return geojson

    const filteredFeatures = geojson.features.filter((feature) => {
      const props = feature.properties as Record<string, unknown> | null
      if (!props) return includeMissing

      return traitFilters.every((filter) => {
        const value = props[filter.trait]

        // If the value is missing or not a number, keep the feature when missing values are included.
        // When missing values are excluded, drop features missing the trait.
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
  }, [geojson, traitFilters, includeMissing])

  return (
    <>
      <PlantDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedFeature={selectedFeature}
        onSelectFeature={setSelectedFeature}
      />

      <main className="min-h-screen bg-background px-4 py-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[280px_1fr] lg:grid-rows-[auto_1fr]">
          <FilterPanel
            filters={filters}
            selectedFilter={selectedFilter}
            activeFilterLabel={activeFilterLabel}
            onSelectFilter={setSelectedFilter}
            numericTraits={numericTraits}
            traitDomains={traitDomains}
            traitFilters={traitFilters}
            onAddTraitFilter={() => {
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
            }}
            onUpdateTraitFilter={(id, updater) => {
              setTraitFilters((prev) =>
                prev.map((filter) =>
                  filter.id === id ? { ...filter, ...updater } : filter
                )
              )
            }}
            onRemoveTraitFilter={(id) => {
              setTraitFilters((prev) =>
                prev.filter((filter) => filter.id !== id)
              )
            }}
            includeMissing={includeMissing}
            missingValueCounts={missingValueCounts}
            onToggleIncludeMissing={() => setIncludeMissing((prev) => !prev)}
            onReset={() => {
              setSelectedFilter("all")
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
            }}
          />

          <section className="row-span-1 rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl">
            <header className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">Map</h2>
                <p className="text-xs text-muted-foreground">
                  Showing {activeFilterLabel.toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">Zoom</span>
                <span className="rounded-full bg-muted px-2 py-0.5">
                  Layers
                </span>
              </div>
            </header>

            <MapView data={filteredData} onFeatureClick={handleFeatureClick} />
          </section>

          <section className="col-span-full rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">Charts</h2>
                <p className="text-xs text-muted-foreground">
                  Quick analytics based on the selected filter.
                </p>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">Daily</span>
                <span className="rounded-full bg-muted px-2 py-0.5">
                  Weekly
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-40 rounded-md border border-border bg-linear-to-br from-muted/40 to-muted-foreground/10" />
              <div className="h-40 rounded-md border border-border bg-linear-to-br from-muted/40 to-muted-foreground/10" />
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
