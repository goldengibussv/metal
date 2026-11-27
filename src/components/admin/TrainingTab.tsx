import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Pt = { x: number; y: number };
type Row = {
  id: string;
  address: string;
  image_path: string | null;
  sketch_image_path: string | null;
  notes: string;
  sketch: unknown;
  created_at: string;
};

async function signed(path: string) {
  const { data } = await supabase.storage.from("aerials").createSignedUrl(path, 3600);
  return data?.signedUrl ?? "";
}

export function TrainingTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [sketchPreview, setSketchPreview] = useState("");
  const [outline, setOutline] = useState<Pt[]>([]);
  const [slopes, setSlopes] = useState<Pt[][]>([]);
  const [draft, setDraft] = useState<Pt[]>([]);
  const [mode, setMode] = useState<"outline" | "slope">("outline");
  const [saving, setSaving] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("roof_training")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!sketchFile) return setSketchPreview("");
    const url = URL.createObjectURL(sketchFile);
    setSketchPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [sketchFile]);

  const point = (e: React.MouseEvent) => {
    const el = svgRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const onClick = (e: React.MouseEvent) => {
    const p = point(e);
    if (!p) return;
    if (mode === "outline") setOutline((o) => [...o, p]);
    else setDraft((d) => [...d, p]);
  };

  const endSlope = () => {
    if (draft.length >= 2) setSlopes((s) => [...s, draft]);
    setDraft([]);
  };

  const reset = () => {
    setAddress("");
    setNotes("");
    setFile(null);
    setSketchFile(null);
    setOutline([]);
    setSlopes([]);
    setDraft([]);
  };

  const save = async () => {
    if (!address.trim()) return toast.error("Add the address.");
    if (!file) return toast.error("Upload the satellite image.");
    if (outline.length < 3 && !sketchFile) {
      return toast.error("Draw the roof outline or upload the final sketch image.");
    }
    setSaving(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `training/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("aerials").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;

      let sketchPath: string | null = null;
      if (sketchFile) {
        const sext = sketchFile.name.split(".").pop() || "png";
        sketchPath = `training/sketch-${crypto.randomUUID()}.${sext}`;
        const sup = await supabase.storage
          .from("aerials")
          .upload(sketchPath, sketchFile, { contentType: sketchFile.type });
        if (sup.error) throw sup.error;
      }

      const { error } = await supabase.from("roof_training").insert({
        address: address.trim(),
        image_path: path,
        sketch_image_path: sketchPath,
        notes: notes.trim(),
        sketch: { outline, slopes },
      });
      if (error) throw error;
      toast.success("Training example saved");
      reset();
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the example");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    const paths = [row.image_path, row.sketch_image_path].filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("aerials").remove(paths);
    const { error } = await supabase.from("roof_training").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    void load();
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="font-bold uppercase">New training example</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Satellite image</Label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Final sketch image</Label>
            <Input type="file" accept="image/*" onChange={(e) => setSketchFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">
              The finished technical drawing for this house. The AI compares it with the satellite image.
            </p>
            {sketchPreview ? (
              <img
                src={sketchPreview}
                alt="Final sketch"
                className="mt-2 block max-h-64 rounded border border-border"
              />
            ) : null}
          </div>
        </div>


        {preview ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={mode === "outline" ? "default" : "outline"} onClick={() => setMode("outline")}>
                Roof outline
              </Button>
              <Button size="sm" variant={mode === "slope" ? "default" : "outline"} onClick={() => setMode("slope")}>
                Slope lines
              </Button>
              {mode === "slope" ? (
                <Button size="sm" variant="outline" onClick={endSlope}>
                  Finish line
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => { setOutline([]); setSlopes([]); setDraft([]); }}>
                Clear
              </Button>
            </div>
            <div className="relative overflow-hidden rounded-lg border border-border">
              <img src={preview} alt="Training aerial" className="block w-full select-none" />
              <svg
                ref={svgRef}
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full cursor-crosshair"
                onClick={onClick}
              >
                {outline.length > 1 ? (
                  <polygon
                    points={outline.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="#000"
                    strokeWidth={0.004}
                  />
                ) : null}
                {[...slopes, draft].map((line, i) =>
                  line.length > 1 ? (
                    <polyline
                      key={i}
                      points={line.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke="#fbcaa4"
                      strokeWidth={0.004}
                    />
                  ) : null,
                )}
                {outline.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={0.006} fill="#000" />
                ))}
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">
              Click to add points. Outline in black, slope lines in orange.
            </p>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label>Notes about how this sketch was measured</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving" : "Save example"}
        </Button>
      </div>

      <div className="space-y-4">
        {rows.length === 0 ? <p className="text-muted-foreground">No training examples yet.</p> : null}
        {rows.map((r) => (
          <TrainingRow key={r.id} row={r} onDelete={() => remove(r)} />
        ))}
      </div>
    </div>
  );
}

function TrainingRow({ row, onDelete }: { row: Row; onDelete: () => void }) {
  const [url, setUrl] = useState("");
  const [sketchUrl, setSketchUrl] = useState("");
  useEffect(() => {
    if (row.image_path) void signed(row.image_path).then(setUrl);
  }, [row.image_path]);
  useEffect(() => {
    if (row.sketch_image_path) void signed(row.sketch_image_path).then(setSketchUrl);
  }, [row.sketch_image_path]);
  const sketch = (row.sketch ?? {}) as { outline?: Pt[]; slopes?: Pt[][] };
  return (
    <div className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[160px_160px_minmax(0,1fr)_auto]">
      <div className="relative overflow-hidden rounded border border-border">
        {url ? <img src={url} alt={row.address} className="block w-full" /> : null}
        <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {sketch.outline && sketch.outline.length > 1 ? (
            <polygon points={sketch.outline.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#000" strokeWidth={0.006} />
          ) : null}
          {(sketch.slopes ?? []).map((l, i) => (
            <polyline key={i} points={l.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#fbcaa4" strokeWidth={0.006} />
          ))}
        </svg>
      </div>
      <div className="overflow-hidden rounded border border-border">
        {sketchUrl ? (
          <img src={sketchUrl} alt="Final sketch" className="block w-full" />
        ) : (
          <p className="p-2 text-xs text-muted-foreground">No final sketch image</p>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold uppercase">{row.address}</p>
        <p className="mt-1 text-sm text-muted-foreground">{row.notes}</p>
        <p className="mt-1 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
      </div>
      <Button variant="outline" onClick={onDelete}>Delete</Button>
    </div>
  );
}
