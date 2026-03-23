"use client"

import { useMemo, useState } from "react"
import { CircleHelp, Table2 } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { getTraitDisplayLabel } from "@/components/dashboard/constants"
import { Slider } from "@/components/ui/slider"
import { DataTableModal } from "@/components/dashboard/charts/DataTableModal"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type TraitDomains = Record<string, [number, number]>

export type TraitFilter = {
  id: string
  trait: string
  range: [number, number]
}

type FilteredTreeRow = {
  id: string | number
  plant_id: string | number
  species_name: string
  genus: string
  family: string
  vernacular_name: string
  has_any_use: string
  task5_uses: string
  coelho_uses: string
  height: number | null
  dbh_2022: number | null
}

export type FilterPanelProps = {
  speciesUseFilterGroups: Array<{
    id: string
    label: string
    filters: Array<{ id: string; label: string }>
  }>
  selectedUseFilters: string[]
  onToggleSpeciesUseFilter: (id: string) => void
  onToggleSpeciesUseFilterGroup: (
    groupId: string,
    shouldSelect: boolean
  ) => void
  numericTraits: string[]
  traitDomains: TraitDomains
  traitFilters: TraitFilter[]
  onAddTraitFilter: () => void
  onUpdateTraitFilter: (
    id: string,
    updater: Partial<Omit<TraitFilter, "id">>
  ) => void
  onRemoveTraitFilter: (id: string) => void
  includeMissing: boolean
  missingValueCounts: Record<string, number>
  onToggleIncludeMissing: () => void
  showNoUse: boolean
  onToggleShowNoUse: () => void
  dataCoverage: {
    totalFilteredTrees: number
    missingTraitValueTrees: number
    missingUseMetadataTrees: number
    traitCoverageLabel: string
  }
  filteredTreeRows: FilteredTreeRow[]
  onReset: () => void
}

export function FilterPanel({
  speciesUseFilterGroups,
  selectedUseFilters,
  onToggleSpeciesUseFilter,
  onToggleSpeciesUseFilterGroup,
  numericTraits,
  traitDomains,
  traitFilters,
  onAddTraitFilter,
  onUpdateTraitFilter,
  onRemoveTraitFilter,
  includeMissing,
  missingValueCounts,
  onToggleIncludeMissing,
  showNoUse,
  onToggleShowNoUse,
  dataCoverage,
  filteredTreeRows,
  onReset,
}: FilterPanelProps) {
  const [isFilteredTableOpen, setIsFilteredTableOpen] = useState(false)

  const filteredTreeColumns = useMemo<ColumnDef<FilteredTreeRow>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
      },
      {
        accessorKey: "plant_id",
        header: "Plant ID",
      },
      {
        accessorKey: "species_name",
        header: "Species",
      },
      {
        accessorKey: "genus",
        header: "Genus",
      },
      {
        accessorKey: "family",
        header: "Family",
      },
      {
        accessorKey: "vernacular_name",
        header: "Vernacular",
      },
      {
        accessorKey: "has_any_use",
        header: "Has Any Use",
      },
      {
        accessorKey: "task5_uses",
        header: "Task 5 Uses",
      },
      {
        accessorKey: "coelho_uses",
        header: "Coelho Uses",
      },
      {
        accessorKey: "height",
        header: "Height",
        cell: ({ row }) => {
          const value = row.original.height
          return value == null ? "-" : value.toFixed(2)
        },
      },
      {
        accessorKey: "dbh_2022",
        header: "DBH 2022",
        cell: ({ row }) => {
          const value = row.original.dbh_2022
          return value == null ? "-" : value.toFixed(2)
        },
      },
    ],
    []
  )

  const filteredCount = filteredTreeRows.length
  const traitMissingPct =
    dataCoverage.totalFilteredTrees > 0
      ? Math.round(
          (dataCoverage.missingTraitValueTrees /
            dataCoverage.totalFilteredTrees) *
            100
        )
      : 0
  const useMissingPct =
    dataCoverage.totalFilteredTrees > 0
      ? Math.round(
          (dataCoverage.missingUseMetadataTrees /
            dataCoverage.totalFilteredTrees) *
            100
        )
      : 0

  const getGapSeverity = (pct: number) => {
    if (pct <= 10) {
      return {
        label: "Low gap",
        className:
          "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      }
    }

    if (pct <= 30) {
      return {
        label: "Medium gap",
        className:
          "border-amber-300/60 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      }
    }

    return {
      label: "High gap",
      className:
        "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    }
  }

  const traitGapSeverity = getGapSeverity(traitMissingPct)
  const useGapSeverity = getGapSeverity(useMissingPct)

  return (
    <aside className="rounded-lg border border-border bg-card/80 p-4 shadow-sm backdrop-blur-xl">
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50"
          >
            Reset filters
          </button>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={includeMissing}
            onChange={onToggleIncludeMissing}
            className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-primary"
          />
          <span className="inline-flex items-center gap-1.5">
            Include missing values
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  className="inline-flex items-center rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  aria-label="Include missing values help"
                  onClick={(event) => event.preventDefault()}
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-sm whitespace-normal"
                >
                  <div className="space-y-1.5 text-xs">
                    <p>
                      This option controls how filters treat missing values in
                      tree-level attributes from the GeoJSON records.
                    </p>
                    <p>
                      When enabled, trees with null or absent trait/property
                      values in the GeoJSON are kept in the filtered results.
                    </p>
                    <p>
                      When disabled, those trees are excluded whenever the
                      active filter requires that missing value.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
        </label>
      </div>

      <div className="mt-4 space-y-2 rounded-md border border-input bg-background p-3">
        <p className="text-xs font-medium text-muted-foreground">
          Species Uses
        </p>
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showNoUse}
            onChange={onToggleShowNoUse}
            className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-primary"
          />
          <span className="inline-flex items-center gap-1.5">
            Show trees with no use
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  className="inline-flex items-center rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  aria-label="Show trees with no use help"
                  onClick={(event) => event.preventDefault()}
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-sm whitespace-normal"
                >
                  <div className="space-y-1.5 text-xs">
                    <p>
                      This option controls whether trees are kept when their
                      species has no ethnobotanical-use assignment.
                    </p>
                    <p>
                      Tree occurrences come from the GeoJSON, while use labels
                      are matched from the species metadata JSON.
                    </p>
                    <p>
                      If no use record is found for a species (missing, null, or
                      unmatched), those trees are included only when this is
                      enabled.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
        </label>

        <div className="space-y-3">
          {speciesUseFilterGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {group.label}
                  </p>
                  {group.id === "task5" ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          type="button"
                          className="inline-flex items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                          aria-label="Task 5 uses data source"
                          onClick={(event) => event.preventDefault()}
                        >
                          <CircleHelp className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="max-w-sm whitespace-normal"
                        >
                          <p className="text-xs">
                            These data were collected by researchers Beatriz
                            Tristao and Moara Canova from the AmazonFACE Task 5
                            group.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                  {group.id === "coelho" ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          type="button"
                          className="inline-flex items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                          aria-label="Coelho arboreal uses data source"
                          onClick={(event) => event.preventDefault()}
                        >
                          <CircleHelp className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="max-w-md whitespace-normal"
                        >
                          <p className="text-xs">
                            Coelho, S. D., Levis, C., Baccaro, F. B.,
                            Figueiredo, F. O. G., Antunes, A. P., ter Steege,
                            H., Pena-Claros, M., Clement, C. R., &amp; Schietti,
                            J. (2021). Eighty-four per cent of all Amazonian
                            arboreal plant individuals are useful to humans.
                            PLOS ONE, 16(10), e0257875.
                          </p>
                          <a
                            href="https://doi.org/10.1371/journal.pone.0257875"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs underline underline-offset-2"
                          >
                            https://doi.org/10.1371/journal.pone.0257875
                          </a>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                </div>
                <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={group.filters.every((filter) =>
                      selectedUseFilters.includes(filter.id)
                    )}
                    onChange={(event) =>
                      onToggleSpeciesUseFilterGroup(
                        group.id,
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-primary"
                  />
                  <span>All</span>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {group.filters.map((useFilter) => (
                  <label
                    key={useFilter.id}
                    className="inline-flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUseFilters.includes(useFilter.id)}
                      onChange={() => onToggleSpeciesUseFilter(useFilter.id)}
                      className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-primary"
                    />
                    <span>{useFilter.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {numericTraits.length > 0 ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">
              Trait filters
            </div>
            <button
              type="button"
              onClick={onAddTraitFilter}
              className="rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent/50"
            >
              + Add
            </button>
          </div>

          <div className="space-y-3">
            {traitFilters.map((filter) => {
              const domain = traitDomains[filter.trait]
              return (
                <div
                  key={filter.id}
                  className="rounded-md border border-input bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <select
                      value={filter.trait}
                      onChange={(event) =>
                        onUpdateTraitFilter(filter.id, {
                          trait: event.target.value,
                          range:
                            traitDomains[event.target.value] ?? filter.range,
                        })
                      }
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      {numericTraits.map((trait) => (
                        <option key={trait} value={trait}>
                          {getTraitDisplayLabel(trait)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onRemoveTraitFilter(filter.id)}
                      className="rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50"
                    >
                      Remove
                    </button>
                  </div>

                  {domain ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{getTraitDisplayLabel(filter.trait)} range</span>
                        <span>
                          {filter.range[0].toFixed(2)} –{" "}
                          {filter.range[1].toFixed(2)}
                        </span>
                      </div>
                      {missingValueCounts[filter.id] > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Missing: {missingValueCounts[filter.id]}
                        </p>
                      ) : null}
                      <Slider
                        value={filter.range}
                        min={domain[0]}
                        max={domain[1]}
                        step={(domain[1] - domain[0]) / 100}
                        onValueChange={(val) => {
                          if (Array.isArray(val) && val.length === 2) {
                            onUpdateTraitFilter(filter.id, {
                              range: [val[0], val[1]],
                            })
                          }
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
      <div className="mt-4 rounded-md border border-input bg-background p-3">
        <p className="text-xs font-medium text-muted-foreground">
          Data Coverage
        </p>
        <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <span>Filtered trees</span>
            <span className="font-medium text-foreground">
              {dataCoverage.totalFilteredTrees}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5">
              Missing trait values ({dataCoverage.traitCoverageLabel})
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    className="inline-flex items-center rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    aria-label="Missing trait values metric definition"
                    onClick={(event) => event.preventDefault()}
                  >
                    <CircleHelp className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-sm whitespace-normal"
                  >
                    <p className="text-xs">
                      Count of filtered trees where one or more checked traits
                      are missing, null, or non-numeric. Lower is better.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="font-medium text-foreground">
                {dataCoverage.missingTraitValueTrees} ({traitMissingPct}%)
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${traitGapSeverity.className}`}
              >
                {traitGapSeverity.label}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5">
              Missing use metadata
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    className="inline-flex items-center rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    aria-label="Missing use metadata metric definition"
                    onClick={(event) => event.preventDefault()}
                  >
                    <CircleHelp className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-sm whitespace-normal"
                  >
                    <p className="text-xs">
                      Count of filtered trees whose species has no populated use
                      entries in either Task 5 or Coelho metadata fields.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="font-medium text-foreground">
                {dataCoverage.missingUseMetadataTrees} ({useMissingPct}%)
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${useGapSeverity.className}`}
              >
                {useGapSeverity.label}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <Button
          type="button"
          size="lg"
          onClick={() => setIsFilteredTableOpen(true)}
          className="w-full justify-between rounded-lg border-emerald-300/35 bg-linear-to-r from-emerald-500 to-cyan-500 text-white shadow-sm transition-all hover:from-emerald-400 hover:to-cyan-400 hover:shadow-md"
        >
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold">
            <Table2 className="h-3.5 w-3.5" />
            View Filtered Results
          </span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white">
            {filteredCount}
          </span>
        </Button>

        <DataTableModal
          data={filteredTreeRows}
          columns={filteredTreeColumns}
          title="Filtered Trees"
          description="All trees matching the current filters."
          open={isFilteredTableOpen}
          onOpenChange={setIsFilteredTableOpen}
          showTrigger={false}
        />
      </div>
    </aside>
  )
}
