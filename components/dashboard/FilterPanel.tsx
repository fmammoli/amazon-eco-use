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
  onReset: () => void
}

export function FilterPanel({
  filters,
  selectedFilter,
  onSelectFilter,
  activeFilterLabel,
  numericTraits,
  traitDomains,
  traitFilters,
  onAddTraitFilter,
  onUpdateTraitFilter,
  onRemoveTraitFilter,
  includeMissing,
  missingValueCounts,
  onToggleIncludeMissing,
  onReset,
}: FilterPanelProps) {
  return (
    <aside className="rounded-lg border border-border bg-card/80 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Filters</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {activeFilterLabel}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onSelectFilter(filter.id)}
            className={
              "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition " +
              (filter.id === selectedFilter
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background hover:bg-accent/50")
            }
          >
            <span>{filter.label}</span>
            {filter.id === selectedFilter ? (
              <span className="text-xs">✓</span>
            ) : null}
          </button>
        ))}
      </div>

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

      <div className="mt-6 rounded-md bg-muted p-3 text-xs text-muted-foreground">
        <p className="font-medium">Tip</p>
        <p>Resize the window to see the layout adapt on smaller screens.</p>
      </div>
    </aside>
  )
}
