"use client"

import { Layer, Source } from "react-map-gl/maplibre"
import type { LayerSpecification } from "maplibre-gl"

export function MapLayer({
  data,
  layer,
}: {
  data: GeoJSON.FeatureCollection | null
  layer: LayerSpecification
}) {
  if (!data) return null

  return (
    <Source id="plants" type="geojson" data={data}>
      <Layer {...layer} />
    </Source>
  )
}
