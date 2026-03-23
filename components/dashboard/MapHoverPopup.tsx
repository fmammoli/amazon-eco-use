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

  const parseUseLabels = (value: unknown) => {
    if (typeof value !== "string") return [] as string[]

    return value
      .split("||")
      .map((label) => label.trim())
      .filter(Boolean)
  }

  const treeId = properties["ID"] ?? "-"
  const plantId = properties["plant_id"] ?? hoverInfo.feature.id ?? "-"
  const speciesName = properties["species_name"] ?? "-"
  const family = properties["Family"] ?? properties["gbif_family"] ?? "-"
  const height = properties["HEIGHT"] ?? "-"
  const dbh2022 = properties["DBH_2022"] ?? "-"
  const task5Uses = parseUseLabels(properties["task5_use_labels"])
  const coelhoUses = parseUseLabels(properties["coelho_arboreal_use_labels"])

  const hoverRows = [
    { label: "ID", value: treeId },
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
          <div className="flex justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Task 5 Uses
            </span>
            <div className="max-w-44 text-right text-[11px]">
              {task5Uses.length > 1 ? (
                <ul className="list-inside list-disc space-y-0.5 text-left">
                  {task5Uses.map((use) => (
                    <li key={use}>{use}</li>
                  ))}
                </ul>
              ) : (
                <span>{task5Uses[0] ?? "-"}</span>
              )}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Coelho Uses
            </span>
            <div className="max-w-44 text-right text-[11px]">
              {coelhoUses.length > 1 ? (
                <ul className="list-inside list-disc space-y-0.5 text-left">
                  {coelhoUses.map((use) => (
                    <li key={use}>{use}</li>
                  ))}
                </ul>
              ) : (
                <span>{coelhoUses[0] ?? "-"}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Popup>
  )
}
