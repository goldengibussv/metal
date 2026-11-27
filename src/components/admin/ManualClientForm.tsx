import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MANUAL_SERVICES = ["Gutter Installation", "Gutter Replacement", "Leaf Guard", "Metal Roof Installation"];

export function ManualClientForm({ onCreated }: { onCreated: (id: string) => void }) {
  const empty = { full_name: "", phone: "", email: "", address: "", city: "", service: MANUAL_SERVICES[0], message: "" };
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof empty, v: string) => setF((c) => ({ ...c, [k]: v }));

  const save = async () => {
    if (!f.full_name.trim() || !f.phone.trim() || !f.address.trim()) {
      toast.error("Name, phone and address are required.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("quote_requests")
      .insert({ ...f, email: f.email.trim(), mode: "manual", status: "new" })
      .select("id")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Client added");
    setF(empty);
    setOpen(false);
    onCreated(data.id);
  };

  if (!open) return <Button onClick={() => setOpen(true)}>Add client manually</Button>;

  return (
    <div className="rounded-lg border border-border bg-card p-5 text-sm">
      <p className="font-bold uppercase">New client</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label>Full name</Label><Input value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
        <div className="space-y-1"><Label>Phone</Label><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div className="space-y-1"><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="space-y-1">
          <Label>Service</Label>
          <select className="h-9 w-full rounded-md border border-input bg-background px-3" value={f.service} onChange={(e) => set("service", e.target.value)}>
            {MANUAL_SERVICES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1"><Label>Address</Label><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
        <div className="space-y-1"><Label>City</Label><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={f.message} onChange={(e) => set("message", e.target.value)} /></div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save and open estimate"}</Button>
        <Button variant="outline" onClick={() => { setOpen(false); setF(empty); }}>Cancel</Button>
      </div>
    </div>
  );
}
