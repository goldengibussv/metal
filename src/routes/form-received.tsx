import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/form-received")({
  head: () => ({
    meta: [
      { title: "Request Received | MetalFlow Gutters" },
      {
        name: "description",
        content:
          "Thank you. Your gutter quote request was received and the MetalFlow team will contact you shortly.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Request Received | MetalFlow Gutters" },
      {
        property: "og:description",
        content: "Your gutter quote request was received. Our team will reach out shortly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FormReceivedPage,
});

function FormReceivedPage() {
  const t = useT();
  return (
    <main className="py-20 md:py-28">
      <div className="container-x max-w-2xl text-center">
        <CheckCircle2 className="mx-auto size-16 text-primary" />
        <h1 className="mt-6 text-3xl font-bold uppercase leading-tight md:text-4xl">
          {t("Request received")}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {t("Your request is in our system. Our team will reach out shortly.")}
        </p>
        <p className="mt-2 text-sm uppercase tracking-[0.25em] text-primary">
          {t("QUALITY THAT CHANNELS EVERY DROP")}
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <a href={SITE.phoneHref}>
            <Button size="lg" className="w-full">
              <Phone className="size-4" />
              {SITE.phone}
            </Button>
          </a>
          <a href={`mailto:${SITE.email}`}>
            <Button size="lg" variant="outline" className="w-full">
              <Mail className="size-4" />
              {t("Email us")}
            </Button>
          </a>
        </div>

        <div className="mt-8">
          <Link to="/" className="text-sm font-semibold uppercase tracking-widest text-primary">
            {t("Back to home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
