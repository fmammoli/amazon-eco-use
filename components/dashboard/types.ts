export type INaturalistPhoto = {
  thumb?: string
  large?: string
  attribution?: string
  photographer?: string
  observation_url?: string
}

export type INaturalistDefaultPhoto = {
  attribution?: string
  attribution_name?: string
  square_url?: string
  medium_url?: string
  url?: string
  license_code?: string
}

export type NormalizedINaturalistImage = {
  thumbUrl: string
  largeUrl: string
  attribution?: string
  photographer?: string
  observationUrl?: string
  licenseCode?: string
}

export type SpeciesMetadata = {
  Species: string
  task5_use?: Record<string, unknown> | null
  coelho_arboreal_uses?: Record<string, unknown> | null
  gbif?: {
    match?: {
      order?: string
      family?: string
      vernacularName?: string
    }
    vernacular?:
      | string
      | {
          vernacularName?: string
        }
      | null
  }
  inaturalist?: {
    taxon?: {
      observations_count: number
      default_photo?: INaturalistDefaultPhoto | null
    }
    images?: INaturalistPhoto[]
  }
}

export type SpeciesUseFilter = {
  id: string
  label: string
}

export type SpeciesUseFilterGroup = {
  id: string
  label: string
  filters: SpeciesUseFilter[]
}

export type UseCategoryDetailRow = {
  tree_id: string | number
  species: string
  use_category: string
}

export type TraitDetailRow = {
  tree_id: string | number
  species: string
  value: number | null
}

export type TraitUseScatterPoint = {
  plant_id: string | number
  species_name: string
  use_category: string
  use_group: string
  trait_values: Record<string, number | null>
}

export type TraitUseScatterRow = {
  plant_id: string | number
  species_name: string
  x_trait: string
  x_value: number
  y_trait: string
  y_value: number
  use_category: string
  use_group: string
}
