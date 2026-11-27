import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Hammer, Droplets, ShieldCheck, CheckCircle2 } from "lucide-react";
import { SERVICES, SITE } from "@/lib/site";
import { useQuote } from "@/components/QuoteDialog";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Gutter Services in Pompano Beach | MetalFlow" },
      {
        name: "description",
        content:
          "Gutter installation, gutter repair and gutter cleaning from Pompano Beach to Miami and across South Florida. Instant quotes from MetalFlow LLC.",
      },
      { property: "og:title", content: "Gutter Services in Pompano Beach | MetalFlow" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content:
          "Seamless gutter installation, repair and cleaning by MetalFlow LLC in South Florida.",
      },
    ],
  }),
  component: ServicesPage,
});

const icons = [Wrench, Hammer, Droplets, ShieldCheck];

const details: Record<string, string[]> = {
  "gutter-installation": [
    "Seamless aluminum in 5, 6, 7 and 8 inches",
    "Flat Face, Flat Face One Pencil and Flat Face Double Pencil profiles",
    "Hidden hangers and sealed corners",
    "Downspouts sized for Florida rain",
  ],
  "gutter-repair": [
    "Leak and seam repair",
    "Re pitch of sagging runs",
    "Hanger and fascia repair",
    "Downspout replacement",
  ],
  "gutter-cleaning": [
    "Full debris removal",
    "Downspout flush and flow test",
    "Roof edge inspection",
    "Before and after report",
  ],
};

function ServicesPage() {
  const t = useT();
  const { open } = useQuote();

  return (
    <main>
      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="container-x max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{t("Our Services")}</p>
          <h1 className="mt-3 text-4xl font-bold uppercase leading-tight md:text-6xl">
            {t("Three services, done right")}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {t("We keep it simple and focused so every job moves fast. Installation, repair and cleaning across South Florida, by a licensed and insured team.")}
          </p>
          <button
            type="button"
            onClick={open}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-primary px-7 text-sm font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary/90"
          >
            {t("Get an instant quote")}
          </button>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-x grid gap-6 md:grid-cols-2">
          {SERVICES.map((s, i) => {
            const Icon = icons[i] ?? Wrench;
            return (
              <article key={s.slug} className="rounded-lg border border-border bg-card p-7">
                <Icon className="size-8 text-primary" />
                <h2 className="mt-4 text-2xl font-bold uppercase">{t(s.name)}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t(s.short)}</p>
                <ul className="mt-5 space-y-2">
                  {(details[s.slug] ?? []).map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{t(d)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
