import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/metalflow-brand-white.png.asset.json";
import { SITE, SERVICES, SERVICE_AREAS } from "@/lib/site";
import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="border-t border-primary/20 bg-secondary text-secondary-foreground">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div>
          <img src={logoAsset.url} alt="MetalFlow LLC" className="h-auto w-full max-w-72 object-contain" width={1797} height={339} />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {t("Modern gutters made for metal roofs, plus complete installation, repair and cleaning in")}{" "}
            {SITE.city}.
          </p>
          <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{t("Licensed and insured")}</p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">{t("Quick Links")}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/" className="text-muted-foreground hover:text-primary">{t("Home")}</Link></li>
            <li><Link to="/services" className="text-muted-foreground hover:text-primary">{t("Services")}</Link></li>
            <li><Link to="/contact" className="text-muted-foreground hover:text-primary">{t("Contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">{t("Services")}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link to="/services" className="text-muted-foreground hover:text-primary">{t(s.name)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">{t("Service Areas")}</h3>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {SERVICE_AREAS.map((a) => (
              <li key={a.slug}>
                <Link to="/service-areas/$city" params={{ city: a.slug }} className="text-muted-foreground hover:text-primary">
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 text-sm">
            <a href={SITE.phoneHref} className="block font-bold text-foreground">{SITE.phone}</a>
            <a href={`mailto:${SITE.email}`} className="block break-all text-muted-foreground hover:text-primary">
              {SITE.email}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-secondary-foreground/15">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.legal}. {t("All rights reserved.")}</p>
          <p>{t("Manufactured and installed in")} {SITE.city}</p>
        </div>
      </div>
    </footer>
  );
}
