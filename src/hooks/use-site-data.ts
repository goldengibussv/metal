import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PRICES, DEFAULT_SETTINGS, type PriceMap, type SettingsMap } from "@/lib/quote";

export function usePricing() {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: async (): Promise<PriceMap> => {
      const { data, error } = await supabase.from("pricing").select("key, price");
      if (error) throw error;
      const map: PriceMap = { ...DEFAULT_PRICES };
      for (const row of data ?? []) map[row.key] = Number(row.price);
      return map;
    },
    initialData: DEFAULT_PRICES,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SettingsMap> => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const map: SettingsMap = { ...DEFAULT_SETTINGS };
      for (const row of data ?? []) map[row.key] = row.value;
      return map;
    },
    initialData: DEFAULT_SETTINGS,
  });
}

export function useReviews() {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    initialData: [],
  });
}
