"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { FilterPanel } from "@/components/dashboard/FilterPanel"
import { MapView } from "@/components/dashboard/MapView"

const filters = [
  { id: "all", label: "All locations" },
  { id: "recent", label: "Recent" },
  { id: "top", label: "Top rated" },
]

export function Dashboard() {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null)
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

  const handleFeatureClick = (feature: GeoJSON.Feature) => {
    setSelectedFeature(feature)
    setDrawerOpen(true)
  }

  useEffect(() => {
    let canceled = false

    const load = async () => {
      try {
        const res = await fetch(
          "/data/final_AmzFACE_merged_by_coords.with_ids.geojson"
        )
        if (!res.ok) throw new Error("Failed to load geojson")
        const data = (await res.json()) as GeoJSON.FeatureCollection
        // Ensure each feature has a stable id so MapLibre feature-state can highlight it.
        // We prefer the `plant_id` property when available (stable across re-generations).
        data.features.forEach((feature) => {
          const props = feature.properties as Record<string, unknown> | null
          const plantId = props?.["plant_id"] as string | number | undefined
          if (plantId != null) {
            // Use the stable plant_id as the GeoJSON feature id.
            // MapLibre uses feature.id for feature-state (hover) updates.
            feature.id = plantId
          }
        })
        if (!canceled) setGeojson(data)
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

  const selectedFeatureProps = (selectedFeature?.properties ?? null) as Record<
    string,
    unknown
  > | null

  return (
    <>
      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) setSelectedFeature(null)
        }}
        direction="right"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Plant details</DrawerTitle>
            <DrawerDescription>
              Click a point on the map to view its raw properties.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4">
            {selectedFeatureProps ? (
              <div className="space-y-3">
                <div className="rounded-md border border-border bg-background p-3">
                  <h3 className="text-xs font-semibold">Geometry</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedFeature?.geometry?.type}
                    {selectedFeature?.geometry?.type === "Point" &&
                    Array.isArray(selectedFeature.geometry?.coordinates)
                      ? ` — [${selectedFeature.geometry?.coordinates?.join(", ")}]`
                      : null}
                  </p>
                </div>

                <div className="rounded-md border border-border bg-background p-3">
                  <h3 className="text-xs font-semibold">Properties</h3>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {Object.entries(selectedFeatureProps)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium text-foreground">
                            {key}
                          </span>
                          <span className="truncate text-right">
                            {value === null || value === undefined
                              ? "—"
                              : typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click a point on the map to view details.
              </p>
            )}
          </div>

          <DrawerFooter>
            <DrawerClose className="ml-auto rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50">
              Close
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
