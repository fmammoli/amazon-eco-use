"use client"

import { forwardRef } from "react"
import { MapView } from "@/components/dashboard/MapView"

type MapSectionProps = {
  data: GeoJSON.FeatureCollection | null
  onFeatureClick: (feature: GeoJSON.Feature) => void
  highlightedSpecies?: string | null
  selectedFeature?: GeoJSON.Feature | null
  centerOnCoordinates?: {
    coords: [number, number]
    plantId?: string | number
  } | null
  onClearCenteredHighlight?: () => void
  mapFilterStats: {
    dataset: {
      trees: { total: number; withUse: number; withoutUse: number }
      species: { total: number; withUse: number; withoutUse: number }
    }
    selected: {
      trees: { total: number; withUse: number; withoutUse: number }
      species: { total: number; withUse: number; withoutUse: number }
    }
  }
}

export const MapSection = forwardRef<HTMLElement, MapSectionProps>(
  function MapSection(
    {
      data,
      onFeatureClick,
      highlightedSpecies,
      selectedFeature,
      centerOnCoordinates,
      onClearCenteredHighlight,
      mapFilterStats,
    },
    ref
  ) {
    return (
      <section
        ref={ref}
        className="row-span-1 rounded-lg border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl"
      >
        <header className="flex items-center justify-between gap-4">
          <div className="flex w-full items-baseline justify-between space-y-2">
            <h2 className="text-sm font-semibold">Map</h2>
            <div className="grid grid-cols-2 gap-8 text-[11px] text-muted-foreground">
              <p>
                Trees: {mapFilterStats.selected.trees.total} shown /{" "}
                {mapFilterStats.dataset.trees.total} total · Use:{" "}
                {mapFilterStats.selected.trees.withUse} · No use:{" "}
                {mapFilterStats.selected.trees.withoutUse}
              </p>
              <p>
                Species: {mapFilterStats.selected.species.total} shown /{" "}
                {mapFilterStats.dataset.species.total} total · Use:{" "}
                {mapFilterStats.selected.species.withUse} · No use:{" "}
                {mapFilterStats.selected.species.withoutUse}
              </p>
            </div>
          </div>
        </header>

        <MapView
          data={data}
          onFeatureClick={onFeatureClick}
          highlightedSpecies={highlightedSpecies}
          selectedFeature={selectedFeature}
          centerOnCoordinates={centerOnCoordinates}
          onClearCenteredHighlight={onClearCenteredHighlight}
        />
      </section>
    )
  }
)
