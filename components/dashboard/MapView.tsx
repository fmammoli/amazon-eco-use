"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapRef,
} from "react-map-gl/maplibre"
import maplibregl, { type LayerSpecification } from "maplibre-gl"

import { MapHoverPopup } from "@/components/dashboard/MapHoverPopup"
import { useDebouncedHover } from "@/components/dashboard/useDebouncedHover"

import "maplibre-gl/dist/maplibre-gl.css"

const INITIAL_VIEW_STATE = {
  longitude: -60.2078933,
  latitude: -2.5958648,
  zoom: 15,
}

const PLOT_CLUSTER_VISIBLE_MAX_ZOOM = 16

function isPointInLinearRing(point: [number, number], ring: number[][]) {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const current = ring[i]
    const previous = ring[j]
    if (!current || !previous) continue

    const xi = current[0]
    const yi = current[1]
    const xj = previous[0]
    const yj = previous[1]

    if (
      !Number.isFinite(xi) ||
      !Number.isFinite(yi) ||
      !Number.isFinite(xj) ||
      !Number.isFinite(yj)
    ) {
      continue
    }

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi

    if (intersects) inside = !inside
  }

  return inside
}

function isPointInPolygon(point: [number, number], rings: number[][][]) {
  if (rings.length === 0) return false
  if (!isPointInLinearRing(point, rings[0])) return false

  for (let i = 1; i < rings.length; i += 1) {
    if (isPointInLinearRing(point, rings[i])) {
      return false
    }
  }

  return true
}

function isPointInGeometry(
  point: [number, number],
  geometry: GeoJSON.Geometry | null | undefined
): boolean {
  if (!geometry) return false

  if (geometry.type === "Polygon") {
    return isPointInPolygon(point, geometry.coordinates as number[][][])
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as number[][][][]).some((polygon) =>
      isPointInPolygon(point, polygon)
    )
  }

  return false
}

function geometryBounds(geometry: GeoJSON.Geometry | null | undefined) {
  if (!geometry) return null

  const points: number[][] = []

  if (geometry.type === "Polygon") {
    ;(geometry.coordinates as number[][][]).forEach((ring) => {
      ring.forEach((coord) => points.push(coord))
    })
  } else if (geometry.type === "MultiPolygon") {
    ;(geometry.coordinates as number[][][][]).forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach((coord) => points.push(coord))
      })
    })
  } else {
    return null
  }

  if (points.length === 0) return null

  let minLng = Number.POSITIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLng = Number.NEGATIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  points.forEach(([lng, lat]) => {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
    minLng = Math.min(minLng, lng)
    minLat = Math.min(minLat, lat)
    maxLng = Math.max(maxLng, lng)
    maxLat = Math.max(maxLat, lat)
  })

  if (
    !Number.isFinite(minLng) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLng) ||
    !Number.isFinite(maxLat)
  ) {
    return null
  }

  return {
    minLng,
    minLat,
    maxLng,
    maxLat,
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2] as [number, number],
  }
}

export function MapView({
  data,
  onFeatureClick,
  highlightedSpecies,
}: {
  data: GeoJSON.FeatureCollection | null
  onFeatureClick?: (feature: GeoJSON.Feature) => void
  highlightedSpecies?: string | null
}) {
  const mapRef = useRef<MapRef | null>(null)
  const [plotsData, setPlotsData] = useState<GeoJSON.FeatureCollection | null>(
    null
  )
  const [hoveredPlantId, setHoveredPlantId] = useState<string | number | null>(
    null
  )
  const { hoverInfo, setHover, clearHover } = useDebouncedHover(20)

  useEffect(() => {
    const controller = new AbortController()

    const loadPlots = async () => {
      try {
        const response = await fetch("/data/plots.geojson", {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to load plots: ${response.status}`)
        }

        const geojson = (await response.json()) as GeoJSON.FeatureCollection
        setPlotsData(geojson)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        console.error("Unable to load plot polygons", error)
      }
    }

    loadPlots()

    return () => {
      controller.abort()
    }
  }, [])

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
      minzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
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
      minzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
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

  const treeIdLabelLayer: LayerSpecification = useMemo(
    () => ({
      source: "plants",
      id: "plants-id-labels",
      type: "symbol",
      minzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
      layout: {
        "text-field": ["to-string", ["coalesce", ["get", "ID"], "-"]],
        "text-size": 10,
        "text-offset": [0.9, 0],
        "text-anchor": "left",
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#111827",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1,
      },
    }),
    []
  )

  const plotClusterLayer: LayerSpecification = useMemo(
    () => ({
      id: "plot-clusters",
      source: "plot-clusters-source",
      type: "circle",
      maxzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#0ea5e9",
          12,
          "#0284c7",
          30,
          "#0369a1",
        ],
        "circle-radius": ["step", ["get", "point_count"], 16, 12, 20, 30, 24],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    }),
    []
  )

  const plotClusterCountLayer: LayerSpecification = useMemo(
    () => ({
      id: "plot-cluster-count",
      source: "plot-clusters-source",
      type: "symbol",
      maxzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": ["step", ["get", "point_count"], 11, 12, 12, 30, 13],
        "text-font": ["Open Sans Bold"],
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(3, 105, 161, 0.6)",
        "text-halo-width": 1,
      },
    }),
    []
  )

  const plotClusterData = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!data || !plotsData) return null

    const points = data.features.filter(
      (feature) => feature.geometry?.type === "Point"
    )

    const features: GeoJSON.Feature[] = []

    plotsData.features.forEach((plotFeature, index) => {
      const bounds = geometryBounds(plotFeature.geometry)
      if (!bounds) return

      const count = points.reduce((acc, feature) => {
        const geometry = feature.geometry
        if (!geometry || geometry.type !== "Point") return acc

        const point = geometry.coordinates as [number, number]
        return isPointInGeometry(point, plotFeature.geometry) ? acc + 1 : acc
      }, 0)

      if (count === 0) return

      const plotProperties =
        (plotFeature.properties as Record<string, unknown> | null) ?? {}

      features.push({
        type: "Feature",
        id: `plot-cluster-${plotFeature.id ?? index}`,
        geometry: {
          type: "Point",
          coordinates: bounds.center,
        },
        properties: {
          is_plot_cluster: 1,
          plot_id: plotProperties["id"] ?? plotFeature.id ?? index,
          point_count: count,
          point_count_abbreviated: String(count),
          min_lng: bounds.minLng,
          min_lat: bounds.minLat,
          max_lng: bounds.maxLng,
          max_lat: bounds.maxLat,
        },
      })
    })

    return {
      type: "FeatureCollection",
      features,
    }
  }, [data, plotsData])

  const plotsFillLayer: LayerSpecification = useMemo(
    () => ({
      id: "plots-fill",
      source: "plots",
      type: "fill",
      paint: {
        "fill-color": "#22c55e",
        "fill-opacity": 0.12,
      },
    }),
    []
  )

  const plotsOutlineLayer: LayerSpecification = useMemo(
    () => ({
      id: "plots-outline",
      source: "plots",
      type: "line",
      paint: {
        "line-color": "#15803d",
        "line-width": 1.5,
      },
    }),
    []
  )

  const hoverWithUseLayer: LayerSpecification = useMemo(
    () => ({
      id: "plants-hover-with-use",
      source: "plants",
      type: "circle",
      paint: {
        "circle-radius": 8,
        "circle-color": "#f59e0b",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1,
      },
    }),
    []
  )

  const hoverNoUseLayer: LayerSpecification = useMemo(
    () => ({
      id: "plants-hover-no-use",
      source: "plants",
      type: "symbol",
      layout: {
        "text-field": "◆",
        "text-size": 16,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#f59e0b",
        "text-halo-color": "rgba(255,255,255,0.96)",
        "text-halo-width": 1.2,
      },
    }),
    []
  )

  const highlightWithUseLayer: LayerSpecification = useMemo(
    () => ({
      id: "plants-highlight-with-use",
      source: "plants",
      type: "circle",
      paint: {
        "circle-radius": 7,
        "circle-color": "#ec4899",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 2,
      },
    }),
    []
  )

  const highlightNoUseLayer: LayerSpecification = useMemo(
    () => ({
      id: "plants-highlight-no-use",
      source: "plants",
      type: "symbol",
      layout: {
        "text-field": "◆",
        "text-size": 17,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ec4899",
        "text-halo-color": "rgba(255,255,255,0.96)",
        "text-halo-width": 1.5,
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
        interactiveLayerIds={[
          "plot-clusters",
          "plants-with-use",
          "plants-no-use",
        ]}
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
            const isPlotCluster = Boolean(props?.["is_plot_cluster"])

            if (isPlotCluster) {
              setHoveredPlantId(null)
              if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = "pointer"
              }
              clearHover()
              return
            }

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

          if (!feature) return

          const properties = feature.properties as Record<
            string,
            unknown
          > | null
          const isPlotCluster = Boolean(properties?.["is_plot_cluster"])

          if (isPlotCluster) {
            const map = mapRef.current?.getMap()
            if (!map) return

            const minLng = properties?.["min_lng"]
            const minLat = properties?.["min_lat"]
            const maxLng = properties?.["max_lng"]
            const maxLat = properties?.["max_lat"]

            if (
              typeof minLng === "number" &&
              typeof minLat === "number" &&
              typeof maxLng === "number" &&
              typeof maxLat === "number"
            ) {
              map.fitBounds(
                [
                  [minLng, minLat],
                  [maxLng, maxLat],
                ],
                {
                  padding: 60,
                  duration: 350,
                  essential: true,
                }
              )
            }

            return
          }

          if (onFeatureClick) {
            onFeatureClick(feature as GeoJSON.Feature)
          }
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://api.maptiler.com/maps/hybrid/style.json?key=TiPo36Cyzyhe2DoDnrm8"
      >
        {plotsData ? (
          <Source id="plots" type="geojson" data={plotsData}>
            <Layer {...plotsFillLayer} />
            <Layer {...plotsOutlineLayer} />
          </Source>
        ) : null}

        {data ? (
          <Source id="plants" type="geojson" data={data}>
            <Layer {...circleLayer} />
            <Layer {...noUseLayer} />
            <Layer {...treeIdLabelLayer} />
            {hoveredPlantId != null ? (
              <Layer
                {...hoverWithUseLayer}
                filter={[
                  "all",
                  ["==", ["get", "has_any_use"], 1],
                  ["==", ["get", "plant_id"], hoveredPlantId],
                ]}
                minzoom={PLOT_CLUSTER_VISIBLE_MAX_ZOOM}
              />
            ) : null}
            {hoveredPlantId != null ? (
              <Layer
                {...hoverNoUseLayer}
                filter={[
                  "all",
                  ["==", ["get", "has_any_use"], 0],
                  ["==", ["get", "plant_id"], hoveredPlantId],
                ]}
                minzoom={PLOT_CLUSTER_VISIBLE_MAX_ZOOM}
              />
            ) : null}
            {highlightedSpecies != null ? (
              <Layer
                {...highlightWithUseLayer}
                filter={[
                  "all",
                  ["==", ["get", "has_any_use"], 1],
                  ["==", ["get", "species_name"], highlightedSpecies],
                ]}
                minzoom={PLOT_CLUSTER_VISIBLE_MAX_ZOOM}
              />
            ) : null}
            {highlightedSpecies != null ? (
              <Layer
                {...highlightNoUseLayer}
                filter={[
                  "all",
                  ["==", ["get", "has_any_use"], 0],
                  ["==", ["get", "species_name"], highlightedSpecies],
                ]}
                minzoom={PLOT_CLUSTER_VISIBLE_MAX_ZOOM}
              />
            ) : null}
          </Source>
        ) : null}

        {plotClusterData ? (
          <Source
            id="plot-clusters-source"
            type="geojson"
            data={plotClusterData}
          >
            <Layer {...plotClusterLayer} />
            <Layer {...plotClusterCountLayer} />
          </Source>
        ) : null}

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
