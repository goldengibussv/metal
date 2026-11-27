import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SERVICES, SITE } from "@/lib/site";
import { CityField } from "@/components/CityField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact MetalFlow | Gutter Quotes in South Florida" },
      {
        name: "description",
        content:
          "Call MetalFlow LLC or send your project details for a fast gutter quote from Pompano Beach to Miami and across South Florida.",
      },
      { property: "og:title", content: "Contact MetalFlow | Gutter Quotes in South Florida" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Fast gutter quotes for installation, repair and cleaning in South Florida.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const t = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    service: SERVICES[0].name as string,
    message: "",
  });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error(t("Please add your name, email and phone."));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("quote_requests").insert({
      full_name: form.full_name.trim().slice(0, 120),
      email: form.email.trim().slice(0, 160),
      phone: form.phone.trim().slice(0, 40),
      address: form.address.trim().slice(0, 200),
      city: form.city.trim().slice(0, 80),
      service: form.service,
      message: form.message.trim().slice(0, 1000),
      mode: "contact",
    });
    setSaving(false);
    if (error) {
      toast.error(t("We could not send your message. Please call us."));
      return;
    }
    toast.success(t("Message sent. We will contact you shortly."));
    void navigate({ to: "/form-received" });
  };

  return (
    <main className="py-16 md:py-20">
      <div className="container-x grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{t("Contact")}</p>
          <h1 className="mt-3 text-4xl font-bold uppercase leading-tight md:text-5xl">{t("Talk to MetalFlow")}</h1>
          <p className="mt-5 text-muted-foreground">
            {t("Send your details and our team responds fast, or call now and get answers on the spot.")}
          </p>

          <div className="mt-8 space-y-4">
            <a href={SITE.phoneHref} className="flex items-center gap-3 rounded-lg border border-border p-4">
              <Phone className="size-5 shrink-0 text-primary" />
              <span className="font-semibold">{SITE.phone}</span>
            </a>
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 rounded-lg border border-border p-4">
              <Mail className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 break-all font-semibold">{SITE.email}</span>
            </a>
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <MapPin className="size-5 shrink-0 text-primary" />
              <span className="font-semibold">{SITE.address}, {SITE.city}</span>
            </div>
          </div>
          <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
            {t("Licensed and insured")}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 md:p-8">
          {sent ? (
            <div className="py-10 text-center">
              <h2 className="text-2xl font-bold uppercase">{t("Thank you")}</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("Your request is in our system. Our team will reach out shortly.")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("Full name")}</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("Phone")}</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("Email")}</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("City")}</Label>
                  <CityField value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("Address")}</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Service")}</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                >
                  {SERVICES.map((s) => (
                    <option key={s.slug} value={s.name}>{t(s.name)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("How can we help?")}</Label>
                <Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              <Button size="lg" className="w-full" disabled={saving} onClick={submit}>
                {saving ? t("Sending") : t("Send message")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
