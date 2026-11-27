import { useEffect, useMemo, useRef, useState } from "react";
import { Crop, FileImage, House, Save, Sparkles, Trash2, Upload } from "lucide-react";
import { AerialCropper } from "./AerialCropper";
import { EstimateContractPage } from "./EstimateContractPage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAerial, aerialImage, detectRoof, type RoofEdge } from "@/lib/aerial.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateQuote, displayEmail, money, STYLES, type StyleKey } from "@/lib/quote";
import { usePricing, useSettings } from "@/hooks/use-site-data";
import { SITE } from "@/lib/site";
import logoAsset from "@/assets/metalflow-brand-dark.png.asset.json";

type Pt = { x: number; y: number };
type Line = { pts: Pt[]; label: string };
export type Sketch = {
  lines: Line[];
  drops: Pt[];
  roofs: RoofEdge[];
  zoom: number;
  outline?: Pt[];
  /** indices of perimeter segments that get NO gutter */
  noGutter?: number[];
  heading?: number;
  scale?: number;
  tx?: number;
  ty?: number;
  lat?: number;
  lng?: number;
  hideImage?: boolean;
};




export type EstimateData = {
  date: string;
  style: string;
  size: string;
  feet: string;
  dsType: "3x4" | "4x5" | "both";
  ds34: string;
  ds45: string;
  leafGuard: boolean;
  total: string;
  deposit: string;
  notes: string;
  extras: { label: string; amount: string }[];
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
};

type RequestRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  estimate: number | null;
  details: Record<string, unknown> | null;
  aerial_url: string | null;
  sketch: unknown;
  estimate_data: unknown;
};

const emptySketch: Sketch = { lines: [], drops: [], roofs: [], zoom: 21 };

function buildEstimate(r: RequestRow): EstimateData {
  const saved = (r.estimate_data ?? {}) as Partial<EstimateData>;
  const d = (r.details ?? {}) as Record<string, unknown>;
  const s = (k: string) => (d[k] === undefined || d[k] === null ? "" : String(d[k]));
  return {
    date: saved.date ?? new Date().toISOString().slice(0, 10),
    style: (() => {
      const value = saved.style ?? s("style");
      if (value === "K Style") return "K Style";
      const match = STYLES.find((option) => option.key === value || option.name === value);
      return match?.name ?? "Flat Face";
    })(),
    size: saved.size ?? s("size"),
    feet: saved.feet ?? s("feet"),
    dsType: saved.dsType ?? (Number(s("ds3x4Feet")) > 0 && Number(s("ds4x5Feet")) > 0 ? "both" : Number(s("ds4x5Feet")) > 0 || s("size") === "8" ? "4x5" : "3x4"),
    ds34: saved.ds34 ?? s("ds3x4Feet"),
    ds45: saved.ds45 ?? s("ds4x5Feet"),
    leafGuard: saved.leafGuard ?? d["leafGuard"] === true,
    total: saved.total ?? (r.estimate ? String(r.estimate) : ""),
    deposit: saved.deposit ?? "",
    notes: saved.notes ?? "",
    extras: saved.extras ?? [],
    fullName: saved.fullName ?? r.full_name,
    phone: saved.phone ?? r.phone,
    email: displayEmail(saved.email ?? r.email),
    address: saved.address ?? r.address ?? "",
    city: saved.city ?? r.city ?? "",
  };
}

export function EstimateEditor({ request, onClose }: { request: RequestRow; onClose: () => void }) {
  const { data: prices } = usePricing();
  const { data: settings } = useSettings();
  const [sketch, setSketch] = useState<Sketch>(() => {
    const s = request.sketch as Sketch | null;
    return s && Array.isArray(s.lines) ? { ...emptySketch, ...s } : emptySketch;
  });
  const [est, setEst] = useState<EstimateData>(() => buildEstimate(request));
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(() => {
    const s = request.sketch as Sketch | null;
    return s && typeof s.lat === "number" && typeof s.lng === "number" ? { lat: s.lat, lng: s.lng } : null;
  });
  const [loadingImg, setLoadingImg] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const [manualPath, setManualPath] = useState<string | null>(request.aerial_url);
  const [uploadingManual, setUploadingManual] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [cropped, setCropped] = useState(false);
  const [originalImg, setOriginalImg] = useState<string | null>(null);
  const [mode, setMode] = useState<"line" | "outline" | "move" | "edges">("line");
  const [draft, setDraft] = useState<Pt[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [panFrom, setPanFrom] = useState<Pt | null>(null);
  const heading = sketch.heading ?? 0;
  const outline = sketch.outline ?? [];
  const noGutter = sketch.noGutter ?? [];
  const toggleEdge = (i: number) =>
    setSketch((s) => {
      const cur = s.noGutter ?? [];
      return { ...s, noGutter: cur.includes(i) ? cur.filter((n) => n !== i) : [...cur, i] };
    });

  const scale = sketch.scale ?? 1;
  const tx = sketch.tx ?? 0;
  const ty = sketch.ty ?? 0;
  const svgRef = useRef<SVGSVGElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const hideImage = sketch.hideImage === true;

  useEffect(() => {
    const style = est.style === "K Style"
      ? "kstyle"
      : STYLES.find((option) => option.name === est.style)?.key as StyleKey | undefined;
    const size = Number(est.size);
    if (!style || ![6, 7, 8].includes(size)) return;
    const result = calculateQuote({
      style,
      size,
      feet: Number(est.feet) || 0,
      ds3x4Feet: est.dsType !== "4x5" ? Number(est.ds34) || 0 : 0,
      ds4x5Feet: est.dsType !== "3x4" ? Number(est.ds45) || 0 : 0,
      leafGuard: est.leafGuard,
    }, prices, settings);
    const nextTotal = result.total.toFixed(2);
    setEst((current) => current.total === nextTotal ? current : { ...current, total: nextTotal });
  }, [est.style, est.size, est.feet, est.dsType, est.ds34, est.ds45, est.leafGuard, prices, settings]);

  // restore the saved capture automatically when the estimate is reopened
  useEffect(() => {
    if (imgUrl || !center || sketch.hideImage) return;
    let alive = true;
    setLoadingImg(true);
    aerialImage({ data: { lat: center.lat, lng: center.lng, zoom: sketch.zoom } })
      .then((img) => alive && setImgUrl(img.url))
      .catch(() => undefined)
      .finally(() => alive && setLoadingImg(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!request.aerial_url) return;
    let alive = true;
    supabase.storage
      .from("aerials")
      .createSignedUrl(request.aerial_url, 3600)
      .then(({ data }) => {
        if (alive && data?.signedUrl) setManualUrl(data.signedUrl);
      });
    return () => {
      alive = false;
    };
  }, [request.aerial_url]);



  const loadAerial = async (zoom: number) => {
    const address = [est.address, est.city, "Florida"].filter(Boolean).join(", ");
    if (!est.address) return toast.error("Add an address first.");
    setLoadingImg(true);
    try {
      const res = await fetchAerial({ data: { requestId: request.id, address, zoom, lat: center?.lat, lng: center?.lng } });
      setCenter({ lat: res.lat, lng: res.lng });
      setSketch((s) => ({ ...s, zoom, lat: res.lat, lng: res.lng }));
      const img = await aerialImage({ data: { lat: res.lat, lng: res.lng, zoom } });
      setImgUrl(img.url);
      setSketch((s) => ({ ...s, hideImage: false }));
      setOriginalImg(null);
      setCropped(false);
      toast.success("Satellite view loaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the aerial view");
    } finally {
      setLoadingImg(false);
    }
  };


  const aiSketch = async () => {
    if (!center) return toast.error("Load the satellite view first.");
    setAiBusy(true);
    try {
      const res = await detectRoof({
        data: { lat: center.lat, lng: center.lng, zoom: sketch.zoom, image: cropped && imgUrl ? imgUrl : undefined },
      });
      setSketch((s) => ({ ...s, outline: res.outline, roofs: res.slopes }));
      setMode("outline");
      toast.success("Roof sketch generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate the roof sketch");
    } finally {
      setAiBusy(false);
    }
  };

  // raw pointer position as a 0..1 fraction of the canvas
  const rawPoint = (e: React.MouseEvent) => {
    const el = svgRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  // pointer position converted into the sketch coordinate space (undo pan, scale and rotation)
  const point = (e: React.MouseEvent) => {
    const r = rawPoint(e);
    if (!r) return null;
    const dx = (r.x * 1000 - tx - 500) / scale;
    const dy = (r.y * 1000 - ty - 500) / scale;
    const a = (-heading * Math.PI) / 180;
    return {
      x: dx * Math.cos(a) - dy * Math.sin(a) + 500,
      y: dx * Math.sin(a) + dy * Math.cos(a) + 500,
    };
  };


  const onCanvasClick = (e: React.MouseEvent) => {
    if (mode === "move" || mode === "edges" || manualUrl) return;
    const raw = point(e);
    if (!raw) return;
    const p = { x: raw.x / 1000, y: raw.y / 1000 };
    if (mode === "outline") {

      if (outline.length < 3) return;
      // insert a new corner on the closest segment
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < outline.length; i++) {
        const a = outline[i];
        const b = outline[(i + 1) % outline.length];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const d = (mx - p.x) ** 2 + (my - p.y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      const next = [...outline.slice(0, best + 1), p, ...outline.slice(best + 1)];
      setOutline(next);
      return;
    }
    setDraft((d) => [...d, p]);
  };

  const setOutline = (pts: Pt[]) =>
    setSketch((s) => ({ ...s, outline: pts }));

  const onCanvasMove = (e: React.MouseEvent) => {
    if (panFrom) {
      const r = rawPoint(e);
      if (!r) return;
      const dx = (r.x - panFrom.x) * 1000;
      const dy = (r.y - panFrom.y) * 1000;
      setPanFrom(r);
      setSketch((s) => ({ ...s, tx: (s.tx ?? 0) + dx, ty: (s.ty ?? 0) + dy }));
      return;
    }
    if (dragIdx === null) return;
    const raw = point(e);
    if (!raw) return;
    const p = { x: raw.x / 1000, y: raw.y / 1000 };
    setOutline(outline.map((q, i) => (i === dragIdx ? p : q)));
  };

  const resize = (factor: number) =>
    setSketch((s) => ({ ...s, scale: Math.min(4, Math.max(0.3, (s.scale ?? 1) * factor)) }));


  const finishLine = () => {
    if (draft.length < 2) return setDraft([]);
    const label = window.prompt("Measurement for this run (feet)", "") ?? "";
    setSketch((s) => ({ ...s, lines: [...s.lines, { pts: draft, label }] }));
    setDraft([]);
  };

  const undo = () => {
    if (draft.length) return setDraft((d) => d.slice(0, -1));
    setSketch((s) => ({ ...s, lines: s.lines.slice(0, -1) }));
  };

  const uploadManualSketch = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Selecciona una imagen válida.");
    setUploadingManual(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `estimates/${request.id}/manual-${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("aerials").upload(path, file, { contentType: file.type });
      if (error) throw error;
      if (manualPath && manualPath.startsWith(`estimates/${request.id}/`)) {
        await supabase.storage.from("aerials").remove([manualPath]);
      }
      const { data } = await supabase.storage.from("aerials").createSignedUrl(path, 3600);
      if (!data?.signedUrl) throw new Error("No se pudo abrir la imagen cargada.");
      const saved = await supabase.from("quote_requests").update({ aerial_url: path }).eq("id", request.id);
      if (saved.error) throw saved.error;
      setManualPath(path);
      setManualUrl(data.signedUrl);
      setDraft([]);
      toast.success("Croquis manual cargado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el croquis manual");
    } finally {
      setUploadingManual(false);
      if (manualInputRef.current) manualInputRef.current.value = "";
    }
  };

  const save = async () => {
    const { error } = await supabase
      .from("quote_requests")
      .update({ sketch: sketch as never, estimate_data: est as never, aerial_url: manualPath })
      .eq("id", request.id);
    if (error) return toast.error(error.message);
    toast.success("Estimate saved");
  };

  const extrasTotal = useMemo(
    () => est.extras.reduce((a, x) => a + (Number(x.amount) || 0), 0),
    [est.extras],
  );
  const grand = (Number(est.total) || 0) + extrasTotal;

  const set = <K extends keyof EstimateData>(k: K, v: EstimateData[K]) => setEst((e) => ({ ...e, [k]: v }));

  return (
    <div className="mt-4 space-y-6 rounded-lg border border-border bg-background p-4 print:border-0 print:p-0">
      <div className="grid gap-4 print:hidden lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase">Croquis de la propiedad</p>
          <p className="mt-1 text-sm text-muted-foreground">Usa IA para una casa estándar o sube un croquis terminado para edificios complejos.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => loadAerial(sketch.zoom)} disabled={loadingImg}>
              <House /> {loadingImg ? "Buscando" : center ? "Actualizar casa" : "Buscar casa"}
            </Button>
            <Button size="sm" onClick={aiSketch} disabled={aiBusy || !center}>
              <Sparkles /> {aiBusy ? "Generando" : "Generar con IA"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCropping(true)} disabled={!imgUrl || !!manualUrl}>
              <Crop /> Rotar y recortar
            </Button>
            {cropped ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setImgUrl(originalImg); setOriginalImg(null); setCropped(false); }}
              >
                Quitar recorte
              </Button>
            ) : null}
            <input
              ref={manualInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadManualSketch(file);
              }}
            />
            <Button size="sm" variant="outline" onClick={() => manualInputRef.current?.click()} disabled={uploadingManual}>
              <Upload /> {uploadingManual ? "Cargando" : manualUrl ? "Cambiar croquis manual" : "Subir croquis manual"}
            </Button>
            {manualUrl ? (
              <Button size="sm" variant="ghost" onClick={() => { setManualUrl(null); setManualPath(null); }}>
                Usar croquis sobre satélite
              </Button>
            ) : null}
            {imgUrl && !manualUrl ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setImgUrl(null);
                  setOriginalImg(null);
                  setCropped(false);
                  setSketch((s) => ({ ...s, hideImage: true }));
                  toast.success("Imagen satelital eliminada. Pulsa Guardar para conservar solo el croquis.");
                }}
              >
                <Trash2 /> Eliminar imagen satelital
              </Button>
            ) : null}
            {(outline.length > 0 || sketch.roofs.length > 0 || sketch.lines.length > 0 || sketch.drops.length > 0) && !manualUrl ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!window.confirm("¿Eliminar el croquis generado?")) return;
                  setSketch((s) => ({ ...s, outline: [], roofs: [], lines: [], drops: [], noGutter: [] }));
                  setDraft([]);
                }}
              >
                <Trash2 /> Eliminar croquis
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button size="sm" variant="outline" onClick={save}><Save /> Guardar</Button>
          <Button
            size="sm"
            onClick={() => {
              const prevTitle = document.title;
              const client = est.fullName.trim();
              document.title = client ? `estimate ${client}` : "estimate";
              window.print();
              document.title = prevTitle;
            }}
          ><FileImage /> Descargar PDF</Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>
      </div>

      <div id="mf-estimate-sheet" className="space-y-4 rounded-lg border border-border bg-card p-5 text-[13px]">
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-b border-border pb-3">
          <img src={logoAsset.url} alt="MetalFlow" className="h-auto w-64 max-w-full object-contain" width={1797} height={339} />
          <div className="text-right leading-tight">
            <p className="font-display text-lg font-bold uppercase">Estimate</p>
            <p className="text-muted-foreground">{SITE.phone} · {SITE.email}</p>
            <p className="text-muted-foreground">{SITE.address}, {SITE.city}</p>
            <p className="text-muted-foreground uppercase tracking-widest text-[10px]">Licensed and insured</p>
          </div>
        </header>

        <div className="estimate-layout">
        <div className="estimate-main space-y-4">
        <section className="flex flex-wrap gap-x-4 gap-y-2">
          <div className="w-32 space-y-1">
            <Label className="block text-center text-[11px] uppercase tracking-widest text-muted-foreground">Date</Label>
            <Input className="h-8 text-center print:hidden" type="date" value={est.date} onChange={(e) => set("date", e.target.value)} />
            <p className="hidden text-center print:block">{est.date}</p>
          </div>
          <Field label="Customer" value={est.fullName} onChange={(v) => set("fullName", v)} className="w-52" />
          <Field label="Phone" value={est.phone} onChange={(v) => set("phone", v)} className="w-32" />
          <Field label="Email" value={est.email} onChange={(v) => set("email", v)} className={`w-56${est.email.trim() ? "" : " print:hidden"}`} />
          <Field label="City" value={est.city} onChange={(v) => set("city", v)} className="w-36" />
          <Field label="Address" value={est.address} onChange={(v) => set("address", v)} className="w-full" />
        </section>

        {cropping && (originalImg ?? imgUrl) ? (
          <div className="print:hidden">
            <AerialCropper
              src={(originalImg ?? imgUrl)!}
              onCancel={() => setCropping(false)}
              onApply={(url) => {
                if (!originalImg) setOriginalImg(imgUrl);
                setImgUrl(url);
                setCropped(true);
                setSketch((s) => ({ ...s, heading: 0, scale: 1, tx: 0, ty: 0 }));
                setCropping(false);
                toast.success("Recorte aplicado, ahora puedes generar con IA");
              }}
            />
          </div>
        ) : null}
        <section
          hidden={cropping}
          className={`relative mx-auto aspect-square w-full max-w-[460px] overflow-hidden rounded-md ${hideImage ? "border-0 bg-transparent" : "border border-border bg-muted"}`}
        >
          {manualUrl ? (
            <img src={manualUrl} alt="Croquis manual de la propiedad" className="absolute inset-0 h-full w-full bg-background object-contain" />
          ) : null}
          {imgUrl && !hideImage && !manualUrl ? (
            <img
              src={imgUrl}
              alt="Satellite view of the property"
              className="absolute inset-0 h-full w-full object-contain"
              style={heading ? { transform: `rotate(${heading}deg)`, transformOrigin: "center center" } : undefined}

            />
          ) : null}
          {!imgUrl && !hideImage && !manualUrl ? (
            <p className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              {loadingImg ? "Loading satellite view" : "No satellite view yet"}
            </p>
          ) : null}
          <svg
            ref={svgRef}
            viewBox="0 0 1000 1000"
            className={`absolute inset-0 h-full w-full ${manualUrl ? "pointer-events-none opacity-0" : ""}`}
            style={{ cursor: mode === "move" ? (panFrom ? "grabbing" : "grab") : "crosshair" }}
            onClick={onCanvasClick}
            onMouseMove={onCanvasMove}
            onMouseDown={(e) => {
              setDragIdx(null);
              if (mode === "move") setPanFrom(rawPoint(e));
            }}
            onMouseUp={() => {
              setDragIdx(null);
              setPanFrom(null);
            }}
            onMouseLeave={() => {
              setDragIdx(null);
              setPanFrom(null);
            }}
          >
            <g transform={`translate(${tx} ${ty}) translate(500 500) scale(${scale}) rotate(${heading}) translate(-500 -500)`}>
            {outline.length ? (
              <g>
                <polygon
                  points={outline.map((p) => `${p.x * 1000},${p.y * 1000}`).join(" ")}
                  fill="#000000"
                  fillOpacity={0.04}
                  stroke="none"
                />
                {outline.map((a, i) => {
                  const b = outline[(i + 1) % outline.length];
                  const off = noGutter.includes(i);
                  return (
                    <line
                      key={`seg${i}`}
                      x1={a.x * 1000}
                      y1={a.y * 1000}
                      x2={b.x * 1000}
                      y2={b.y * 1000}
                      stroke={off ? "#9ca3af" : "#000000"}
                      strokeWidth={off ? 4 : 7}
                      strokeDasharray={off ? "14 12" : undefined}
                      strokeLinecap="round"
                      style={{ cursor: mode === "edges" ? "pointer" : undefined }}
                      onClick={(e) => {
                        if (mode !== "edges") return;
                        e.stopPropagation();
                        toggleEdge(i);
                      }}
                    />
                  );
                })}
                {mode === "edges"
                  ? outline.map((a, i) => {
                      const b = outline[(i + 1) % outline.length];
                      return (
                        <line
                          key={`hit${i}`}
                          x1={a.x * 1000}
                          y1={a.y * 1000}
                          x2={b.x * 1000}
                          y2={b.y * 1000}
                          stroke="transparent"
                          strokeWidth={26}
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEdge(i);
                          }}
                        />
                      );
                    })
                  : null}
              </g>
            ) : null}


            {sketch.roofs.map((ln, i) => (
              <g key={`r${i}`}>
                <polyline
                  points={ln.pts.map((p) => `${p.x * 1000},${p.y * 1000}`).join(" ")}
                  fill="none"
                  stroke="#fbcaa4"
                  strokeOpacity={1}
                  strokeWidth={4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {ln.label ? (
                  <text
                    x={((ln.pts[0].x + ln.pts[ln.pts.length - 1].x) / 2) * 1000}
                    y={((ln.pts[0].y + ln.pts[ln.pts.length - 1].y) / 2) * 1000 - 8}
                    textAnchor="middle"
                    fill="#ffffff"
                    stroke="#111111"
                    strokeWidth={5}
                    paintOrder="stroke"
                    fontSize={28}
                    fontWeight={700}
                  >
                    {ln.label}&apos;
                  </text>
                ) : null}
              </g>
            ))}
            {[...sketch.lines, ...(draft.length ? [{ pts: draft, label: "" }] : [])].map((ln, i) => (
              <g key={i}>
                <polyline
                  points={ln.pts.map((p) => `${p.x * 1000},${p.y * 1000}`).join(" ")}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={6}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {ln.label ? (
                  <text
                    x={((ln.pts[0].x + ln.pts[ln.pts.length - 1].x) / 2) * 1000}
                    y={((ln.pts[0].y + ln.pts[ln.pts.length - 1].y) / 2) * 1000 - 10}
                    textAnchor="middle"
                    fill="#ffffff"
                    stroke="#111111"
                    strokeWidth={5}
                    paintOrder="stroke"
                    fontSize={34}
                    fontWeight={700}
                  >
                    {ln.label}
                  </text>
                ) : null}
              </g>
            ))}
            </g>
          </svg>

        </section>

        <section className="flex flex-wrap gap-x-4 gap-y-2 print:hidden">
          <div className="w-56 space-y-1">
            <Label className="block text-center text-[11px] uppercase tracking-widest text-muted-foreground">Style</Label>
            <Select
              value={est.style}
              onValueChange={(value) => {
                set("style", value);
                if (value === "K Style" && est.size !== "6") set("size", "6");
              }}
            >
              <SelectTrigger className="h-8 text-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((style) => (
                  <SelectItem key={style.key} value={style.name}>{style.name}</SelectItem>
                ))}
                <SelectItem value="K Style">K Style (6")</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-28 space-y-1">
            <Label className="block text-center text-[11px] uppercase tracking-widest text-muted-foreground">Size (inches)</Label>
            <Select value={est.size} onValueChange={(value) => set("size", value)}>
              <SelectTrigger className="h-8 text-center"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(est.style === "K Style" ? [6] : [6, 7, 8]).map((size) => <SelectItem key={size} value={String(size)}>{size} inches</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Field label="Linear feet" value={est.feet} onChange={(v) => set("feet", v)} className="w-28" />
          <div className="w-36 space-y-1">
            <Label className="block text-center text-[11px] uppercase tracking-widest text-muted-foreground">Downspouts</Label>
            <Select value={est.dsType} onValueChange={(value) => set("dsType", value as EstimateData["dsType"])}>
              <SelectTrigger className="h-8 text-center"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3x4">3x4 corrugated</SelectItem>
                <SelectItem value="4x5">4x5 corrugated</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {est.dsType !== "4x5" ? <Field label="3x4 linear feet" value={est.ds34} onChange={(v) => set("ds34", v)} className="w-28" /> : null}
          {est.dsType !== "3x4" ? <Field label="4x5 linear feet" value={est.ds45} onChange={(v) => set("ds45", v)} className="w-28" /> : null}
        </section>

        <section className="hidden items-start justify-between gap-3 print:flex">
          <PrintValue label="Style" value={est.style} />
          <PrintValue label="Size" value={est.size ? `${est.size} in` : ""} />
          <PrintValue label="Linear feet" value={est.feet} />
          {est.dsType !== "4x5" && Number(est.ds34) > 0 ? <PrintValue label="3x4 corrugated downspout" value={`${est.ds34} ft`} /> : null}
          {est.dsType !== "3x4" && Number(est.ds45) > 0 ? <PrintValue label="4x5 corrugated downspout" value={`${est.ds45} ft`} /> : null}
        </section>

        <label className="flex items-center gap-2 print:hidden">
          <input type="checkbox" checked={est.leafGuard} onChange={(e) => set("leafGuard", e.target.checked)} />
          <span>Leaf Guard included</span>
        </label>
        <p className="hidden print:block">Leaf Guard: {est.leafGuard ? "Included" : "Not included"}</p>

        <section className="space-y-2">
          {est.extras.map((x, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_120px_auto] items-center gap-2">
              <Input
                value={x.label}
                placeholder="Additional service"
                onChange={(e) =>
                  set("extras", est.extras.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))
                }
              />
              <span className="hidden text-right font-medium print:block">{money(Number(x.amount) || 0)}</span>
              <Input
                className="print:hidden"
                value={x.amount}
                type="number"
                placeholder="0"
                onChange={(e) =>
                  set("extras", est.extras.map((y, j) => (j === i ? { ...y, amount: e.target.value } : y)))
                }
              />
              <Button
                variant="outline"
                size="sm"
                className="print:hidden"
                onClick={() => set("extras", est.extras.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="print:hidden"
            onClick={() => set("extras", [...est.extras, { label: "", amount: "" }])}
          >
            Add line
          </Button>
        </section>

        <section className="flex flex-wrap gap-x-4 gap-y-2 print:hidden">
          <Field label="Base total" value={est.total} onChange={(v) => set("total", v)} type="number" className="w-32" />
          <Field label="Deposit" value={est.deposit} onChange={(v) => set("deposit", v)} type="number" className="w-32" />
        </section>
        <section className="hidden gap-x-8 print:flex">
          <PrintValue label="Base total" value={money(Number(est.total) || 0)} />
          {est.deposit ? <PrintValue label="Deposit" value={money(Number(est.deposit) || 0)} /> : null}
        </section>

        <div className="flex items-end justify-between border-t border-border pt-3">
          <p className="max-w-[60%] text-[11px] text-muted-foreground">
            Price includes all materials, hangers, screws, corner waste and professional installation. No hidden fees.
          </p>
          <p className="font-display text-2xl font-bold">{money(grand)}</p>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Notes</Label>
          <Textarea rows={4} className="estimate-notes min-h-24 px-3 py-2 print:hidden" value={est.notes} onChange={(e) => set("notes", e.target.value)} />
          <div className="estimate-notes-print hidden min-h-12 whitespace-pre-wrap break-words rounded-md border border-border px-3 py-2 print:block">{est.notes}</div>
        </div>

        <div className="estimate-signature grid grid-cols-2 gap-6 pt-12 text-[11px] text-muted-foreground">
          <div className="min-w-0 border-t border-foreground pt-1">Customer signature</div>
          <div className="min-w-0 border-t border-foreground pt-1">MetalFlow representative signature</div>
        </div>
        </div>
        <EstimateContractPage
          client={est.fullName}
          terms={settings?.estimate_contractual_terms || "Contractual terms will appear here once configured in Admin Settings."}
        />
        </div>
      </div>
    </div>
  );
}

function PrintValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[9px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value || "—"}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "w-40",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="block text-center text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      <Input
        className="h-8 text-center print:hidden"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="hidden whitespace-pre-wrap break-words text-center font-medium print:block">{value}</p>
    </div>
  );
}
