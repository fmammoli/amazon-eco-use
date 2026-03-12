"use client"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  CoelhoEthnobotanicalSection,
  Task5EthnobotanicalSection,
} from "@/components/dashboard/plant-details-drawer/EthnobotanicalSections"
import {
  ImageGallerySection,
  type INaturalistGalleryImage,
} from "@/components/dashboard/plant-details-drawer/ImageGallerySection"
import {
  KeyValueList,
  type KeyValueRow,
} from "@/components/dashboard/plant-details-drawer/KeyValueList"
import { SectionCard } from "@/components/dashboard/plant-details-drawer/SectionCard"

const coelhoUseFields = [
  { key: "Food", label: "Food", referenceKey: "Reference of food" },
  {
    key: "Medicine",
    label: "Medicine",
    referenceKey: "Reference of medicine",
  },
  {
    key: "Manufacture",
    label: "Manufacture",
    referenceKey: "Reference of manufacture",
  },
  {
    key: "Construction",
    label: "Construction",
    referenceKey: "Reference of construction",
  },
  {
    key: "Thatching",
    label: "Thatching",
    referenceKey: "Reference of thatching",
  },
  {
    key: "Firewood",
    label: "Firewood",
    referenceKey: "Reference of firewood",
  },
] as const

const task5CategoryFields = [
  { key: "Food", label: "Food" },
  { key: "Medicinal", label: "Medicinal" },
  { key: "Raw material", label: "Raw Material" },
] as const

const task5PlantPartKeys = [
  "Fruit body",
  "Leaves",
  "Bark",
  "Stem (trunck)",
  "Seeds",
  "Flowers",
  "Roots",
  "Latex/seiva/resin",
] as const

type UnknownRecord = Record<string, unknown>

const notNull = <T,>(value: T | null): value is T => value !== null

const hasAnyValues = (record: Record<string, unknown> | null) => {
  return Boolean(record && Object.values(record).some((value) => value != null))
}

export function PlantDetailsDrawer({
  open,
  onOpenChange,
  selectedFeature,
  onSelectFeature,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedFeature: GeoJSON.Feature | null
  onSelectFeature: (feature: GeoJSON.Feature | null) => void
}) {
  const selectedFeatureProps = (selectedFeature?.properties ??
    null) as UnknownRecord | null

  const hasContent = (value: unknown) => {
    if (value === null || value === undefined) return false

    if (typeof value === "string") {
      const normalized = value.trim()
      return (
        normalized !== "" &&
        normalized !== "." &&
        normalized !== "NA" &&
        normalized !== "NE"
      )
    }

    if (Array.isArray(value)) return value.length > 0

    return true
  }

  const formatUseFlag = (value: unknown) => {
    if (!hasContent(value)) return null
    if (value === 1 || value === "1") return "Yes"
    if (value === 0 || value === "0") return "No"

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()

      if (normalized === "x" || normalized === "yes") return "Yes"
      if (normalized === "no") return "No"

      return value.trim()
    }

    return String(value)
  }

  const formatReferenceSuffix = (value: unknown) => {
    return hasContent(value) ? ` (refs: ${String(value)})` : ""
  }

  const speciesInfo = selectedFeatureProps
    ? {
        species_name: selectedFeatureProps["species_name"] as
          | string
          | undefined,
        Specie: selectedFeatureProps["Specie"] as string | undefined,
        Genus: selectedFeatureProps["Genus"] as string | undefined,
        Species: selectedFeatureProps["Species"] as string | undefined,
        Family: selectedFeatureProps["Family"] as string | string[] | undefined,
      }
    : null

  const measurements = selectedFeatureProps
    ? {
        HEIGHT: selectedFeatureProps["HEIGHT"] as number | undefined,
        DBH_2022: selectedFeatureProps["DBH_2022"] as number | undefined,
      }
    : null

  const functionalTraits = selectedFeatureProps
    ? {
        CONT: selectedFeatureProps["CONT"] as number | undefined,
        DENS: selectedFeatureProps["DENS"] as number | undefined,
        ESP: selectedFeatureProps["ESP"] as number | undefined,
        GUARD: selectedFeatureProps["GUARD"] as number | undefined,
        VEIND: selectedFeatureProps["VEIND"] as number | undefined,
        SLA: selectedFeatureProps["SLA"] as number | undefined,
        SPAD: selectedFeatureProps["SPAD"] as number | undefined,
        SOIL_RESP: selectedFeatureProps["SOIL_RESP"] as
          | number
          | null
          | undefined,
      }
    : null

  const coelhoEthnobotanicalUses = selectedFeatureProps
    ? ((selectedFeatureProps["coelho_arboreal_uses"] as
        | UnknownRecord
        | null
        | undefined) ?? null)
    : null

  const task5EthnobotanicalUses = selectedFeatureProps
    ? ((selectedFeatureProps["task5_use"] as
        | UnknownRecord
        | null
        | undefined) ?? null)
    : null

  const gbifInfo = selectedFeatureProps
    ? {
        vernacular_name: selectedFeatureProps["vernacular_name"] as
          | string
          | undefined,
        gbif_order: selectedFeatureProps["gbif_order"] as string | undefined,
        gbif_family: selectedFeatureProps["gbif_family"] as string | undefined,
      }
    : null

  const inaturalistInfo = selectedFeatureProps
    ? {
        inaturalist_observations: selectedFeatureProps[
          "inaturalist_observations"
        ] as number | undefined,
        inaturalist_images: selectedFeatureProps["inaturalist_images"] as
          | number
          | undefined,
      }
    : null

  const inaturalistGallery = selectedFeatureProps
    ? (
        (selectedFeatureProps["inaturalist_image_gallery"] as
          | INaturalistGalleryImage[]
          | null
          | undefined) ?? []
      ).filter((image) => image.thumbUrl && image.largeUrl)
    : []

  const locationAndId = selectedFeatureProps
    ? {
        plant_id: selectedFeatureProps["plant_id"] as string | undefined,
        ID: selectedFeatureProps["ID"] as string | number | undefined,
        IND: selectedFeatureProps["IND"] as string | number | undefined,
        Plot: selectedFeatureProps["Plot"] as string | number | undefined,
        LAT: selectedFeatureProps["LAT"] as number | undefined,
        LON: selectedFeatureProps["LON"] as number | undefined,
      }
    : null

  const coelhoUseRows = coelhoEthnobotanicalUses
    ? coelhoUseFields
        .map(({ key, label, referenceKey }) => {
          const formattedValue = formatUseFlag(coelhoEthnobotanicalUses[key])
          if (!formattedValue) return null

          return {
            label,
            value: `${formattedValue}${formatReferenceSuffix(
              coelhoEthnobotanicalUses[referenceKey]
            )}`,
          }
        })
        .filter(notNull)
    : []

  const task5CategoryRows = task5EthnobotanicalUses
    ? task5CategoryFields
        .map(({ key, label }) => {
          const formattedValue = formatUseFlag(task5EthnobotanicalUses[key])
          if (!formattedValue) return null

          return { label, value: formattedValue }
        })
        .filter(notNull)
    : []

  const task5PlantParts = task5EthnobotanicalUses
    ? task5PlantPartKeys.filter((key) =>
        hasContent(task5EthnobotanicalUses[key])
      )
    : []
  const task5PlantPartRows: KeyValueRow[] = task5PlantParts.map((key) => ({
    label: key,
    value: String(task5EthnobotanicalUses![key] ?? "—"),
  }))
  const task5Reference = task5EthnobotanicalUses?.["References_x"]
  const task5Webpage = task5EthnobotanicalUses?.["Webpage"]
  const hasSpeciesMetadata = Boolean(
    coelhoEthnobotanicalUses ||
    task5EthnobotanicalUses ||
    hasAnyValues(gbifInfo) ||
    hasAnyValues(inaturalistInfo)
  )
  const shouldShowMissingMetadataNote = Boolean(
    speciesInfo?.species_name && !hasSpeciesMetadata
  )

  const speciesRows: KeyValueRow[] = [
    speciesInfo?.species_name
      ? { label: "Full Name", value: speciesInfo.species_name }
      : null,
    speciesInfo?.Genus ? { label: "Genus", value: speciesInfo.Genus } : null,
    speciesInfo?.Species
      ? { label: "Species", value: speciesInfo.Species }
      : null,
    speciesInfo?.Family
      ? {
          label: "Family",
          value: Array.isArray(speciesInfo.Family)
            ? speciesInfo.Family.join(", ")
            : speciesInfo.Family,
        }
      : null,
  ].filter(notNull)

  const measurementRows: KeyValueRow[] = [
    measurements?.HEIGHT != null
      ? { label: "Height (m)", value: measurements.HEIGHT.toFixed(2) }
      : null,
    measurements?.DBH_2022 != null
      ? { label: "DBH 2022 (mm)", value: measurements.DBH_2022 }
      : null,
  ].filter(notNull)

  const functionalTraitRows: KeyValueRow[] = [
    functionalTraits?.CONT != null
      ? { label: "CONT", value: functionalTraits.CONT.toFixed(2) }
      : null,
    functionalTraits?.DENS != null
      ? { label: "DENS", value: functionalTraits.DENS.toFixed(4) }
      : null,
    functionalTraits?.ESP != null
      ? { label: "ESP", value: functionalTraits.ESP.toFixed(3) }
      : null,
    functionalTraits?.GUARD != null
      ? { label: "GUARD", value: functionalTraits.GUARD.toFixed(2) }
      : null,
    functionalTraits?.VEIND != null
      ? { label: "VEIND", value: functionalTraits.VEIND.toFixed(2) }
      : null,
    functionalTraits?.SLA != null
      ? { label: "SLA", value: functionalTraits.SLA.toFixed(2) }
      : null,
    functionalTraits?.SPAD != null
      ? { label: "SPAD", value: functionalTraits.SPAD.toFixed(1) }
      : null,
    functionalTraits?.SOIL_RESP != null
      ? { label: "Soil Resp", value: functionalTraits.SOIL_RESP }
      : null,
  ].filter(notNull)

  const gbifRows: KeyValueRow[] = [
    gbifInfo?.vernacular_name
      ? { label: "Vernacular Name", value: gbifInfo.vernacular_name }
      : null,
    gbifInfo?.gbif_order
      ? { label: "Order", value: gbifInfo.gbif_order }
      : null,
    gbifInfo?.gbif_family
      ? { label: "GBIF Family", value: gbifInfo.gbif_family }
      : null,
  ].filter(notNull)

  const inaturalistRows: KeyValueRow[] = [
    inaturalistInfo?.inaturalist_observations != null
      ? {
          label: "Observations",
          value: inaturalistInfo.inaturalist_observations,
        }
      : null,
    inaturalistInfo?.inaturalist_images != null
      ? { label: "Images", value: inaturalistInfo.inaturalist_images }
      : null,
  ].filter(notNull)

  const locationRows: KeyValueRow[] = [
    locationAndId?.plant_id
      ? { label: "Plant ID", value: locationAndId.plant_id }
      : null,
    locationAndId?.ID != null ? { label: "ID", value: locationAndId.ID } : null,
    locationAndId?.IND != null
      ? { label: "IND", value: locationAndId.IND }
      : null,
    locationAndId?.Plot != null
      ? { label: "Plot", value: locationAndId.Plot }
      : null,
    locationAndId?.LAT != null
      ? { label: "Latitude", value: locationAndId.LAT.toFixed(6) }
      : null,
    locationAndId?.LON != null
      ? { label: "Longitude", value: locationAndId.LON.toFixed(6) }
      : null,
  ].filter(notNull)

  const fieldsToExclude = new Set([
    "species_name",
    "Specie",
    "Genus",
    "Species",
    "Family",
    "HEIGHT",
    "DBH_2022",
    "CONT",
    "DENS",
    "ESP",
    "GUARD",
    "VEIND",
    "SLA",
    "SPAD",
    "SOIL_RESP",
    "plant_id",
    "ID",
    "IND",
    "Plot",
    "LAT",
    "LON",
    "Food",
    "Medicine",
    "Manufacture",
    "Construction",
    "Thatching",
    "Firewood",
    "task5_use",
    "coelho_arboreal_uses",
    "vernacular_name",
    "gbif_order",
    "gbif_family",
    "inaturalist_observations",
    "inaturalist_images",
    "inaturalist_image_gallery",
  ])

  const otherPropertyRows: KeyValueRow[] = selectedFeatureProps
    ? Object.entries(selectedFeatureProps)
        .filter(([key]) => !fieldsToExclude.has(key))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({
          label: key,
          value:
            value === null || value === undefined
              ? "—"
              : typeof value === "object"
                ? JSON.stringify(value)
                : String(value),
          valueClassName: "truncate text-right",
        }))
    : []

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) onSelectFeature(null)
      }}
      direction="right"
    >
      <DrawerContent className="flex h-full max-h-screen flex-col overflow-hidden">
        <DrawerHeader className="shrink-0">
          <DrawerTitle>Plant details</DrawerTitle>
          <DrawerDescription>
            Click a point on the map to view its raw properties.
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {selectedFeatureProps ? (
            <div className="space-y-3">
              <SectionCard title="Geometry">
                <p className="text-xs text-muted-foreground">
                  {selectedFeature?.geometry?.type}
                  {selectedFeature?.geometry?.type === "Point" &&
                  Array.isArray(selectedFeature.geometry?.coordinates)
                    ? ` — [${selectedFeature.geometry?.coordinates?.join(", ")}]`
                    : null}
                </p>
              </SectionCard>

              {speciesRows.length > 0 ? (
                <SectionCard title="Species Information">
                  <KeyValueList rows={speciesRows} />
                </SectionCard>
              ) : null}

              {shouldShowMissingMetadataNote ? (
                <div className="rounded-md border border-dashed border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    No matching species metadata was found for this plant in the
                    species reference JSON.
                  </p>
                </div>
              ) : null}

              {measurementRows.length > 0 ? (
                <SectionCard title="Plant Measurements">
                  <KeyValueList rows={measurementRows} />
                </SectionCard>
              ) : null}

              {functionalTraitRows.length > 0 ? (
                <SectionCard title="Functional Traits">
                  <KeyValueList rows={functionalTraitRows} />
                </SectionCard>
              ) : null}

              <CoelhoEthnobotanicalSection rows={coelhoUseRows} />

              <Task5EthnobotanicalSection
                rows={task5CategoryRows}
                plantParts={task5PlantParts}
                reference={
                  hasContent(task5Reference)
                    ? String(task5Reference)
                    : undefined
                }
                webpage={
                  hasContent(task5Webpage) ? String(task5Webpage) : undefined
                }
              />

              {task5PlantPartRows.length > 0 ? (
                <SectionCard title="Plant Parts Used (Task 5)">
                  <KeyValueList rows={task5PlantPartRows} />
                </SectionCard>
              ) : null}

              {gbifRows.length > 0 ? (
                <SectionCard title="GBIF Information">
                  <KeyValueList rows={gbifRows} />
                </SectionCard>
              ) : null}

              {inaturalistRows.length > 0 ? (
                <SectionCard title="iNaturalist Information">
                  <KeyValueList rows={inaturalistRows} />
                </SectionCard>
              ) : null}

              <ImageGallerySection
                key={
                  locationAndId?.plant_id ??
                  speciesInfo?.species_name ??
                  "inaturalist-gallery"
                }
                images={inaturalistGallery}
              />

              {locationRows.length > 0 ? (
                <SectionCard title="Location & Identification">
                  <KeyValueList rows={locationRows} />
                </SectionCard>
              ) : null}

              {otherPropertyRows.length > 0 ? (
                <SectionCard title="Other Properties">
                  <KeyValueList rows={otherPropertyRows} />
                </SectionCard>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Click a point on the map to view details.
            </p>
          )}
        </div>

        <DrawerFooter className="shrink-0 border-t bg-background">
          <DrawerClose className="ml-auto rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50">
            Close
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
