import { type Subcategory, getDesigns } from "./storage";

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

export function generateDesignCode(subcategory: Subcategory): string {
  const designs = getDesigns().filter((d) => d.subcategory === subcategory);
  const next = designs.length + 1;
  const prefix = PREFIXES[subcategory];
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function getPrefix(subcategory: Subcategory): string {
  return PREFIXES[subcategory];
}

export { PREFIXES };
