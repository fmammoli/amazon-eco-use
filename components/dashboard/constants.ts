import type { SpeciesUseFilterGroup } from "@/components/dashboard/types"

export const speciesUseFilterGroups: SpeciesUseFilterGroup[] = [
  {
    id: "task5",
    label: "Task 5 Uses",
    filters: [
      { id: "task5-food", label: "Food" },
      { id: "task5-medicinal", label: "Medicinal" },
      { id: "task5-raw-material", label: "Raw Material" },
    ],
  },
  {
    id: "coelho",
    label: "Coelho Arboreal Uses",
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

export const filters = [
  { id: "all", label: "All locations" },
  { id: "recent", label: "Recent" },
  { id: "top", label: "Top rated" },
]

export const HISTOGRAM_TRAITS = [
  "SLA",
  "DENS",
  "HEIGHT",
  "DBH_2022",
  "SPAD",
] as const

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
