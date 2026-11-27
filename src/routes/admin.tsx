import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { displayEmail, money } from "@/lib/quote";
import { EstimateEditor } from "@/components/admin/EstimateEditor";
import { TrainingTab } from "@/components/admin/TrainingTab";
import { ManualClientForm } from "@/components/admin/ManualClientForm";

const VISIBLE_PRICE_KEYS = new Set([
  "gutter_flatface_6", "gutter_flatface_7", "gutter_flatface_8",
  "gutter_onepencil_6", "gutter_onepencil_7", "gutter_onepencil_8",
  "gutter_doublepencil_6", "gutter_doublepencil_7", "gutter_doublepencil_8",
  "gutter_kstyle_6",
  "downspout_3x4", "downspout_4x5",
  "leaf_guard_6", "leaf_guard_7", "leaf_guard_8",
]);


export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin | MetalFlow" },
      { name: "description", content: "MetalFlow internal admin panel." },
      { property: "og:title", content: "MetalFlow Admin" },
      { property: "og:description", content: "MetalFlow internal estimate and operations panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
  };

  if (!ready) return <div className="container-x py-24 text-muted-foreground">Loading</div>;

  if (!userId) {
    return (
      <main className="container-x flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6">
          <h1 className="font-display text-2xl font-bold uppercase">Admin sign in</h1>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" onClick={signIn}>Sign in</Button>
        </div>

      </main>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const reviews = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const pricing = useQuery({
    queryKey: ["admin-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing").select("*").order("category").order("key");
      if (error) throw error;
      return data;
    },
  });

  const settings = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").order("key");
      if (error) throw error;
      return data;
    },
  });

  const requests = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    qc.invalidateQueries();
  };

  const [newReview, setNewReview] = useState({ author: "", rating: 5, body: "", city: "", source: "Google" });

  const addReview = async () => {
    if (!newReview.author.trim() || !newReview.body.trim()) {
      toast.error("Author and review text are required.");
      return;
    }
    const { error } = await supabase.from("reviews").insert(newReview);
    if (error) return toast.error(error.message);
    setNewReview({ author: "", rating: 5, body: "", city: "", source: "Google" });
    toast.success("Review added");
    refresh();
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const savePrice = async (key: string, price: number) => {
    const { error } = await supabase.from("pricing").update({ price }).eq("key", key);
    if (error) return toast.error(error.message);
    toast.success("Price saved");
    refresh();
  };

  const saveSetting = async (key: string, value: string) => {
    const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    refresh();
  };

  return (
    <main className="container-x py-12">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <h1 className="truncate font-display text-3xl font-bold uppercase">MetalFlow Admin</h1>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>

      <Tabs defaultValue="requests" className="mt-8">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>


        <TabsContent value="requests" className="mt-6 space-y-4">
          <ManualClientForm onCreated={(id) => { refresh(); setOpenId(id); }} />
          {(requests.data ?? []).length === 0 && <p className="text-muted-foreground">No requests yet.</p>}
          {(requests.data ?? []).map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card p-5 text-sm print:border-0 print:p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                <p className="font-bold uppercase">{r.full_name} <span className="text-muted-foreground">{r.service}</span></p>
                <span className={`text-xs uppercase tracking-widest ${r.status === "incomplete" ? "text-muted-foreground" : "text-primary"}`}>
                  {r.status === "incomplete" ? "Lead in progress" : r.mode}
                </span>
              </div>
              <div className="print:hidden">
                <p className="mt-2 text-muted-foreground">{[r.phone, displayEmail(r.email)].filter(Boolean).join(" · ")}</p>
                <p className="text-muted-foreground">{[r.address, r.city].filter(Boolean).join(", ")}</p>
                {r.estimate ? <p className="mt-2 font-bold">Estimate {money(Number(r.estimate))}</p> : null}
                {r.message ? <p className="mt-2 text-muted-foreground">{r.message}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                  {openId === r.id ? "Close estimate" : "Open estimate"}
                </Button>
              </div>
              {openId === r.id ? <EstimateEditor request={r as never} onClose={() => setOpenId(null)} /> : null}
            </div>
          ))}
        </TabsContent>
        <TabsContent value="training" className="mt-6">
          <TrainingTab />
        </TabsContent>



        <TabsContent value="reviews" className="mt-6 space-y-6">
          <div className="space-y-3 rounded-lg border border-border bg-card p-5">
            <h2 className="font-bold uppercase">Add review</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Author" value={newReview.author} onChange={(e) => setNewReview({ ...newReview, author: e.target.value })} />
              <Input placeholder="City" value={newReview.city} onChange={(e) => setNewReview({ ...newReview, city: e.target.value })} />
              <Input placeholder="Source" value={newReview.source} onChange={(e) => setNewReview({ ...newReview, source: e.target.value })} />
              <Input
                type="number"
                min={1}
                max={5}
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)) })}
              />
            </div>
            <Textarea rows={3} placeholder="Review text" value={newReview.body} onChange={(e) => setNewReview({ ...newReview, body: e.target.value })} />
            <Button onClick={addReview}>Add review</Button>
          </div>

          {(reviews.data ?? []).map((r) => (
            <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-lg border border-border p-5">
              <div className="min-w-0">
                <p className="font-bold uppercase">{r.author} · {r.rating} stars</p>
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </div>
              <Button variant="outline" onClick={() => deleteReview(r.id)}>Delete</Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="pricing" className="mt-6 space-y-3">
          {(pricing.data ?? []).filter((p) => VISIBLE_PRICE_KEYS.has(p.key)).map((p) => (
            <PriceRow key={p.key} label={p.label} value={Number(p.price)} onSave={(v) => savePrice(p.key, v)} />
          ))}
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-3">
          {(settings.data ?? []).map((s) => (
            <SettingRow
              key={s.key}
              label={s.label || s.key}
              value={s.value}
              multiline={s.key.includes("prompt") || s.key === "estimate_contractual_terms"}
              onSave={(v) => saveSetting(s.key, v)}
            />
          ))}
        </TabsContent>

      </Tabs>
    </main>
  );
}

function PriceRow({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-4">
      <span className="min-w-0 truncate text-sm">{label}</span>
      <div className="flex shrink-0 items-center gap-2">
        <Input className="w-28" type="number" step="0.01" value={v} onChange={(e) => setV(e.target.value)} />
        <Button variant="outline" onClick={() => onSave(Number(v) || 0)}>Save</Button>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  value,
  onSave,
  multiline,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
}) {
  const [v, setV] = useState(value);
  return (
    <div className="grid gap-2 rounded-lg border border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {multiline ? (
          <Textarea className="mt-2" rows={8} value={v} onChange={(e) => setV(e.target.value)} />
        ) : (
          <Input className="mt-2" value={v} onChange={(e) => setV(e.target.value)} />
        )}
      </div>
      <Button variant="outline" className="sm:mt-6" onClick={() => onSave(v)}>Save</Button>
    </div>
  );
}

