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
              coelho_arboreal_use is based on the study{" "}
              <Link href={"https://doi.org/10.1371/journal.pone.0257875"}>
                Coelho et al. (2021) `&apos;`Eighty-four per cent of all
                Amazonian arboreal plant individuals are useful to
                humans`&apos;`
              </Link>
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
