import type {
  NormalizedINaturalistImage,
  SpeciesMetadata,
} from "@/components/dashboard/types"

export const normalizeSpeciesName = (value: unknown) => {
  if (typeof value !== "string") return ""
  return value.trim().toLowerCase()
}

const isPositiveUseValue = (value: unknown) => {
  if (value === null || value === undefined) return false
  if (typeof value === "number") return value > 0
  if (typeof value !== "string") return false

  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized === "." || normalized === "na") return false

  return normalized === "1" || normalized === "x" || normalized === "yes"
}

export const hasSpeciesUse = (
  metadata: SpeciesMetadata | undefined,
  filterId: string
) => {
  if (!metadata) return false

  const coelho = metadata.coelho_arboreal_uses ?? null
  const task5 = metadata.task5_use ?? null

  switch (filterId) {
    case "task5-food":
      return isPositiveUseValue(task5?.["Food"])
    case "task5-medicinal":
      return isPositiveUseValue(task5?.["Medicinal"])
    case "task5-raw-material":
      return isPositiveUseValue(task5?.["Raw material"])
    case "coelho-food":
      return isPositiveUseValue(coelho?.["Food"])
    case "coelho-medicine":
      return isPositiveUseValue(coelho?.["Medicine"])
    case "coelho-manufacture":
      return isPositiveUseValue(coelho?.["Manufacture"])
    case "coelho-construction":
      return isPositiveUseValue(coelho?.["Construction"])
    case "coelho-thatching":
      return isPositiveUseValue(coelho?.["Thatching"])
    case "coelho-firewood":
      return isPositiveUseValue(coelho?.["Firewood"])
    default:
      return false
  }
}

const normalizeInaturalistImages = (
  inaturalist: SpeciesMetadata["inaturalist"] | undefined
) => {
  const images: NormalizedINaturalistImage[] = []

  inaturalist?.images?.forEach((image) => {
    if (!image.thumb || !image.large) return

    images.push({
      thumbUrl: image.thumb,
      largeUrl: image.large,
      attribution: image.attribution,
      photographer: image.photographer,
      observationUrl: image.observation_url,
    })
  })

  const defaultPhoto = inaturalist?.taxon?.default_photo
  if (defaultPhoto) {
    const thumbUrl = defaultPhoto.square_url ?? defaultPhoto.url
    const largeUrl = defaultPhoto.medium_url ?? defaultPhoto.square_url

    if (thumbUrl && largeUrl) {
      images.push({
        thumbUrl,
        largeUrl,
        attribution: defaultPhoto.attribution,
        photographer: defaultPhoto.attribution_name,
        licenseCode: defaultPhoto.license_code,
      })
    }
  }

  const seen = new Set<string>()

  return images.filter((image) => {
    const key = `${image.largeUrl}|${image.observationUrl ?? ""}`
    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

export const mergeSpeciesMetadataIntoProps = (
  props: Record<string, unknown>,
  metadata: SpeciesMetadata | undefined
) => {
  if (!metadata) return props

  props["task5_use"] = metadata.task5_use ?? null
  props["coelho_arboreal_uses"] = metadata.coelho_arboreal_uses ?? null

  if (metadata.coelho_arboreal_uses) {
    const uses = metadata.coelho_arboreal_uses
    props["Food"] = uses["Food"]
    props["Medicine"] = uses["Medicine"]
    props["Manufacture"] = uses["Manufacture"]
    props["Construction"] = uses["Construction"]
    props["Thatching"] = uses["Thatching"]
    props["Firewood"] = uses["Firewood"]
  }

  if (metadata.gbif?.match) {
    const gbifMatch = metadata.gbif.match as Record<string, unknown>
    props["gbif_order"] = gbifMatch["order"] ?? null
    props["gbif_family"] = gbifMatch["family"] ?? null
  }

  const vernacular = metadata.gbif?.vernacular
  if (typeof vernacular === "string") {
    props["vernacular_name"] = vernacular
  } else if (vernacular && typeof vernacular === "object") {
    props["vernacular_name"] = vernacular.vernacularName ?? null
  }

  if (metadata.inaturalist?.taxon) {
    props["inaturalist_observations"] =
      metadata.inaturalist.taxon.observations_count ?? 0
  }

  const inaturalistGallery = normalizeInaturalistImages(metadata.inaturalist)
  props["inaturalist_images"] = inaturalistGallery.length
  props["inaturalist_image_gallery"] = inaturalistGallery

  return props
}
