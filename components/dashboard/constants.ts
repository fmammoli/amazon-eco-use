import type { SpeciesUseFilterGroup } from "@/components/dashboard/types"

export const speciesUseFilterGroups: SpeciesUseFilterGroup[] = [
  {
    id: "task5",
    label: "Tristão and Canova (2025)",
    filters: [
      { id: "task5-food", label: "Food" },
      { id: "task5-medicinal", label: "Medicinal" },
      { id: "task5-raw-material", label: "Raw Material" },
    ],
  },
  {
    id: "coelho",
    label: "Coelho et al. (2021)",
    filters: [
      { id: "coelho-food", label: "Food" },
      { id: "coelho-medicine", label: "Medicine" },
      { id: "coelho-manufacture", label: "Manufacture" },
      { id: "coelho-construction", label: "Construction" },
      { id: "coelho-thatching", label: "Thatching" },
      { id: "coelho-firewood", label: "Firewood" },
    ],
  },
]

export const allFilterIds = speciesUseFilterGroups.flatMap((group) =>
  group.filters.map((filter) => filter.id)
)

export const HISTOGRAM_TRAITS = [
  "SLA",
  "DENS",
  "HEIGHT",
  "DBH_2022",
  "SPAD",
] as const

export const TRAIT_FULL_NAMES: Record<string, string> = {
  CONT: "Leaf Carbon Content",
  DENS: "Wood Density",
  ESP: "Leaf Thickness",
  GUARD: "Guard Cell Length",
  SLA: "Specific Leaf Area",
  SPAD: "Leaf Chlorophyll Content",
  VEIND: "Leaf Vein Density",
  DBH_2022: "Diameter at Breast Height 2022",
  HEIGHT: "Total Tree Height",
  SOIL_RESP: "Soil Respiration Measurement Indicator",
}

export const getTraitDisplayLabel = (trait: string) => {
  const fullName = TRAIT_FULL_NAMES[trait]
  return fullName ? `${fullName} (${trait})` : trait
}

export const USE_CATEGORY_SLOT_COLORS = [
  "oklch(0.65 0.19 250)",
  "oklch(0.68 0.18 55)",
  "oklch(0.60 0.18 145)",
  "oklch(0.65 0.18 25)",
  "oklch(0.62 0.18 300)",
  "oklch(0.68 0.17 185)",
  "oklch(0.72 0.16 90)",
  "oklch(0.65 0.18 330)",
  "oklch(0.60 0.15 220)",
] as const

export const NO_USE_CATEGORY_COLOR = "oklch(0.68 0 0)"

export const getUseCategoryColor = (
  category: string,
  orderedCategories: string[]
) => {
  if (category === "No use") {
    return NO_USE_CATEGORY_COLOR
  }

  const categoryIndex = orderedCategories.indexOf(category)
  const paletteIndex = categoryIndex >= 0 ? categoryIndex : 0

  return USE_CATEGORY_SLOT_COLORS[
    paletteIndex % USE_CATEGORY_SLOT_COLORS.length
  ]
}

export const TRAIT_HISTOGRAM_COLORS: Record<
  (typeof HISTOGRAM_TRAITS)[number],
  string
> = {
  SLA: "#1b9e77",
  DENS: "#d95f02",
  HEIGHT: "#7570b3",
  DBH_2022: "#e7298a",
  SPAD: "#66a61e",
}
