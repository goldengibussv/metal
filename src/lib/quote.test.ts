/// <reference types="vitest" />
// @ts-nocheck
import { describe, expect, it } from "vitest";
import { allowedDownspouts, calculateQuote, DEFAULT_PRICES, displayEmail } from "./quote";

const base = { style: "flatface" as const, feet: 0, leafGuard: false };
describe("downspouts", () => {
  it("8 inch only allows 4x5", () => expect(allowedDownspouts(8)).toEqual(["4x5"]));
  it("6 and 7 inch allow 3x4 and 4x5", () => expect(allowedDownspouts(6)).toEqual(["3x4", "4x5"]));
  it("both sizes priced by their own feet", () => {
    const r = calculateQuote({ ...base, size: 6, ds3x4Feet: 100, ds4x5Feet: 10 }, DEFAULT_PRICES);
    expect(r.downspoutCost).toBeCloseTo(100 * 6.3 + 10 * 12);
  });
});
it("hides placeholder email", () => expect(displayEmail("no-email@metalflowllc.com")).toBe(""));
