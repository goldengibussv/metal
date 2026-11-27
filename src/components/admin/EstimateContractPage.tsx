import { CalendarDays, Droplets, Hammer, ShieldCheck, Sparkles } from "lucide-react";
import { SITE } from "@/lib/site";
import logoAsset from "@/assets/metalflow-brand-dark.png.asset.json";

const benefits = [
  { icon: Droplets, title: "Durable performance", text: "Built for South Florida rain." },
  { icon: ShieldCheck, title: "Clean lines", text: "A modern, precise finish." },
  { icon: Hammer, title: "Built to last", text: "Professional installation." },
  { icon: CalendarDays, title: "Fast scheduling", text: "Get on the calendar quickly." },
  { icon: Sparkles, title: "Roof specialists", text: "Profiles for modern roofs." },
];

export function EstimateContractPage({ terms, client }: { terms: string; client: string }) {
  return (
    <aside className="estimate-contract mt-8 border-t border-border pt-6">
      <header className="flex items-center justify-between gap-5 border-b border-border pb-5">
        <img src={logoAsset.url} alt="MetalFlow LLC" className="h-auto w-72 max-w-[45%] object-contain" width={1797} height={339} />
        <div className="text-right text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{SITE.legal}</p>
          <p>Estimate • {client}</p>
          <p>Contractual Terms &amp; Property Care</p>
        </div>
      </header>

      <section className="contract-terms mt-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">Contractual Terms</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{terms}</p>
      </section>

      <section className="mt-7 border-t border-border pt-5">
        <h2 className="font-display text-lg font-semibold">Modern profiles. Purpose-built for metal roofs.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          MetalFlow specializes in modern gutter profiles for residential and commercial properties with metal roof systems.
          Our Flat Face, Flat Face One Pencil and Flat Face Double Pencil profiles complement contemporary architecture
          with clean lines and a precise finish. Manufactured and installed in Pompano Beach, Florida,
          our systems combine architectural detail with professional rainwater management.
        </p>
      </section>

      <section className="contract-benefits mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {benefits.map(({ icon: Icon, title, text }) => (
          <div key={title} className="min-w-0">
            <Icon className="mb-2 size-6 text-primary" strokeWidth={1.7} />
            <h3 className="font-display text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-7 border-t border-border pt-5">
        <h2 className="font-display text-lg font-semibold">Dedicated property assistance</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Our commitment to property care includes a direct line available 12 hours per day, Monday through Saturday.
          Homeowners, property managers and commercial clients can contact MetalFlow for questions about their
          installation, scheduling and service needs. We provide a direct point of contact throughout your project
          and for follow-up assistance.
        </p>
        <p className="mt-3 text-base font-semibold text-foreground">{SITE.phone} <span className="font-normal text-muted-foreground">• {SITE.email}</span></p>
      </section>

      <footer className="contract-footer mt-7 flex flex-wrap justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>QUALITY THAT CHANNELS EVERY DROP</span>
        <span>metalflowllc.com • {SITE.city}</span>
      </footer>
    </aside>
  );
}