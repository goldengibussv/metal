export type StyleKey = "flatface" | "onepencil" | "doublepencil" | "kstyle";

export const STYLES: { key: StyleKey; name: string; sizes: number[] }[] = [
  { key: "flatface", name: "Flat Face", sizes: [6, 7, 8] },
  { key: "onepencil", name: "Flat Face One Pencil", sizes: [6, 7, 8] },
  { key: "doublepencil", name: "Flat Face Double Pencil", sizes: [6, 7, 8] },
];

export type PriceMap = Record<string, number>;
export type SettingsMap = Record<string, string>;

export const DEFAULT_PRICES: PriceMap = {
  gutter_kstyle_6: 6,
  gutter_flatface_7: 7,
  gutter_flatface_8: 8,
  gutter_onepencil_6: 6,
  gutter_onepencil_7: 7,
  gutter_onepencil_8: 8,
  gutter_doublepencil_6: 6,
  gutter_doublepencil_7: 7,
  gutter_doublepencil_8: 8,
  downspout_3x4: 6.3,
  downspout_4x5: 12,
  leaf_guard_6: 6,
  leaf_guard_7: 7,
  leaf_guard_8: 8,
};

export const DEFAULT_SETTINGS: SettingsMap = {
  feet_per_downspout: "50",
  downspout_feet_per_story: "15",
};

export type DownspoutType = "3x4" | "4x5" | "both";

export type CalcInput = {
  style: StyleKey;
  size: number;
  feet: number;
  /** Linear feet of 3x4 corrugated downspout */
  ds3x4Feet: number;
  /** Linear feet of 4x5 corrugated downspout */
  ds4x5Feet: number;
  leafGuard: boolean;
};

export type CalcResult = {
  clientFeet: number;
  totalFeet: number;
  gutterRate: number;
  gutterCost: number;
  downspoutFeet: number;
  downspoutCost: number;
  downspoutType: string;
  leafGuardRate: number;
  leafGuardCost: number;
  total: number;
};

/** 8 inch gutters only take 4x5 downspouts. */
export const allowedDownspouts = (size: number): ("3x4" | "4x5")[] => (size === 8 ? ["4x5"] : ["3x4", "4x5"]);

export function calculateQuote(input: CalcInput, prices: PriceMap, _settings?: SettingsMap): CalcResult {
  const totalFeet = Math.max(0, input.feet || 0);
  const gutterRate = prices[`gutter_${input.style}_${input.size}`] ?? prices[`gutter_flatface_${input.size}`] ?? 0;
  const gutterCost = totalFeet * gutterRate;
  const f34 = input.size === 8 ? 0 : Math.max(0, input.ds3x4Feet || 0);
  const f45 = Math.max(0, input.ds4x5Feet || 0);
  const downspoutCost = f34 * (prices["downspout_3x4"] ?? 0) + f45 * (prices["downspout_4x5"] ?? 0);
  const leafGuardRate = prices[`leaf_guard_${input.size}`] ?? 0;
  const leafGuardCost = input.leafGuard ? totalFeet * leafGuardRate : 0;
  const types = [f34 > 0 ? "3x4" : "", f45 > 0 ? "4x5" : ""].filter(Boolean).join(" + ");
  return {
    clientFeet: totalFeet,
    totalFeet,
    gutterRate,
    gutterCost,
    downspoutFeet: f34 + f45,
    downspoutCost,
    downspoutType: types ? `${types} corrugated` : "corrugated",
    leafGuardRate,
    leafGuardCost,
    total: gutterCost + downspoutCost + leafGuardCost,
  };
}

/** Hide placeholder emails used for clients added without one. */
export const displayEmail = (e: string | null | undefined) =>
  !e || e.trim() === "" || e.trim().toLowerCase() === "no-email@metalflowllc.com" ? "" : e;

export const money = (n: number) =>
  `$ ${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
