import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePricing, useSettings } from "@/hooks/use-site-data";
import { SERVICES, SERVICE_AREAS } from "@/lib/site";
import { STYLES, allowedDownspouts, calculateQuote, money, type CalcInput, type StyleKey } from "@/lib/quote";
import { ClipboardCheck, Calculator, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import { CityField } from "@/components/CityField";

type QuoteCtx = { open: () => void };
const Ctx = createContext<QuoteCtx>({ open: () => {} });
export const useQuote = () => useContext(Ctx);

type Step = "choose" | "calculator" | "estimate" | "form" | "done";

const emptyContact = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  service: SERVICES[0].name as string,
  message: "",
};

const emptyCalc: CalcInput = {
  style: "flatface",
  size: 6,
  feet: 0,
  ds3x4Feet: 0,
  ds4x5Feet: 0,
  leafGuard: false,
};

export function QuoteProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [mode, setMode] = useState<"inspection" | "calculator">("inspection");
  const [contact, setContact] = useState(emptyContact);
  const [calc, setCalc] = useState<CalcInput>(emptyCalc);
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  const { data: prices } = usePricing();
  const { data: settings } = useSettings();

  const [dsType, setDsType] = useState<"3x4" | "4x5">("3x4");
  const [dsFeet, setDsFeet] = useState(0);
  const effType = calc.size === 8 ? "4x5" : dsType;
  const fullCalc: CalcInput = { ...calc, ds3x4Feet: effType === "3x4" ? dsFeet : 0, ds4x5Feet: effType === "4x5" ? dsFeet : 0 };
  const result = useMemo(() => calculateQuote(fullCalc, prices, settings), [calc, dsFeet, effType, prices, settings]);

  const open = () => {
    setStep("choose");
    setMode("inspection");
    setContact(emptyContact);
    setCalc(emptyCalc);
    setDsFeet(0);
    setDsType("3x4");
    setConsent(false);
    setLeadId(null);
    setIsOpen(true);
  };

  const styleOptions = STYLES.filter((s) => s.sizes.includes(calc.size));

  const isInstall = contact.service === SERVICES[0].name;

  const validContact = () => {
    if (!contact.full_name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      toast.error(t("Please add your name, email and phone."));
      return false;
    }
    if (!consent) {
      toast.error(t("Please accept to be contacted about your quote."));
      return false;
    }
    return true;
  };

  const contactPayload = () => ({
    full_name: contact.full_name.trim().slice(0, 120),
    email: contact.email.trim().slice(0, 160),
    phone: contact.phone.trim().slice(0, 40),
    address: contact.address.trim().slice(0, 200),
    city: contact.city.trim().slice(0, 80),
    service: contact.service,
    message: contact.message.trim().slice(0, 1000),
  });

  // Saves the contact right away so we never lose the lead if they drop off.
  const saveLead = async () => {
    if (!validContact()) return false;
    if (leadId) return true;
    const id = crypto.randomUUID();
    setSaving(true);
    const { error } = await supabase.from("quote_requests").insert({
      id,
      ...contactPayload(),
      mode: "calculator",
      status: "incomplete",
      details: {},
      estimate: null,
    });
    setSaving(false);
    if (error) {
      toast.error(t("We could not send your request. Please call us."));
      return false;
    }
    setLeadId(id);
    return true;
  };

  const submit = async () => {
    if (!validContact()) return;
    const useCalc = mode === "calculator" && isInstall && step === "estimate";
    setSaving(true);
    let error = null as unknown;
    if (useCalc && leadId) {
      const res = await supabase.rpc("finalize_quote_request", {
        _id: leadId,
        _estimate: Number(result.total.toFixed(2)),
        _details: { ...fullCalc, downspoutType: effType, downspoutFeet: dsFeet, breakdown: result } as never,
      });
      error = res.error;
    } else {
      const res = await supabase.from("quote_requests").insert({
        ...contactPayload(),
        mode: useCalc ? "calculator" : "inspection",
        details: useCalc ? ({ ...calc, breakdown: result } as never) : {},
        estimate: useCalc ? Number(result.total.toFixed(2)) : null,
      });
      error = res.error;
    }
    setSaving(false);
    if (error) {
      toast.error(t("We could not send your request. Please call us."));
      return;
    }
    setIsOpen(false);
    setStep("choose");
    void navigate({ to: "/form-received" });
  };


  const numberField = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    hint?: string,
  ) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );

  const contactForm = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("Full name")}</Label>
          <Input value={contact.full_name} onChange={(e) => setContact({ ...contact, full_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("Phone")}</Label>
          <Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("Email")}</Label>
          <Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("City")}</Label>
          <CityField value={contact.city} onChange={(v) => setContact({ ...contact, city: v })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t("Address")}</Label>
        <Input value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
      </div>
      {mode === "calculator" ? null : (
      <div className="space-y-1.5">
        <Label>{t("Service")}</Label>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={contact.service}
          onChange={(e) => setContact({ ...contact, service: e.target.value })}
        >
          {SERVICES.map((s) => (
            <option key={s.slug} value={s.name}>{t(s.name)}</option>
          ))}
        </select>
      </div>
      )}
      {mode === "calculator" ? null : (
      <div className="space-y-1.5">
        <Label>{t("Details")}</Label>
        <Textarea rows={3} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} />
      </div>
      )}
      <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          className="mt-0.5 size-3.5 accent-[hsl(var(--primary))]"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          {t("I agree to be contacted by phone, text or email about my quote. Your information stays private and is only used for this request.")}
        </span>
      </label>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep("choose")} className="shrink-0">
          <ArrowLeft className="size-4" />
        </Button>
        <Button
          className="flex-1"
          size="lg"
          disabled={saving}
          onClick={() => {
            if (mode === "calculator" && isInstall) {
              void saveLead().then((ok) => {
                if (ok) setStep("calculator");
              });
              return;
            }
            void submit();
          }}
        >
          {mode === "calculator" && isInstall
            ? t("Continue")
            : saving
              ? t("Sending")
              : t("Send request")}
        </Button>
      </div>

    </div>
  );

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase">
              {step === "done" ? t("Request received") : t("Get your quote")}
            </DialogTitle>
            <DialogDescription>
              {step === "choose"
                ? t("Choose how you want your price.")
                : step === "calculator"
                  ? t("Tell us about your home and get an instant quote.")
                  : step === "estimate"
                    ? t("This is your instant quote for standard installation.")
                    : step === "done"
                      ? t("We will contact you shortly.")
                      : mode === "calculator"
                        ? t("First, tell us how to reach you.")
                        : t("Last step, how can we reach you.")}

            </DialogDescription>
          </DialogHeader>

          {step === "choose" && (
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("inspection");
                  setStep("form");
                }}
                className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary"
              >
                <ClipboardCheck className="mt-1 size-6 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold">{t("Request a personalized inspection")}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {t("For new installations, repairs or cleaning. Our team visits, measures and confirms the final price.")}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("calculator");
                  setContact({ ...emptyContact, service: SERVICES[0].name });
                  setStep("form");
                }}

                className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary"
              >
                <Calculator className="mt-1 size-6 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold">{t("Instant price for a new installation")}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {t("Enter a few details about your home and see your price right now.")}
                  </span>
                </span>
              </button>
            </div>
          )}

          {step === "calculator" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("Gutter size")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[6, 7, 8].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        const allowed = STYLES.filter((s) => s.sizes.includes(size));
                        const style: StyleKey = allowed.some((s) => s.key === calc.style)
                          ? calc.style
                          : allowed[0].key;
                        setCalc({ ...calc, size, style });
                      }}
                      className={`h-11 rounded-md border text-sm font-semibold transition ${
                        calc.size === size ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {size} {t("inch")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("Style")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {styleOptions.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setCalc({ ...calc, style: s.key })}
                      className={`h-11 rounded-md border px-1 text-xs font-semibold transition sm:text-sm ${
                        calc.style === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {numberField(t("How many feet of gutter do you need?"), calc.feet, (v) => setCalc({ ...calc, feet: v }))}

              {null}


              {numberField(
                t("How many linear feet of downspout do you need?"),
                dsFeet,
                (v) => setDsFeet(v),
                t("All downspouts are corrugated. You can leave this at zero."),
              )}

              <div className="space-y-1.5">
                <Label>{t("Downspout size")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {allowedDownspouts(calc.size).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDsType(d)}
                      className={`h-11 rounded-md border text-sm font-semibold transition ${
                        effType === d ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {d} {t("corrugated")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("form")} className="shrink-0">

                  <ArrowLeft className="size-4" />
                </Button>
                <Button
                  className="flex-1"
                  disabled={calc.feet <= 0}
                  onClick={() => setStep("estimate")}
                >
                  {t("See my price")}
                </Button>
              </div>
            </div>
          )}

          {step === "estimate" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/40 bg-card p-5 text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-primary">{t("Instant quote")}</p>
                <p className="mt-2 font-display text-4xl font-bold">{money(result.total)}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("Price includes labor, high quality installation, hangers, screws, corner material and waste, and everything needed. No hidden fees, pay exactly this and get your gutters.")}
                </p>
              </div>
              <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
                <Row l="Gutter style" r={STYLES.find((style) => style.key === calc.style)?.name ?? "Flat Face"} />
                <Row l="Gutter size" r={`${calc.size} ${t("inch")}`} />
                <Row l="Gutter feet" r={`${result.clientFeet} ft`} />
                <Row l={`Downspouts ${effType} corrugated`} r={`${dsFeet} ft`} />
                {calc.leafGuard ? <Row l="Leaf guard" r={t("Included")} /> : null}
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[hsl(var(--primary))]"
                  checked={calc.leafGuard}
                  onChange={(e) => setCalc({ ...calc, leafGuard: e.target.checked })}
                />
                <span>
                  <span className="block font-semibold">{t("Add leaf guard and forget about cleaning your gutters")}</span>
                  <span className="mt-1 block text-muted-foreground">
                    {t("Check this box to include leaf protection with your installation.")}
                  </span>
                </span>
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("calculator")} className="shrink-0">
                  <ArrowLeft className="size-4" />
                </Button>
                <Button className="flex-1" disabled={saving} onClick={() => void submit()}>
                  {saving ? t("Sending") : t("Lock this price")}
                </Button>
              </div>

            </div>
          )}

          {step === "form" && contactForm}

          {step === "done" && (
            <div className="space-y-4 py-2 text-center">
              <CheckCircle2 className="mx-auto size-12 text-primary" />
              <p className="text-sm text-muted-foreground">
                {t("Thanks. Your request is in our system and our team will reach out shortly.")}
              </p>
              <Button className="w-full" onClick={() => setIsOpen(false)}>
                {t("Close")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

function Row({ l, r }: { l: string; r: string }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{t(l)}</span>
      <span className="font-semibold">{r}</span>
    </div>
  );
}
