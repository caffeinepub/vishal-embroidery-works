import type { Design, Subcategory } from "./storage";

const PREFIXES: Record<Subcategory, string> = {
  embroidery: "EMB",
  "ready-blouse-embroidery": "RBE",
  "simple-blouse": "SIM",
  "boat-neck": "BN",
  "bridal-blouse": "BRD",
  "designer-blouse": "DSG",
};

export const SUBCATEGORY_LABELS: Record<Subcategory, string> = {
  embroidery: "Embroidery",
  "ready-blouse-embroidery": "Ready Blouse Embroidery",
  "simple-blouse": "Simple Blouse",
  "boat-neck": "Boat Neck Blouse",
  "bridal-blouse": "Bridal Blouse",
  "designer-blouse": "Designer Blouse",
};

export function generateDesignCode(
  subcategory: Subcategory,
  existingDesigns: Design[],
): string {
  const count = existingDesigns.filter(
    (d) => d.subcategory === subcategory,
  ).length;
  const next = count + 1;
  return `${PREFIXES[subcategory]}${String(next).padStart(3, "0")}`;
}

export function getPrefix(subcategory: Subcategory): string {
  return PREFIXES[subcategory];
}

export { PREFIXES };
