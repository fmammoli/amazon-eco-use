export const INITIAL_VIEW_STATE = {
  longitude: -60.2078933,
  latitude: -2.5958648,
  zoom: 15,
} as const

export const PLOT_CLUSTER_VISIBLE_MAX_ZOOM = 16

export const MAP_STYLE_URL =
  "https://api.maptiler.com/maps/hybrid/style.json?key=TiPo36Cyzyhe2DoDnrm8"

export const MAP_INTERACTIVE_LAYER_IDS = [
  "plot-clusters",
  "plants-with-use",
  "plants-no-use",
]
