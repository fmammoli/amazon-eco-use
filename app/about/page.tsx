import Link from "next/link"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-8 rounded-lg border border-border bg-card/70 p-6 shadow-sm backdrop-blur-xl lg:p-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            About this project
          </h1>
          <p className="text-sm text-muted-foreground">
            This dashboard is an environment for investigating links between
            Amazonian forest composition, functional traits, and ethnobotanical
            knowledge. It integrates individual-level ecological observations
            with species-level use and reference data to support exploratory
            analyses at the biodiversity-society interface.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Scope</h2>
          <p className="text-sm text-muted-foreground">
            The dashboard is designed to examine three complementary dimensions:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Forest structure and species abundance across monitored plots.
            </li>
            <li>
              Functional variation through measured traits at the level of
              individual trees and species.
            </li>
            <li>
              Ethnobotanical relevance through documented human uses and
              associated bibliographic evidence.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            These components can be explored jointly to assess how ecological
            prominence, functional attributes, and use-related knowledge co-vary
            among taxa.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">How To Use The Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            The interface is designed for iterative exploration: start broad,
            progressively filter, and then inspect species and individual trees
            in detail.
          </p>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">
                1. Start with filters
              </p>
              <p>
                Use the filter panel to include or exclude use categories and
                define trait ranges. The map and all charts update together, so
                each interaction narrows the same underlying dataset.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">
                2. Search species directly
              </p>
              <p>
                The search bar accepts scientific names, genus names, and
                available popular names. Selecting a species highlights it
                across charts and map layers and helps focus analysis on one
                taxon at a time.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">
                3. Read map patterns
              </p>
              <p>
                Hover points for tree-level details. At lower zoom levels,
                points aggregate by experimental plot; hover aggregated points
                to compare trees with and without registered use inside each
                plot.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">
                4. Compare species structure
              </p>
              <p>
                Use the treemaps to compare scientific attention and tree
                abundance. Hovering links the same species between both
                treemaps, making it easier to compare ecological prominence and
                literature coverage.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">
                5. Drill down with charts and tables
              </p>
              <p>
                Click points in scatter and rank-abundance charts to open data
                tables for the selected species or records. Use table sorting
                and CSV export for follow-up analysis.
              </p>
            </div>

            <div>
              <p className="font-medium text-foreground">
                6. Share the exact analytical view
              </p>
              <p>
                Dashboard state is encoded in the URL (filters, selected
                species, and related view settings). Copy the browser URL to
                share the same configured view with collaborators.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Data provenance</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              The individual tree measurements and trait information displayed
              in this dashboard derive from AmazonFACE research activities.
            </p>
            <p>
              Ethnobotanical data identified in this project as task5_use were
              compiled by AmazonFACE researchers Beatriz Tristão and Moara
              Canova. The species-level reference information used in this
              dashboard also comes from their curation. Their data were further
              enriched with GBIF and iNaturalist information, with iNaturalist
              data used in particular to expand photographic documentation of
              species.
            </p>
            <p>
              Additional ethnobotanical data identified here as
              coelho_arboreal_use is based on the study Coelho, S. D., Levis,
              C., Baccaro, F. B., Figueiredo, F. O. G., Antunes, A. P., ter
              Steege, H., Pena-Claros, M., Clement, C. R., & Schietti, J.
              (2021). Eighty-four per cent of all Amazonian arboreal plant
              individuals are useful to humans. PLOS ONE, 16(10), e0257875.{" "}
              <Link
                href="https://doi.org/10.1371/journal.pone.0257875"
                className="underline underline-offset-2"
              >
                https://doi.org/10.1371/journal.pone.0257875
              </Link>{" "}
              Their dataset is a synthesis from a literature review of 29
              ethnobotanical studies across Amazonia and harmonized at species
              level for trees and palms. The dataset organizes evidence into six
              principal categories: Food, Medicine, Manufacture, Construction,
              Thatching, and Firewood, with category-specific reference fields
              documenting supporting sources.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Interpretation note</h2>
          <p className="text-sm text-muted-foreground">
            The dashboard integrates complementary evidence streams with
            distinct origins: ecological measurements from AmazonFACE field
            research, and ethnobotanical/use-reference layers from curated
            literature-based and researcher-curated compilations. Results should
            therefore be interpreted as an integrated synthesis of field ecology
            and documented knowledge sources.
          </p>
        </section>

        <footer className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-border bg-input/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-input/50"
          >
            Back to dashboard
          </Link>
        </footer>
      </div>
    </main>
  )
}
