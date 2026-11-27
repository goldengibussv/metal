import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import { CityField } from "@/components/CityField";

export const ROOF_SERVICE = "Metal Roof Installation";

type RoofContact = {
  full_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  message: string;
};

const emptyContact: RoofContact = {
  full_name: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  message: "",
};

export function RoofQuoteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const navigate = useNavigate();
  const [contact, setContact] = useState<RoofContact>(emptyContact);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!contact.full_name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      toast.error(t("Please add your name, email and phone."));
      return;
    }
    if (!consent) {
      toast.error(t("Please accept to be contacted about your quote."));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("quote_requests").insert({
      full_name: contact.full_name.trim().slice(0, 120),
      email: contact.email.trim().slice(0, 160),
      phone: contact.phone.trim().slice(0, 40),
      address: contact.address.trim().slice(0, 200),
      city: contact.city.trim().slice(0, 80),
      service: ROOF_SERVICE,
      message: contact.message.trim().slice(0, 1000),
      mode: "inspection",
      details: {},
      estimate: null,
    });
    setSaving(false);
    if (error) {
      toast.error(t("We could not send your request. Please call us."));
      return;
    }
    onOpenChange(false);
    setContact(emptyContact);
    setConsent(false);
    void navigate({ to: "/form-received" });
  };

  const close = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) onOpenChange(true);
        else close();
      }}
    >
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase">{t("Metal roof installation quote")}</DialogTitle>
          <DialogDescription>
            {t("Tell us about your property and our team will confirm the price for your new metal roof.")}
          </DialogDescription>
        </DialogHeader>

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
            <div className="space-y-1.5">
              <Label>{t("Details")}</Label>
              <Textarea rows={3} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} />
            </div>
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
            <Button className="w-full" size="lg" disabled={saving} onClick={() => void submit()}>
              {saving ? t("Sending") : t("Send request")}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
