// Storage keys
export const KEYS = {
  DESIGNS: "VEW_DESIGNS",
  CUSTOMERS: "VEW_CUSTOMERS",
  ORDERS: "VEW_ORDERS",
  PAYMENTS: "VEW_PAYMENTS",
  CART: "VEW_STITCHING_CART",
};

// Types
export type Subcategory =
  | "embroidery"
  | "ready-blouse-embroidery"
  | "simple-blouse"
  | "boat-neck"
  | "bridal-blouse"
  | "designer-blouse";

export type Category = "embroidery" | "blouse";
export type OrderStatus =
  | "Pending"
  | "Cutting"
  | "Stitching"
  | "Ready"
  | "Completed";
export type PaymentStatus = "Pending" | "Partial" | "Paid";

export interface Design {
  id: string;
  designCode: string;
  title: string;
  images: string[]; // base64, max 5
  category: Category;
  subcategory: Subcategory;
  isBridal: boolean;
  isHidden: boolean;
  createdAt: string;
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
}

// Cart (stays in localStorage — per-session only)
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
  return safeGet<CartItem>(KEYS.CART);
}

export function saveCart(cart: CartItem[]): void {
  safeSet(KEYS.CART, cart);
}

export function clearCart(): void {
  safeSet(KEYS.CART, []);
}

// Utils
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
