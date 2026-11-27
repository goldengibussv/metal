import { getMapsBrowserKey } from "@/lib/maps-key.functions";

let promise: Promise<void> | null = null;

async function resolveKey(): Promise<string> {
  try {
    const res = await getMapsBrowserKey();
    if (res?.key) return res.key;
  } catch {
    // fall back to the public managed key below
  }
  return import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] ?? "";
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No browser"));
  const w = window as unknown as { google?: { maps?: unknown } };
  if (w.google?.maps) return Promise.resolve();
  if (promise) return promise;

  const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];

  promise = (async () => {
    const key = await resolveKey();
    if (!key) throw new Error("Google Maps browser key is not configured");
    await new Promise<void>((resolve, reject) => {
      const cbName = "__mfInitMap";
      (window as unknown as Record<string, unknown>)[cbName] = () => resolve();
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=${cbName}${
        channel ? `&channel=${channel}` : ""
      }`;
      s.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(s);
    });
  })().catch((e) => {
    promise = null;
    throw e;
  });

  return promise;
}
