import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns the browser Maps key to use. Prefers the account owned key
 * (GOOGLE_API_KEY) so the map also works on the custom domain, and falls back
 * to the Lovable managed connector key.
 */
export const getMapsBrowserKey = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const own = process.env["GOOGLE_API_KEY"];
    const managed = process.env["GOOGLE_MAPS_BROWSER_KEY"];
    return { key: own || managed || "" };
  });
