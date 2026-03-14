// Types shared across the app
export type Subcategory =
  | "embroidery"
  | "ready-blouse-embroidery"
  | "boat-neck"
  | "princess-cut"
  | "high-neck"
  | "collar-neck"
  | "padded-blouse";

export type Category = "embroidery" | "blouse";
export type OrderStatus =
  | "Pending"
  | "Cutting"
  | "Stitching"
  | "Ready"
  | "Completed";
export type PaymentStatus = "Pending" | "Partial" | "Paid";

// BlouseType aligns exactly with blouse Subcategory values
export type BlouseType =
  | "boat-neck"
  | "princess-cut"
  | "high-neck"
  | "collar-neck"
  | "padded-blouse"
  | null;

export const BLOUSE_TYPE_LABELS: Record<NonNullable<BlouseType>, string> = {
  "boat-neck": "Boat Neck",
  "princess-cut": "Princess Cut",
  "high-neck": "High Neck",
  "collar-neck": "Collar Neck",
  "padded-blouse": "Padded Blouse",
};

export const ALL_BLOUSE_TYPES: NonNullable<BlouseType>[] = [
  "boat-neck",
  "princess-cut",
  "high-neck",
  "collar-neck",
  "padded-blouse",
];

export interface GeneratedBlouseImages {
  frontImage?: string | null;
  backImage?: string | null;
  sideImage?: string | null;
}

export interface Design {
  id: string;
  designCode: string;
  title: string;
  images: string[]; // Cloudinary URLs (max 10)
  category: Category;
  subcategory: Subcategory;
  isBridal: boolean;
  isHidden: boolean;
  createdAt: string;
  tags: string[];
  price?: number | null;
  notes?: string;
  // AI blouse preview fields (only for category=embroidery, subcategory=embroidery)
  frontEmbroidery?: string | null;
  backEmbroidery?: string | null;
  sleeveEmbroidery?: string | null;
  generatedImages?: GeneratedBlouseImages | null;
}

export interface Measurements {
  chest: string;
  waist: string;
  shoulder: string;
  sleeveLength: string;
  blouseLength: string;
  frontNeckDepth: string;
  backNeckDepth: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  measurements: Measurements;
  createdAt: string;
}

export interface OrderDesign {
  designId: string;
  designCode: string;
  designTitle: string;
  designImage: string;
  isManual: boolean;
  manualDescription?: string;
  referenceImage?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  designs: OrderDesign[];
  deliveryDate: string;
  status: OrderStatus;
  totalAmount: number;
  advancePaid: number;
  orderDate: string;
  notes: string;
}

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  type: "advance" | "partial" | "final";
  date: string;
  notes: string;
}

export interface CartItem {
  designId: string;
  designCode: string;
  designTitle: string;
  designImage: string;
  view?: "front" | "back";
  neckType?: string;
  blouseColor?: string;
  embColor1?: string;
  embColor2?: string;
  uploadedBlousePhoto?: string;
}

const CART_KEY = "VEW_STITCHING_CART";

function safeGet<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function safeSet<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function getCart(): CartItem[] {
  return safeGet<CartItem>(CART_KEY);
}

export function saveCart(cart: CartItem[]): void {
  safeSet(CART_KEY, cart);
}

export function clearCart(): void {
  safeSet(CART_KEY, []);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getPaymentStatus(
  totalAmount: number,
  advancePaid: number,
): PaymentStatus {
  if (totalAmount <= 0) return "Pending";
  if (advancePaid <= 0) return "Pending";
  if (advancePaid >= totalAmount) return "Paid";
  return "Partial";
}
