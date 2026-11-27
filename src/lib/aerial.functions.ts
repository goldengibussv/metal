import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

async function assertAdmin(supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || data !== true) throw new Error("Not authorized");
}

export type RoofEdge = {
  /** normalized polyline in sketch space (0..1000) */
  pts: { x: number; y: number }[];
  label: string; // feet
};

export const fetchAerial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        requestId: z.string().uuid(),
        address: z.string().min(3).max(300),
        lat: z.number().optional(),
        lng: z.number().optional(),
        zoom: z.number().int().min(16).max(21).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);

    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) throw new Error("Google Maps connector is not configured.");

    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
      "Content-Type": "application/json",
    };

    // Resolve the address to coordinates when not already known.
    let lat = data.lat;
    let lng = data.lng;
    let formatted = "";
    if (lat === undefined || lng === undefined) {
      const geoRes = await fetch(
        `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(data.address)}`,
        { headers: { Authorization: headers.Authorization, "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY } },
      );
      if (!geoRes.ok) {
        const body = await geoRes.text();
        throw new Error(`Geocoding failed [${geoRes.status}]: ${body}`);
      }
      const geo = (await geoRes.json()) as {
        status: string;
        results?: { geometry: { location: { lat: number; lng: number } }; formatted_address: string }[];
      };
      const hit = geo.results?.[0];
      if (geo.status !== "OK" || !hit) throw new Error("Address not found. Adjust the address and try again.");
      lat = hit.geometry.location.lat;
      lng = hit.geometry.location.lng;
      formatted = hit.formatted_address;
    }

    return {
      lat,
      lng,
      formatted: formatted || data.address,
      zoom: data.zoom ?? 20,
    };
  });

type Pt = { x: number; y: number };

/** Captures the same satellite crop used by the AI, as a base64 png. */
async function captureStatic(lat: number, lng: number, zoom: number) {
  const aiKey = process.env["LOVABLE_API_KEY"];
  const connectorKey = process.env["GOOGLE_MAPS_API_KEY"];
  const ownKey = process.env["GOOGLE_API_KEY"];

  const params = `center=${lat},${lng}&zoom=${zoom}&size=640x640&scale=2&maptype=satellite&format=png`;

  let imgRes: Response | null = null;
  let reason = "No Google Maps key is configured on the server.";
  if (ownKey) {
    const direct = await fetch(`https://maps.googleapis.com/maps/api/staticmap?${params}&key=${ownKey}`);
    if (direct.ok) imgRes = direct;
    else reason = `Static Maps [${direct.status}]: ${(await direct.text()).slice(0, 300)}`;
  }
  if (!imgRes && connectorKey && aiKey) {
    const gw = await fetch(`${GATEWAY_URL}/maps/api/staticmap?${params}`, {
      headers: { Authorization: `Bearer ${aiKey}`, "X-Connection-Api-Key": connectorKey },
    });
    if (gw.ok) imgRes = gw;
    else reason = `${reason} | Gateway [${gw.status}]: ${(await gw.text()).slice(0, 200)}`;
  }
  if (!imgRes) {
    console.error(`Satellite capture failed: ${reason}`);
    throw new Error(`Satellite capture failed. ${reason}`);
  }
  const bytes = new Uint8Array(await imgRes.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Returns the satellite crop as a data url so the editor can show it without the JS map. */
export const aerialImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ lat: z.number(), lng: z.number(), zoom: z.number().int().min(16).max(21).default(21) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const b64 = await captureStatic(data.lat, data.lng, data.zoom);
    return { url: `data:image/png;base64,${b64}` };
  });

function clean(pts: unknown): Pt[] {
  if (!Array.isArray(pts)) return [];
  return pts
    .map((p) => {
      const o = p as { x?: unknown; y?: unknown };
      return { x: Number(o?.x), y: Number(o?.y) };
    })
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
}


/**
 * Captures a tight satellite crop of the house and asks the AI vision model to
 * trace the roof: black perimeter plus the interior slope (hip and ridge) lines.
 */
export const detectRoof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        lat: z.number(),
        lng: z.number(),
        zoom: z.number().int().min(16).max(21).default(21),
        image: z.string().startsWith("data:image/").max(8_000_000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);

    const aiKey = process.env["LOVABLE_API_KEY"];
    if (!aiKey) throw new Error("AI is not configured.");

    const b64 = data.image
      ? data.image.slice(data.image.indexOf(",") + 1)
      : await captureStatic(data.lat, data.lng, data.zoom);

    // Admin editable instructions, stored in Settings as ai_roof_prompt.
    const { data: setting } = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ai_roof_prompt")
      .maybeSingle();
    const custom = ((setting as { value?: string } | null)?.value ?? "").trim();

    const base = `You are a roof takeoff assistant. The image is a top down satellite view of a single property, the main house is centered.
Trace ONLY the main house roof.
- outline: the closed perimeter of the roof, in clockwise order, 6 to 30 points.
- slopes: interior roof lines, each one a polyline of 2 or more points, covering ridges and hip lines that show the roof planes.
- Be precise: the outline must sit exactly on the roof edges of the house in the image.`;

    const prompt = `${custom || base}

Return strict JSON only:
{"outline":[{"x":0.0,"y":0.0}],"slopes":[[{"x":0,"y":0},{"x":0,"y":0}]]}
- All coordinates are normalized to the image: x from 0 at left to 1 at right, y from 0 at top to 1 at bottom. The image is square.
- No measurements, no text, no extra keys.`;


    // Few shot examples curated by the admin in the Training tab.
    const examples: { role: string; content: unknown }[] = [];
    const { data: rows } = await context.supabase
      .from("roof_training")
      .select("image_path, sketch_image_path, sketch, notes")
      .not("image_path", "is", null)
      .order("created_at", { ascending: false })
      .limit(3);
    for (const row of (rows ?? []) as {
      image_path: string;
      sketch_image_path: string | null;
      sketch: unknown;
      notes: string;
    }[]) {
      const sketch = row.sketch as { outline?: unknown; slopes?: unknown } | null;
      const signed = await context.supabase.storage.from("aerials").createSignedUrl(row.image_path, 600);
      const url = signed.data?.signedUrl;
      if (!url) continue;

      let sketchUrl = "";
      if (row.sketch_image_path) {
        const s = await context.supabase.storage.from("aerials").createSignedUrl(row.sketch_image_path, 600);
        sketchUrl = s.data?.signedUrl ?? "";
      }
      if (!sketch?.outline && !sketchUrl) continue;

      const content: unknown[] = [
        { type: "text", text: `Reference example, satellite image. ${row.notes || ""}`.trim() },
        { type: "image_url", image_url: { url } },
      ];
      if (sketchUrl) {
        content.push({
          type: "text",
          text: "This is the correct final technical sketch drawn by hand for that same house. Match this style and precision.",
        });
        content.push({ type: "image_url", image_url: { url: sketchUrl } });
      }
      examples.push({ role: "user", content });
      if (sketch?.outline) {
        examples.push({
          role: "assistant",
          content: JSON.stringify({ outline: sketch.outline, slopes: sketch.slopes ?? [] }),
        });
      }
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          ...examples,
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const body = await aiRes.text();
      if (aiRes.status === 429) throw new Error("AI is busy right now, try again in a moment.");
      if (aiRes.status === 402) throw new Error("AI credits are exhausted, add credits to continue.");
      throw new Error(`Roof detection failed [${aiRes.status}]: ${body.slice(0, 200)}`);
    }
    const ai = (await aiRes.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = ai.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The AI did not return a roof outline.");
    const parsed = JSON.parse(match[0]) as { outline?: unknown; slopes?: unknown };

    const outline = clean(parsed.outline);
    if (outline.length < 3) throw new Error("The AI could not trace this roof, adjust the zoom and try again.");
    const slopes = (Array.isArray(parsed.slopes) ? parsed.slopes : [])
      .map((s) => clean(s))
      .filter((s) => s.length >= 2)
      .map((pts) => ({ pts, label: "" }) as RoofEdge);

    return { outline, slopes };
  });
