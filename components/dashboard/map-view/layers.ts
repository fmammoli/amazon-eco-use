import { type FilterSpecification, type LayerSpecification } from "maplibre-gl"

import { PLOT_CLUSTER_VISIBLE_MAX_ZOOM } from "@/components/dashboard/map-view/constants"

export const plantsWithUseLayer: LayerSpecification = {
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
}

export const plantsNoUseLayer: LayerSpecification = {
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
}

export const treeIdLabelLayer: LayerSpecification = {
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
}

export const plotClusterLayer: LayerSpecification = {
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
}

export const plotClusterCountLayer: LayerSpecification = {
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
}

export const plotsFillLayer: LayerSpecification = {
  id: "plots-fill",
  source: "plots",
  type: "fill",
  paint: {
    "fill-color": "#22c55e",
    "fill-opacity": 0.12,
  },
}

export const plotsOutlineLayer: LayerSpecification = {
  id: "plots-outline",
  source: "plots",
  type: "line",
  paint: {
    "line-color": "#15803d",
    "line-width": 1.5,
  },
}

export const hoverWithUseLayer: LayerSpecification = {
  id: "plants-hover-with-use",
  source: "plants",
  type: "circle",
  paint: {
    "circle-radius": 8,
    "circle-color": "#f59e0b",
    "circle-stroke-color": "#fff",
    "circle-stroke-width": 1,
  },
}

export const hoverNoUseLayer: LayerSpecification = {
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
}

export const highlightWithUseLayer: LayerSpecification = {
  id: "plants-highlight-with-use",
  source: "plants",
  type: "circle",
  paint: {
    "circle-radius": 7,
    "circle-color": "#ec4899",
    "circle-stroke-color": "#fff",
    "circle-stroke-width": 2,
  },
}

export const highlightNoUseLayer: LayerSpecification = {
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
}

export const buildHoveredWithUseFilter = (
  hoveredPlantId: string | number
): FilterSpecification => [
  "all",
  ["==", ["get", "has_any_use"], 1],
  ["==", ["get", "plant_id"], hoveredPlantId],
]

export const buildHoveredNoUseFilter = (
  hoveredPlantId: string | number
): FilterSpecification => [
  "all",
  ["==", ["get", "has_any_use"], 0],
  ["==", ["get", "plant_id"], hoveredPlantId],
]

export const buildHighlightedWithUseFilter = (
  highlightedSpecies: string
): FilterSpecification => [
  "all",
  ["==", ["get", "has_any_use"], 1],
  ["==", ["get", "species_name"], highlightedSpecies],
]

export const buildHighlightedNoUseFilter = (
  highlightedSpecies: string
): FilterSpecification => [
  "all",
  ["==", ["get", "has_any_use"], 0],
  ["==", ["get", "species_name"], highlightedSpecies],
]
