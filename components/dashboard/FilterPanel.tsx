"use client"

import { Slider } from "@/components/ui/slider"

export type TraitDomains = Record<string, [number, number]>

export type TraitFilter = {
  id: string
  trait: string
  range: [number, number]
}

export type FilterPanelProps = {
  filters: Array<{ id: string; label: string }>
  selectedFilter: string
  onSelectFilter: (id: string) => void
  activeFilterLabel: string
  speciesUseFilterGroups: Array<{
    id: string
    label: string
    filters: Array<{ id: string; label: string }>
  }>
  selectedUseFilters: string[]
  onToggleSpeciesUseFilter: (id: string) => void
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
  onReset: () => void
}

export function FilterPanel({
  filters,
  selectedFilter,
  onSelectFilter,
  activeFilterLabel,
  speciesUseFilterGroups,
  selectedUseFilters,
  onToggleSpeciesUseFilter,
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
  onReset,
}: FilterPanelProps) {
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
          <span className="text-xs text-muted-foreground">
            {activeFilterLabel}
          </span>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={includeMissing}
            onChange={onToggleIncludeMissing}
            className="h-4 w-4 rounded border border-input bg-background text-primary focus:ring-primary"
          />
          <span>Include missing values</span>
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
          <span>Show trees with no use</span>
        </label>

        <div className="space-y-3">
          {speciesUseFilterGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">
                {group.label}
              </p>
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
                          {trait}
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
                        <span>{filter.trait} range</span>
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
    </aside>
  )
}
