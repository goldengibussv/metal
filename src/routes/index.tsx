import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Droplets,
  Hammer,
  Home as HomeIcon,
  Palette,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import roofColor1 from "@/assets/roof-color-1.jpg";
import roofColor2 from "@/assets/roof-color-2.jpg";
import roofColor3 from "@/assets/roof-color-3.jpg";
import roofColor4 from "@/assets/roof-color-4.jpg";
import roofColor5 from "@/assets/roof-color-5.jpg";
import roofColor6 from "@/assets/roof-color-6.jpg";
import roofColor7 from "@/assets/roof-color-7.jpg";
import roofColor8 from "@/assets/roof-color-8.jpg";
import roofColor9 from "@/assets/roof-color-9.jpg";
import roofColor10 from "@/assets/roof-color-10.jpg";
import roofColor11 from "@/assets/roof-color-11.jpg";
import modernRoofHero from "@/assets/modern-roof-hero.jpg";
import gableRoof from "@/assets/home-gable-roof.jpg";
import hipRoof from "@/assets/home-hip-roof.jpg";
import mansardRoof from "@/assets/home-mansard-roof.jpg";
import heroAsset from "@/assets/hero-home.jpg.asset.json";
import flatFaceInstalledAsset from "@/assets/flat-face-installed.jpeg.asset.json";
import onePencilInstalledAsset from "@/assets/flat-face-one-pencil-installed.jpeg.asset.json";
import doublePencilInstalledAsset from "@/assets/flat-face-double-pencil-installed.jpeg.asset.json";
import { Button } from "@/components/ui/button";
import { useQuote } from "@/components/QuoteDialog";
import { RoofQuoteDialog } from "@/components/RoofQuoteDialog";
import { SITE } from "@/lib/site";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MetalFlow | Gutters for Metal Roofs in South Florida" },
      { name: "description", content: "MetalFlow installs modern seamless gutters for metal roofs from Miami to Deerfield Beach. Get an instant quote or schedule a free inspection." },
      { property: "og:title", content: "MetalFlow | Modern Gutters for Metal Roofs" },
      { property: "og:description", content: "Modern gutter systems, professional installation and instant pricing across South Florida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const styles = [
  { name: "Flat Face", text: "Clean front face for commercial and contemporary buildings.", image: flatFaceInstalledAsset.url },
  { name: "Flat Face One Pencil", text: "A crisp single detail for modern metal roof systems.", image: onePencilInstalledAsset.url },
  { name: "Flat Face Double Pencil", text: "Twin architectural lines for a defined contemporary finish.", image: doublePencilInstalledAsset.url },
];

const colors = [
  { name: "Black / Black", image: roofColor1 },
  { name: "Black Roof / White Gutter", image: roofColor2 },
  { name: "Gray Roof / White Gutter", image: roofColor3 },
  { name: "Bronze", image: roofColor4 },
  { name: "Blue", image: roofColor5 },
  { name: "Green", image: roofColor6 },
  { name: "Charcoal / Charcoal", image: roofColor7 },
  { name: "White / White", image: roofColor8 },
  { name: "Brown", image: roofColor9 },
  { name: "Charcoal Gray", image: roofColor10 },
  { name: "Galvalume", image: roofColor11 },
];

function ColorGallery() {
  const t = useT();
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {colors.map((color) => (
        <article key={color.name} className="group relative aspect-[4/3] overflow-hidden rounded-md bg-secondary">
          <img src={color.image} alt={`${color.name} metal roof and gutter combination`} className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" loading="lazy" width={600} height={450} />
          <div className="absolute inset-x-0 bottom-0 bg-secondary/80 px-4 py-3">
            <h3 className="font-display text-base font-bold uppercase leading-tight text-secondary-foreground">{t(color.name)}</h3>
          </div>
        </article>
      ))}
    </div>
  );
}

function Home() {
  const t = useT();
  const { open } = useQuote();
  const [roofOpen, setRoofOpen] = useState(false);

  return (
    <main className="overflow-hidden pt-16 md:pt-[74px]">
      <section className="home-hero relative flex flex-col overflow-hidden border-b-4 border-primary">
        <img src={modernRoofHero} alt="Modern flat face gutter and downspout on a standing seam metal roof" className="absolute inset-0 h-full w-full object-cover object-right" width={1600} height={912} />
        <div className="hero-shade absolute inset-0" />
        <div className="hero-roof-promo pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-[36%] items-end justify-end pb-10 md:flex lg:pb-12">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRoofOpen(true)}
            className="pointer-events-auto mr-6 h-auto w-72 flex-col items-start gap-0 whitespace-normal rounded-md border-primary/60 bg-background/95 p-5 text-left shadow-2xl backdrop-blur transition hover:border-primary hover:bg-background lg:mr-10"
          >
            <p className="font-display text-2xl font-bold leading-tight">{t("No roof yet?")}</p>
            <p className="mt-2 text-base text-muted-foreground">{t("Request a quote for a metal roof")}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-base font-bold uppercase text-primary">
              {t("Get quote")} <ArrowRight className="size-5" />
            </span>
          </Button>
        </div>
        <div className="container-x hero-compact relative flex flex-1 items-center py-8">
          <div className="hero-compact hero-text w-full max-w-2xl text-secondary-foreground">
            <h1 className="font-display text-4xl font-bold leading-[1.05] text-secondary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              {t("Modern gutters for")} <span className="text-primary">{t("metal roofs")}</span>
            </h1>
            <p className="hero-lead mt-3 max-w-xl text-lg font-medium text-secondary-foreground/85 md:text-xl">
              {t("Made for metal roofs, not adapted to them. Seamless installation from Miami to Deerfield Beach.")}
            </p>
            <div className="hero-ctas mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button onClick={open} size="lg" className="cursor-pointer rounded-md px-4 font-bold uppercase">
                <ClipboardList className="size-5" /> {t("Get my quote")} <ArrowRight className="size-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-md border-secondary-foreground/50 bg-secondary/40 px-7 font-bold uppercase text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary ">
                <a href={SITE.phoneHref}><Phone className="size-5" /> {SITE.phone}</a>
              </Button>
            </div>
            <Button
              type="button"
              onClick={() => setRoofOpen(true)}
              className="hero-promo mt-3 flex h-auto w-full whitespace-normal cursor-pointer items-center justify-center gap-2 rounded-md border border-primary/70 bg-primary/15 px-5 py-3 text-sm font-bold uppercase text-secondary-foreground shadow-lg transition hover:bg-primary hover:text-primary-foreground md:hidden"
            >
              {t("No roof yet?")} {t("Request a quote for a metal roof")} <ArrowRight className="size-4 shrink-0" />
            </Button>
            <div className="hero-benefits mt-8 grid grid-cols-2 gap-4 border-t border-secondary-foreground/25 pt-5 sm:grid-cols-4">
              {[
                [Droplets, "Durable performance"],
                [ShieldCheck, "Clean lines"],
                [HomeIcon, "Built to last"],
                [Wrench, "Roof specialists"],
              ].map(([Icon, label]) => (
                <div key={String(label)} className="flex items-center gap-2.5 text-sm font-bold uppercase">
                  <Icon className="size-6 shrink-0 text-primary" /> {t(String(label))}
                </div>
              ))}
            </div>
            <div className="hero-sizes mt-5 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-primary/70 py-2 font-display font-bold uppercase text-secondary-foreground" aria-label="Gutters in 5, 6, 7 and 8 inch sizes">
              <span className="text-2xl">5"</span><span className="text-2xl">6"</span><span className="text-2xl">7"</span><span className="text-2xl">8"</span>
              <span className="text-sm text-primary">{t("GUTTERS")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-8 md:py-10">
        <div className="container-x">
          <div className="text-center">
            <h2 className="font-display text-4xl text-foreground md:text-5xl">{t("Our")} <span className="text-primary">{t("3 step process")}</span></h2>
            <p className="text-sm text-muted-foreground">{t("Fast. Simple. Hassle free.")}</p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              [ClipboardList, "Enter your property info", "Tell us the details about your property."],
              [Palette, "Choose style and size", "Select the profile and size that fits your roof."],
              [CalendarDays, "Schedule installation", "Pick the right date and our team handles the rest."],
            ].map(([Icon, title, text], index) => (
              <div key={String(title)} className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span>
                <span className="grid size-14 place-items-center rounded-full bg-secondary text-primary"><Icon className="size-7" /></span>
                <div className="min-w-0"><h3 className="font-display text-2xl leading-none">{t(String(title))}</h3><p className="mt-1 text-sm text-muted-foreground">{t(String(text))}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-10 text-secondary-foreground md:py-14">
        <div className="container-x grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
          <div>
            <p className="text-sm font-bold uppercase text-primary">{t("Gutter solutions")}</p>
            <h2 className="font-display text-4xl md:text-5xl">{t("Our gutter styles")}</h2>
            <p className="mt-1 text-secondary-foreground/70">{t("Modern profiles for residential and commercial roof systems.")}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {styles.map((style) => (
                <article key={style.name} className="overflow-hidden rounded-md border border-secondary-foreground/20 bg-secondary-foreground/5">
                  <div className="aspect-[4/3] overflow-hidden bg-background/95">
                    <img src={style.image} alt={`${style.name} gutter installed on a metal roof`} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-4"><h3 className="font-display text-2xl text-secondary-foreground">{style.name}</h3><p className="mt-1 text-sm text-secondary-foreground/70">{t(style.text)}</p></div>
                </article>
              ))}
            </div>
          </div>
          <aside className="self-center rounded-md bg-background p-6 text-foreground shadow-2xl">
            <p className="text-sm font-bold uppercase text-primary">{t("Fast. Easy. No obligation.")}</p>
            <h2 className="font-display text-4xl">{t("Get a free estimate")}</h2>
            <div className="mt-5 space-y-3 text-sm text-muted-foreground">
              {["Tell us where the property is located.", "Choose instant pricing or a free inspection.", "Receive a specialized quote for your roof."].map((line) => (
                <p key={line} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> {t(line)}</p>
              ))}
            </div>
            <Button onClick={open} className="mt-6 h-12 w-full cursor-pointer rounded-md text-base font-bold uppercase"><Send className="size-5" /> {t("Request my estimate")} <ArrowRight className="size-4" /></Button>
            <p className="mt-4 text-xs text-muted-foreground">{t("High quality materials, professional labor and installation are included in your quote.")}</p>
          </aside>
        </div>
      </section>

      <section className="bg-background py-10 md:py-14">
        <div className="container-x">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-4xl uppercase md:text-5xl">{t("Color")} <span className="text-primary">{t("combinations")}</span></h2>
            <p className="max-w-sm text-sm text-muted-foreground">{t("Popular gutter and metal roof pairings for a clean, coordinated finish.")}</p>
          </div>
          <ColorGallery />
        </div>
      </section>

      <section className="bg-secondary py-8 text-secondary-foreground">
        <div className="container-x grid grid-cols-2 gap-6 md:grid-cols-5">
          {[
            [Droplets, "Durable performance", "Built for South Florida rain."],
            [ShieldCheck, "Clean lines", "A modern, precise finish."],
            [Hammer, "Built to last", "Professional installation."],
            [CalendarDays, "Fast scheduling", "Get on the calendar quickly."],
            [Sparkles, "Roof specialists", "Profiles for modern roofs."],
          ].map(([Icon, title, text]) => (
            <div key={String(title)} className="text-center"><Icon className="mx-auto size-8 text-primary" /><h3 className="mt-2 font-display text-xl leading-none">{t(String(title))}</h3><p className="mt-1 text-xs text-secondary-foreground/65">{t(String(text))}</p></div>
          ))}
        </div>
      </section>

      <section className="bg-background py-10 md:py-14">
        <div className="container-x">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-4xl font-bold uppercase md:text-5xl">{t("A clean look")} <span className="text-primary">{t("for your home.")}</span></h2>
            <p className="max-w-sm text-sm text-muted-foreground">{t("Our gutter systems complement any style of home with a clean, modern finish.")}</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[{ name: "Gable Roof", image: gableRoof }, { name: "Hip Roof", image: hipRoof }, { name: "Mansard Roof", image: mansardRoof }].map((roof) => (
              <article key={roof.name} className="relative aspect-[4/3] overflow-hidden rounded-md bg-secondary">
                <img src={roof.image} alt={`${roof.name} with modern rain gutters, architectural illustration`} className="h-full w-full object-cover" loading="lazy" width={1008} height={704} />
                <h3 className="absolute inset-x-0 bottom-0 bg-secondary/80 px-4 py-3 font-display text-xl font-bold text-secondary-foreground">{t(roof.name)}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

       <section className="relative overflow-hidden py-14 md:py-20">
         <img src={heroAsset.url} alt="Home with a metal roof and seamless gutters" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
         <div className="absolute inset-0 bg-secondary/85" />
         <div className="container-x relative">
           <div className="max-w-xl text-secondary-foreground">
            <h2 className="font-display text-4xl leading-none md:text-5xl">{t("Ready to upgrade")} <span className="text-primary">{t("your gutters?")}</span></h2>
             <p className="mt-3 text-secondary-foreground/75">{t("Get a durable gutter system made for your roof and built to last.")}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button onClick={open} className="cursor-pointer rounded-md font-bold uppercase"><CalendarDays className="size-4" /> {t("Book in 3 easy steps")} <ArrowRight className="size-4" /></Button>
              <Button asChild variant="outline" className="rounded-md border-secondary-foreground/50 bg-secondary/40 font-bold text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary"><a href={SITE.phoneHref}><Phone className="size-4" /> {SITE.phone}</a></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="sr-only"><Link to="/services">{t("View all gutter services")}</Link></section>
      <RoofQuoteDialog open={roofOpen} onOpenChange={setRoofOpen} />
    </main>
  );
}