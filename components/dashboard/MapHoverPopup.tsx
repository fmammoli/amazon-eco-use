"use client"

import { Popup } from "react-map-gl/maplibre"

export type HoverInfo = {
  feature: GeoJSON.Feature
  lngLat: [number, number]
}

export function MapHoverPopup({ hoverInfo }: { hoverInfo: HoverInfo | null }) {
  if (!hoverInfo) return null

  const properties = (hoverInfo.feature.properties ?? {}) as Record<
    string,
    unknown
  >

  const plantId = properties["plant_id"] ?? hoverInfo.feature.id ?? "-"
  const speciesName = properties["species_name"] ?? "-"
  const family = properties["Family"] ?? properties["gbif_family"] ?? "-"
  const height = properties["HEIGHT"] ?? "-"
  const dbh2022 = properties["DBH_2022"] ?? "-"

  const hoverRows = [
    { label: "Plant ID", value: plantId },
    { label: "Species Name", value: speciesName },
    { label: "Family", value: family },
    { label: "Height", value: height },
    { label: "DBH 2022", value: dbh2022 },
  ]

  return (
    <Popup
      longitude={hoverInfo.lngLat[0]}
      latitude={hoverInfo.lngLat[1]}
      closeButton={false}
      closeOnClick={false}
      anchor="bottom"
      offset={[0, -10]}
    >
      <div className="max-w-xs text-xs">
        <div className="font-semibold">Plant info</div>
        <div className="mt-1 space-y-0.5">
          {hoverRows.map((row) => (
            <div key={row.label} className="flex justify-between gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                {row.label}
              </span>
              <span className="text-right text-[11px]">
                {String(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Popup>
  )
}
