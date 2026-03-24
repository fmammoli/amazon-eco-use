"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre"
import maplibregl from "maplibre-gl"
import { type LayerSpecification } from "maplibre-gl"

import { MapHoverPopup } from "@/components/dashboard/MapHoverPopup"
import {
  INITIAL_VIEW_STATE,
  MAP_INTERACTIVE_LAYER_IDS,
  MAP_STYLE_URL,
  PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
} from "@/components/dashboard/map-view/constants"
import {
  buildHighlightedNoUseFilter,
  buildHighlightedWithUseFilter,
  buildHoveredNoUseFilter,
  buildHoveredWithUseFilter,
  highlightNoUseLayer,
  highlightWithUseLayer,
  hoverNoUseLayer,
  hoverWithUseLayer,
  plantsNoUseLayer,
  plantsWithUseLayer,
  plotClusterCountLayer,
  plotClusterLayer,
  plotsFillLayer,
  plotsOutlineLayer,
  treeIdLabelLayer,
} from "@/components/dashboard/map-view/layers"
import { usePlotClusterData } from "@/components/dashboard/map-view/usePlotClusterData"
import { usePlotsData } from "@/components/dashboard/map-view/usePlotsData"
import { useDebouncedHover } from "@/components/dashboard/useDebouncedHover"
import { normalizeSpeciesName } from "@/components/dashboard/utils"

import "maplibre-gl/dist/maplibre-gl.css"

export function MapView({
  data,
  onFeatureClick,
  highlightedSpecies,
  selectedFeature,
  centerOnCoordinates,
  onClearCenteredHighlight,
}: {
  data: GeoJSON.FeatureCollection | null
  onFeatureClick?: (feature: GeoJSON.Feature) => void
  highlightedSpecies?: string | null
  selectedFeature?: GeoJSON.Feature | null
  centerOnCoordinates?: {
    coords: [number, number]
    plantId?: string | number
  } | null
  onClearCenteredHighlight?: () => void
}) {
  const mapRef = useRef<MapRef | null>(null)
  const plotsData = usePlotsData()
  const [hoveredPlantId, setHoveredPlantId] = useState<string | number | null>(
    null
  )
  const { hoverInfo, setHover, clearHover } = useDebouncedHover(20)

  const plotClusterData = usePlotClusterData({ data, plotsData })
  const plantsFeatureCount = data?.features.length ?? 0
  const plotClusterFeatureCount = plotClusterData?.features.length ?? 0

  useEffect(() => {
    if (!highlightedSpecies || !data) return

    const map = mapRef.current?.getMap()
    if (!map) return

    const targetSpecies = normalizeSpeciesName(highlightedSpecies)
    if (!targetSpecies) return

    const matchingCoords: Array<[number, number]> = data.features.flatMap(
      (feature) => {
        if (feature.geometry?.type !== "Point") return []

        const props = feature.properties as Record<string, unknown> | null
        const speciesRaw =
          (props?.["species_name"] as string | undefined) ??
          (props?.["Species"] as string | undefined)
        const species = normalizeSpeciesName(speciesRaw)

        if (!species || species !== targetSpecies) return []

        const [lng, lat] = feature.geometry.coordinates as [number, number]
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return []
        return [[lng, lat]]
      }
    )

    if (matchingCoords.length === 0) return

    if (matchingCoords.length === 1) {
      map.flyTo({
        center: matchingCoords[0],
        zoom: Math.max(map.getZoom(), 16),
        duration: 500,
        essential: true,
      })
      return
    }

    let minLng = Number.POSITIVE_INFINITY
    let minLat = Number.POSITIVE_INFINITY
    let maxLng = Number.NEGATIVE_INFINITY
    let maxLat = Number.NEGATIVE_INFINITY

    matchingCoords.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng)
      minLat = Math.min(minLat, lat)
      maxLng = Math.max(maxLng, lng)
      maxLat = Math.max(maxLat, lat)
    })

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 80,
        maxZoom: 16,
        duration: 500,
        essential: true,
      }
    )
  }, [data, highlightedSpecies])

  useEffect(() => {
    if (highlightedSpecies) return
    if (!selectedFeature || selectedFeature.geometry?.type !== "Point") return

    const map = mapRef.current?.getMap()
    if (!map) return

    const [lng, lat] = selectedFeature.geometry.coordinates as [number, number]
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return

    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 17),
      duration: 500,
      essential: true,
    })
  }, [selectedFeature, highlightedSpecies])

  useEffect(() => {
    if (!centerOnCoordinates) return

    const map = mapRef.current?.getMap()
    if (!map) return

    const [lng, lat] = centerOnCoordinates.coords
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return

    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 19),
      duration: 500,
      essential: true,
    })
  }, [centerOnCoordinates])

  const resetView = useCallback(() => {
    const map = mapRef.current?.getMap()
    map?.flyTo({
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      duration: 500,
      essential: true,
    })
  }, [])

  const setMapCursor = useCallback((cursor: string) => {
    const map = mapRef.current
    if (!map) return

    map.getCanvas().style.cursor = cursor
  }, [])

  const onMouseMove = useCallback(
    (evt: MapLayerMouseEvent) => {
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
          setMapCursor("pointer")
          setHover({
            feature,
            lngLat: [lngLat.lng, lngLat.lat],
          })
          return
        }

        const plantId =
          (props?.["plant_id"] as string | number | undefined) ?? feature.id

        if (
          centerOnCoordinates?.plantId != null &&
          plantId != null &&
          plantId !== centerOnCoordinates.plantId
        ) {
          onClearCenteredHighlight?.()
        }

        if (plantId != null) {
          setHoveredPlantId(plantId)
          setMapCursor("pointer")
        } else {
          setHoveredPlantId(null)
          setMapCursor("")
        }

        setHover({
          feature,
          lngLat: [lngLat.lng, lngLat.lat],
        })
        return
      }

      setHoveredPlantId(null)
      setMapCursor("")
      clearHover()
    },
    [
      centerOnCoordinates,
      clearHover,
      onClearCenteredHighlight,
      setHover,
      setMapCursor,
    ]
  )

  const onMouseLeave = useCallback(() => {
    setHoveredPlantId(null)
    setMapCursor("")
    clearHover()
  }, [clearHover, setMapCursor])

  const onMapClick = useCallback(
    (evt: MapLayerMouseEvent) => {
      const feature = evt.features?.[0]
      if (!feature) return

      const properties = feature.properties as Record<string, unknown> | null
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

      onFeatureClick?.(feature as GeoJSON.Feature)
    },
    [onFeatureClick]
  )

  const selectedPlantId = useMemo<string | number | null>(() => {
    if (centerOnCoordinates?.plantId != null) return centerOnCoordinates.plantId

    const props = selectedFeature?.properties as Record<string, unknown> | null
    const plantId =
      (props?.["plant_id"] as string | number | undefined) ??
      (selectedFeature?.id as string | number | undefined)

    return plantId ?? null
  }, [centerOnCoordinates?.plantId, selectedFeature])

  const hoveredWithUseFilter = useMemo(
    () =>
      hoveredPlantId != null ? buildHoveredWithUseFilter(hoveredPlantId) : null,
    [hoveredPlantId]
  )

  const hoveredNoUseFilter = useMemo(
    () =>
      hoveredPlantId != null ? buildHoveredNoUseFilter(hoveredPlantId) : null,
    [hoveredPlantId]
  )

  const selectedWithUseFilter = useMemo(
    () =>
      selectedPlantId != null
        ? buildHoveredWithUseFilter(selectedPlantId)
        : null,
    [selectedPlantId]
  )

  const selectedNoUseFilter = useMemo(
    () =>
      selectedPlantId != null ? buildHoveredNoUseFilter(selectedPlantId) : null,
    [selectedPlantId]
  )

  const highlightedWithUseFilter = useMemo(
    () =>
      highlightedSpecies != null
        ? buildHighlightedWithUseFilter(highlightedSpecies)
        : null,
    [highlightedSpecies]
  )

  const highlightedNoUseFilter = useMemo(
    () =>
      highlightedSpecies != null
        ? buildHighlightedNoUseFilter(highlightedSpecies)
        : null,
    [highlightedSpecies]
  )

  const hoveredWithUseOverlay = useMemo<LayerSpecification | null>(
    () =>
      hoveredWithUseFilter
        ? {
            ...hoverWithUseLayer,
            filter: hoveredWithUseFilter,
            minzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
          }
        : null,
    [hoveredWithUseFilter]
  )

  const hoveredNoUseOverlay = useMemo<LayerSpecification | null>(
    () =>
      hoveredNoUseFilter
        ? {
            ...hoverNoUseLayer,
            filter: hoveredNoUseFilter,
            minzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
          }
        : null,
    [hoveredNoUseFilter]
  )

  const highlightedWithUseOverlay = useMemo<LayerSpecification | null>(
    () =>
      highlightedWithUseFilter
        ? {
            ...highlightWithUseLayer,
            filter: highlightedWithUseFilter,
            minzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
          }
        : null,
    [highlightedWithUseFilter]
  )

  const highlightedNoUseOverlay = useMemo<LayerSpecification | null>(
    () =>
      highlightedNoUseFilter
        ? {
            ...highlightNoUseLayer,
            filter: highlightedNoUseFilter,
            minzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
          }
        : null,
    [highlightedNoUseFilter]
  )

  const selectedWithUseOverlay = useMemo<LayerSpecification | null>(
    () =>
      selectedWithUseFilter
        ? {
            ...hoverWithUseLayer,
            id: "plants-selected-with-use",
            filter: selectedWithUseFilter,
            minzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
          }
        : null,
    [selectedWithUseFilter]
  )

  const selectedNoUseOverlay = useMemo<LayerSpecification | null>(
    () =>
      selectedNoUseFilter
        ? {
            ...hoverNoUseLayer,
            id: "plants-selected-no-use",
            filter: selectedNoUseFilter,
            minzoom: PLOT_CLUSTER_VISIBLE_MAX_ZOOM,
          }
        : null,
    [selectedNoUseFilter]
  )

  return (
    <div className="relative h-[95svh] w-full rounded-md border border-border bg-muted">
      <Map
        ref={mapRef}
        reuseMaps
        mapLib={maplibregl}
        initialViewState={INITIAL_VIEW_STATE}
        interactiveLayerIds={MAP_INTERACTIVE_LAYER_IDS}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onMapClick}
        style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
        mapStyle={MAP_STYLE_URL}
      >
        {plotsData ? (
          <Source id="plots" type="geojson" data={plotsData}>
            <Layer {...plotsFillLayer} />
            <Layer {...plotsOutlineLayer} />
          </Source>
        ) : null}

        {data ? (
          <Source
            key={`plants-${plantsFeatureCount}`}
            id="plants"
            type="geojson"
            data={data}
          >
            <Layer {...plantsWithUseLayer} />
            <Layer {...plantsNoUseLayer} />
            <Layer {...treeIdLabelLayer} />
            {selectedWithUseOverlay ? (
              <Layer {...selectedWithUseOverlay} />
            ) : null}
            {selectedNoUseOverlay ? <Layer {...selectedNoUseOverlay} /> : null}
            {hoveredWithUseOverlay ? (
              <Layer {...hoveredWithUseOverlay} />
            ) : null}
            {hoveredNoUseOverlay ? <Layer {...hoveredNoUseOverlay} /> : null}
            {highlightedWithUseOverlay ? (
              <Layer {...highlightedWithUseOverlay} />
            ) : null}
            {highlightedNoUseOverlay ? (
              <Layer {...highlightedNoUseOverlay} />
            ) : null}
          </Source>
        ) : null}

        {plotClusterData ? (
          <Source
            key={`plot-clusters-${plotClusterFeatureCount}`}
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
          Go to AmazonFACE
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
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full border border-white bg-pink-500" />
              <span>Selected species (search)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 rounded-full border border-green-700 bg-green-500/50" />
              <span>Experimental plot limits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
