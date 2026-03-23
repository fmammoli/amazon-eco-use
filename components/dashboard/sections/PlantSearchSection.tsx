"use client"

import { memo, useMemo, useState, useEffect, useRef } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { normalizeSpeciesName } from "@/components/dashboard/utils"
import type { SpeciesMetadata } from "@/components/dashboard/types"

type SpeciesSearchEntry = {
  id: string
  scientificName: string
  genus: string
  popularNames: string[]
  treeCount: number
  firstPlantId: string | number | null
}

type PlantSearchSectionProps = {
  data: GeoJSON.FeatureCollection | null
  speciesMetadataByName: Map<string, SpeciesMetadata>
  onPlantIdClick?: (plantId: string | number) => void
  onSpeciesSelect?: (scientificName: string | null) => void
}

const getPopularNames = (metadata: SpeciesMetadata | undefined) => {
  if (!metadata?.gbif) return []

  const names = new Set<string>()

  const matchName = metadata.gbif.match?.vernacularName
  if (typeof matchName === "string" && matchName.trim()) {
    names.add(matchName.trim())
  }

  const vernacular = metadata.gbif.vernacular
  if (typeof vernacular === "string" && vernacular.trim()) {
    names.add(vernacular.trim())
  } else if (vernacular && typeof vernacular === "object") {
    const nested = vernacular.vernacularName
    if (typeof nested === "string" && nested.trim()) {
      names.add(nested.trim())
    }
  }

  return Array.from(names)
}

export const PlantSearchSection = memo(function PlantSearchSection({
  data,
  speciesMetadataByName,
  onPlantIdClick,
  onSpeciesSelect,
}: PlantSearchSectionProps) {
  const [query, setQuery] = useState("")
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const lastProcessedIdRef = useRef<string | null>(null)

  const speciesEntries = useMemo<SpeciesSearchEntry[]>(() => {
    const features = data?.features ?? []
    const bySpecies = new Map<string, SpeciesSearchEntry>()

    features.forEach((feature, index) => {
      const props = feature.properties as Record<string, unknown> | null
      const scientificRaw =
        typeof props?.["species_name"] === "string"
          ? props["species_name"]
          : typeof props?.["Species"] === "string"
            ? props["Species"]
            : null

      if (!scientificRaw) return

      const scientificName = scientificRaw.trim()
      if (!scientificName) return

      const normalizedName = normalizeSpeciesName(scientificName)
      if (!normalizedName) return

      const genusFromProps =
        typeof props?.["Genus"] === "string" ? props["Genus"].trim() : ""
      const genusFromSpecies = scientificName.split(/\s+/)[0] ?? ""
      const genus = genusFromProps || genusFromSpecies || "Unknown"

      const plantId =
        (props?.["plant_id"] as string | number | undefined) ??
        feature.id ??
        index

      const existing = bySpecies.get(normalizedName)
      if (existing) {
        existing.treeCount += 1
        if (existing.firstPlantId == null && plantId != null) {
          existing.firstPlantId = plantId
        }
        return
      }

      const metadata = speciesMetadataByName.get(normalizedName)
      bySpecies.set(normalizedName, {
        id: normalizedName,
        scientificName,
        genus,
        popularNames: getPopularNames(metadata),
        treeCount: 1,
        firstPlantId: plantId ?? null,
      })
    })

    return Array.from(bySpecies.values()).sort((a, b) =>
      a.scientificName.localeCompare(b.scientificName)
    )
  }, [data?.features, speciesMetadataByName])

  // Build entry lookup map to avoid searching in effect
  const entriesMapRef = useRef<Map<string, SpeciesSearchEntry>>(new Map())
  useEffect(() => {
    entriesMapRef.current.clear()
    speciesEntries.forEach((entry) => {
      entriesMapRef.current.set(entry.id, entry)
    })
  }, [speciesEntries])

  // Handle selection when user picks an entry
  useEffect(() => {
    if (!selectedValue || selectedValue === lastProcessedIdRef.current) return

    const entry = entriesMapRef.current.get(selectedValue)
    if (!entry) return

    lastProcessedIdRef.current = selectedValue

    // Update query with selected species name
    setQuery(entry.scientificName)

    // Notify parent components of selection
    if (onSpeciesSelect) {
      onSpeciesSelect(entry.scientificName)
    }

    if (onPlantIdClick && entry.firstPlantId != null) {
      onPlantIdClick(entry.firstPlantId)
    }
  }, [selectedValue, onSpeciesSelect, onPlantIdClick])

  const clearSearch = () => {
    lastProcessedIdRef.current = null
    setSelectedValue(null)
    setQuery("")
    if (onSpeciesSelect) {
      onSpeciesSelect(null)
    }
  }

  const normalizedQuery = normalizeSpeciesName(query)

  const matchedEntries = useMemo(() => {
    if (!normalizedQuery) return []

    return speciesEntries.filter((entry) => {
      const popularNamesJoined = entry.popularNames.join(" ").toLowerCase()
      return (
        entry.scientificName.toLowerCase().includes(normalizedQuery) ||
        entry.genus.toLowerCase().includes(normalizedQuery) ||
        popularNamesJoined.includes(normalizedQuery)
      )
    })
  }, [normalizedQuery, speciesEntries])

  const handleSelectEntry = (entry: SpeciesSearchEntry) => {
    setSelectedValue(entry.id)
  }

  return (
    <section className="col-span-full lg:col-span-2">
      <Card className="border border-border bg-card/70 shadow-sm backdrop-blur-xl">
        <CardContent className="pt-1">
          <div className="mb-3 space-y-1">
            <p className="text-sm font-semibold">Plant Search</p>
            <p className="text-xs text-muted-foreground">
              Search by genus, scientific species name, or popular name.
            </p>
          </div>

          <Combobox
            value={selectedValue ?? ""}
            onValueChange={(value) => setSelectedValue(value || null)}
          >
            <ComboboxInput
              placeholder="Type genus, species, or popular name"
              value={query}
              onChange={(e) => {
                const nextQuery = e.target.value
                if (nextQuery === "") {
                  clearSearch()
                  return
                }

                setQuery(nextQuery)
              }}
              onClearClick={(e) => {
                e.preventDefault()
                clearSearch()
              }}
              showTrigger={false}
              showClear={query.length > 0}
            >
              <ComboboxContent>
                <ComboboxList>
                  {matchedEntries.length === 0 && query.length > 0 ? (
                    <ComboboxEmpty>No species found</ComboboxEmpty>
                  ) : (
                    matchedEntries.map((entry) => (
                      <ComboboxItem
                        key={entry.id}
                        value={entry.id}
                        onSelect={() => handleSelectEntry(entry)}
                      >
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">
                              {entry.scientificName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {entry.genus}
                              {entry.popularNames.length > 0
                                ? ` • ${entry.popularNames.join(", ")}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              {entry.treeCount} trees
                            </span>
                            {onPlantIdClick && entry.firstPlantId != null ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[11px]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectEntry(entry)
                                }}
                              >
                                View
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </ComboboxItem>
                    ))
                  )}
                </ComboboxList>
              </ComboboxContent>
            </ComboboxInput>
          </Combobox>
        </CardContent>
      </Card>
    </section>
  )
})
