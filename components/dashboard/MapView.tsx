"use client"

import { useMemo, useRef, useState } from "react"
import Map, { Layer, type MapRef } from "react-map-gl/maplibre"
import maplibregl, { type LayerSpecification } from "maplibre-gl"

import { MapHoverPopup } from "@/components/dashboard/MapHoverPopup"
import { MapLayer } from "@/components/dashboard/MapLayer"
import { useDebouncedHover } from "@/components/dashboard/useDebouncedHover"

import "maplibre-gl/dist/maplibre-gl.css"

export function MapView({
  data,
  onFeatureClick,
}: {
  data: GeoJSON.FeatureCollection | null
  onFeatureClick?: (feature: GeoJSON.Feature) => void
}) {
  const mapRef = useRef<MapRef | null>(null)
  const [hoveredPlantId, setHoveredPlantId] = useState<string | number | null>(
    null
  )
  const { hoverInfo, setHover, clearHover } = useDebouncedHover(50)

  const circleLayer: LayerSpecification = useMemo(
    () => ({
      source: "plants",
      id: "plants",
      type: "circle",
      paint: {
        "circle-radius": 5,
        "circle-color": "#1d4ed8",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1,
      },
    }),
    []
  )

  return (
    <div className="mt-4 h-144 w-full rounded-md border border-border bg-muted pb-4">
      <Map
        ref={mapRef}
        reuseMaps
        mapLib={maplibregl}
        initialViewState={{
          longitude: -60.2078933,
          latitude: -2.5951648,
          zoom: 20,
        }}
        interactiveLayerIds={["plants"]}
        onMouseMove={(evt) => {
          const feature = evt.features?.[0]
          const lngLat = evt.lngLat

          if (
            feature &&
            lngLat &&
            Number.isFinite(lngLat.lng) &&
            Number.isFinite(lngLat.lat)
          ) {
            const props = feature.properties as Record<string, unknown> | null
            const plantId =
              (props?.["plant_id"] as string | number | undefined) ?? feature.id

            if (plantId != null) {
              setHoveredPlantId(plantId)
              if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = "pointer"
              }
            } else {
              setHoveredPlantId(null)
              if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = ""
              }
            }

            setHover({
              feature,
              lngLat: [lngLat.lng, lngLat.lat],
            })
          } else {
            setHoveredPlantId(null)
            if (mapRef.current) {
              mapRef.current.getCanvas().style.cursor = ""
            }
            clearHover()
          }
        }}
        onMouseLeave={() => {
          setHoveredPlantId(null)
          const map = mapRef.current
          if (map) {
            map.getCanvas().style.cursor = ""
          }
          clearHover()
        }}
        onClick={(evt) => {
          const feature = evt.features?.[0]
          if (feature && onFeatureClick) {
            onFeatureClick(feature as GeoJSON.Feature)
          }
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://api.maptiler.com/maps/hybrid/style.json?key=TiPo36Cyzyhe2DoDnrm8"
      >
        <MapLayer data={data} layer={circleLayer} />
        {hoveredPlantId != null ? (
          <Layer
            id="plants-hover"
            source="plants"
            type="circle"
            filter={["==", ["get", "plant_id"], hoveredPlantId]}
            paint={{
              "circle-radius": 8,
              "circle-color": "#f59e0b",
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
            }}
          />
        ) : null}
        <MapHoverPopup hoverInfo={hoverInfo} />
      </Map>
    </div>
  )
}
