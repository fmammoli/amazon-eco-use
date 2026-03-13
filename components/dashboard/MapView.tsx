"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Map, {
  Layer,
  Marker,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre"
import maplibregl, {
  type LayerSpecification,
  type Marker as MapLibreMarker,
  type Popup as MapLibrePopup,
} from "maplibre-gl"

import { MapHoverPopup } from "@/components/dashboard/MapHoverPopup"
import { MapLayer } from "@/components/dashboard/MapLayer"
import { useDebouncedHover } from "@/components/dashboard/useDebouncedHover"

import "maplibre-gl/dist/maplibre-gl.css"

const INITIAL_VIEW_STATE = {
  longitude: -60.2078933,
  latitude: -2.5958648,
  zoom: 16,
}

export function MapView({
  data,
  onFeatureClick,
}: {
  data: GeoJSON.FeatureCollection | null
  onFeatureClick?: (feature: GeoJSON.Feature) => void
}) {
  const mapRef = useRef<MapRef | null>(null)
  const [initialMarker, setInitialMarker] = useState<MapLibreMarker | null>(
    null
  )
  const [hoveredPlantId, setHoveredPlantId] = useState<string | number | null>(
    null
  )
  const { hoverInfo, setHover, clearHover } = useDebouncedHover(20)

  const initialPopup = useMemo<MapLibrePopup | undefined>(() => {
    if (typeof document === "undefined") return undefined

    const popupContent = document.createElement("div")
    popupContent.className =
      "rounded-md border border-border bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur"
    popupContent.textContent = "AmazonFACE"

    return new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      closeOnMove: false,
      focusAfterOpen: false,
      anchor: "top",
      offset: 14,
      className: "amazonface-initial-popup",
    }).setDOMContent(popupContent)
  }, [])

  useEffect(() => {
    return () => {
      initialPopup?.remove()
    }
  }, [initialPopup])

  useEffect(() => {
    if (!initialMarker || !initialPopup) return

    if (initialMarker.getPopup() !== initialPopup) {
      initialMarker.setPopup(initialPopup)
    }

    const popup = initialMarker.getPopup()
    const frameId = requestAnimationFrame(() => {
      if (popup && !popup.isOpen()) {
        initialMarker.togglePopup()
      }
    })

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [initialMarker, initialPopup])

  const resetView = () => {
    const map = mapRef.current?.getMap()
    map?.flyTo({
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      duration: 500,
      essential: true,
    })
  }

  const circleLayer: LayerSpecification = useMemo(
    () => ({
      source: "plants",
      id: "plants-with-use",
      type: "circle",
      filter: ["==", ["get", "has_any_use"], 1],
      paint: {
        "circle-radius": 5,
        "circle-color": "#1d4ed8",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1,
      },
    }),
    []
  )

  const noUseLayer: LayerSpecification = useMemo(
    () => ({
      source: "plants",
      id: "plants-no-use",
      type: "symbol",
      filter: ["==", ["get", "has_any_use"], 0],
      layout: {
        "text-field": "◆",
        "text-size": 13,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#6ea6c4",
        "text-halo-color": "rgba(255,255,255,0.92)",
        "text-halo-width": 1,
      },
    }),
    []
  )

  return (
    <div className="relative mt-4 h-144 w-full rounded-md border border-border bg-muted pb-4">
      <Map
        ref={mapRef}
        reuseMaps
        mapLib={maplibregl}
        initialViewState={INITIAL_VIEW_STATE}
        interactiveLayerIds={["plants-with-use", "plants-no-use"]}
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
        <Layer {...noUseLayer} />
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
        <Marker
          ref={setInitialMarker}
          longitude={INITIAL_VIEW_STATE.longitude}
          latitude={INITIAL_VIEW_STATE.latitude}
          anchor="center"
          popup={initialPopup}
        >
          <div
            className="h-3 w-3 rounded-full border border-white bg-amber-400 shadow-[0_0_0_2px_rgba(0,0,0,0.25)]"
            aria-label="Initial map center"
            title="Initial view center"
          />
        </Marker>

        <MapHoverPopup hoverInfo={hoverInfo} />

        <NavigationControl
          position="top-right"
          showCompass={false}
          visualizePitch={false}
        />
      </Map>

      <div className="absolute top-24 right-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={resetView}
          className="cursor-pointer rounded-md border border-border bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur hover:bg-accent"
          aria-label="Reset map view"
          title="Return to initial view"
        >
          Reset Position
        </button>

        <div className="rounded-md border border-border bg-background/90 px-2 py-1.5 text-[10px] text-foreground shadow-sm backdrop-blur">
          <p className="mb-1 font-semibold text-muted-foreground">Legend</p>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-white bg-blue-700" />
              <span>Has use</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] leading-none text-[#6ea6c4]">◆</span>
              <span>No use</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
