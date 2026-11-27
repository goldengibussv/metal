import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Phone, Menu, X } from "lucide-react";
import logoAsset from "@/assets/metalflow-brand-white.png.asset.json";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import { useQuote } from "@/components/QuoteDialog";
import { useLang } from "@/lib/i18n";

const nav = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { t, lang, setLang } = useLang();
  const { open } = useQuote();
  const [menu, setMenu] = useState(false);

  return (
    <header className="site-header fixed top-0 z-50 w-full border-b border-secondary-foreground/20 bg-secondary text-secondary-foreground">
      <div className="container-x grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:h-[74px]">
        <Link to="/" className="flex min-w-0 items-center">
          <img src={logoAsset.url} alt="MetalFlow LLC, Rain Gutters for Metal Roof" className="h-auto w-48 max-w-full object-contain sm:w-64 lg:w-72" width={1797} height={339} />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
          <nav className="hidden items-center gap-5 lg:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm font-semibold uppercase text-secondary-foreground/75 transition hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {t(n.label)}
              </Link>
            ))}
          </nav>
          <a
            href={SITE.phoneHref}
            className="hidden items-center gap-2 whitespace-nowrap text-sm font-bold text-secondary-foreground sm:inline-flex"
          >
            <Phone className="size-4 text-primary" />
            {SITE.phone}
          </a>
          <Button
            type="button"
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            aria-label="Language"
            variant="outline"
            className="hidden h-9 shrink-0 border-secondary-foreground/30 bg-secondary px-3 text-xs font-bold text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-primary sm:inline-flex"
          >
            {lang === "en" ? "ES" : "EN"}
          </Button>
          <Button
            type="button"
            onClick={open}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-xs font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary/85 sm:h-11 sm:px-5 sm:text-sm"
          >
            {t("Get Quote")}
          </Button>
          <Button
            type="button"
            aria-label="Menu"
            onClick={() => setMenu((v) => !v)}
            variant="ghost"
            size="icon"
            className="text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-primary lg:hidden"
          >
            {menu ? <X className="size-6" /> : <Menu className="size-6" />}
          </Button>
        </div>
      </div>

      {menu && (
        <div className="border-t border-secondary-foreground/20 bg-secondary lg:hidden">
          <div className="container-x flex flex-col py-4">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMenu(false)}
                className="py-3 text-sm font-semibold uppercase text-secondary-foreground"
              >
                {t(n.label)}
              </Link>
            ))}
            <a href={SITE.phoneHref} className="py-3 text-sm font-bold text-secondary-foreground">
              {SITE.phone}
            </a>
            <Button
              type="button"
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              variant="ghost"
              className="justify-start py-3 text-sm font-semibold text-secondary-foreground"
            >
              {lang === "en" ? "Español" : "English"}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
