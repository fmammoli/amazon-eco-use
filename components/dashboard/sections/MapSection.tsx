"use client"

import { memo } from "react"
import { MapView } from "@/components/dashboard/MapView"

type MapSectionProps = {
  activeFilterLabel: string
  data: GeoJSON.FeatureCollection | null
  onFeatureClick: (feature: GeoJSON.Feature) => void
  highlightedSpecies?: string | null
}

export const MapSection = memo(function MapSection({
  activeFilterLabel,
  data,
  onFeatureClick,
  highlightedSpecies,
}: MapSectionProps) {
  return (
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
          <span className="rounded-full bg-muted px-2 py-0.5">Layers</span>
        </div>
      </header>

      <MapView
        data={data}
        onFeatureClick={onFeatureClick}
        highlightedSpecies={highlightedSpecies}
      />
    </section>
  )
})
