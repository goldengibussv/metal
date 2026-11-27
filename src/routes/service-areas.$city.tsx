import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { CheckCircle2, Phone } from "lucide-react";
import { SERVICE_AREAS, SERVICES, SITE } from "@/lib/site";
import { useQuote } from "@/components/QuoteDialog";
import { useT } from "@/lib/i18n";

const findArea = (slug: string) => SERVICE_AREAS.find((a) => a.slug === slug);

export const Route = createFileRoute("/service-areas/$city")({
  loader: ({ params }) => {
    const area = findArea(params.city);
    if (!area) throw notFound();
    return { area };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Area unavailable | MetalFlow" }, { name: "robots", content: "noindex" }] };
    }
    const title = `Gutter Services in ${loaderData.area.name} | MetalFlow`;
    const description = `Gutter installation, repair and cleaning in ${loaderData.area.name}, Florida. Instant quotes from MetalFlow LLC.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div className="container-x py-24" role="alert">
      <p className="text-muted-foreground">{(error as Error).message}</p>
    </div>
  ),
  notFoundComponent: () => <AreaNotFound />,

  component: AreaPage,
});

function AreaPage() {
  const t = useT();
  const { area } = Route.useLoaderData();
  const { open } = useQuote();

  return (
    <main>
      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="container-x max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{t("Service Area")}</p>
          <h1 className="mt-3 text-4xl font-bold uppercase leading-tight md:text-6xl">
            {t("Gutter services in")} {area.name}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {t("MetalFlow installs, repairs and cleans seamless aluminum gutters across")} {area.name}.{" "}
            {t("Same crews, same standard, licensed and insured.")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={open}
              className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-7 text-sm font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary/90"
            >
              {t("Get instant price")}
            </button>
            <a
              href={SITE.phoneHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border px-7 text-sm font-bold uppercase tracking-wide transition hover:border-primary"
            >
              <Phone className="size-4 text-primary" />
              {SITE.phone}
            </a>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-x grid gap-6 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.slug} className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-bold uppercase">{t(s.name)} {t("in")} {area.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t(s.short)}</p>
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" /> {t("Licensed and insured crews")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 py-14">
        <div className="container-x">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("Other areas we serve")}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {SERVICE_AREAS.filter((a) => a.slug !== area.slug).map((a) => (
              <Link
                key={a.slug}
                to="/service-areas/$city"
                params={{ city: a.slug }}
                className="rounded-md border border-border px-4 py-2 text-sm transition hover:border-primary"
              >
                {a.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function AreaNotFound() {
  const t = useT();
  return (
    <div className="container-x py-24 text-center">
      <h1 className="text-3xl font-bold uppercase">{t("Area not found")}</h1>
      <Link to="/" className="mt-4 inline-block text-primary">{t("Go home")}</Link>
    </div>
  );
}
