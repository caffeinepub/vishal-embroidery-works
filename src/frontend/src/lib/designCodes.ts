import type { Design, Subcategory } from "./storage";

const PREFIXES: Record<Subcategory, string> = {
  embroidery: "EMB",
  "ready-blouse-embroidery": "RBE",
  "boat-neck": "BN",
  "princess-cut": "PC",
  "high-neck": "HN",
  "collar-neck": "CN",
  "padded-blouse": "PB",
};

export const SUBCATEGORY_LABELS: Record<Subcategory, string> = {
  embroidery: "Embroidery",
  "ready-blouse-embroidery": "Ready Blouse Embroidery",
  "boat-neck": "Boat Neck Blouse",
  "princess-cut": "Princess Cut Blouse",
  "high-neck": "High Neck Blouse",
  "collar-neck": "Collar Neck Blouse",
  "padded-blouse": "Padded Blouse",
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
