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

// Helpers
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

// Designs
export function getDesigns(): Design[] {
  return safeGet<Design>(KEYS.DESIGNS);
}

export function saveDesign(design: Design): void {
  const designs = getDesigns();
  designs.push(design);
  safeSet(KEYS.DESIGNS, designs);
}

export function updateDesign(updated: Design): void {
  const designs = getDesigns().map((d) => (d.id === updated.id ? updated : d));
  safeSet(KEYS.DESIGNS, designs);
}

export function deleteDesign(id: string): void {
  const designs = getDesigns().filter((d) => d.id !== id);
  safeSet(KEYS.DESIGNS, designs);
}

// Customers
export function getCustomers(): Customer[] {
  return safeGet<Customer>(KEYS.CUSTOMERS);
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers();
  customers.push(customer);
  safeSet(KEYS.CUSTOMERS, customers);
}

export function updateCustomer(updated: Customer): void {
  const customers = getCustomers().map((c) =>
    c.id === updated.id ? updated : c,
  );
  safeSet(KEYS.CUSTOMERS, customers);
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter((c) => c.id !== id);
  safeSet(KEYS.CUSTOMERS, customers);
}

// Orders
export function getOrders(): Order[] {
  return safeGet<Order>(KEYS.ORDERS);
}

export function saveOrder(order: Order): void {
  const orders = getOrders();
  orders.push(order);
  safeSet(KEYS.ORDERS, orders);
}

export function updateOrder(updated: Order): void {
  const orders = getOrders().map((o) => (o.id === updated.id ? updated : o));
  safeSet(KEYS.ORDERS, orders);
}

export function deleteOrder(id: string): void {
  const orders = getOrders().filter((o) => o.id !== id);
  safeSet(KEYS.ORDERS, orders);
}

// Payments
export function getPayments(): Payment[] {
  return safeGet<Payment>(KEYS.PAYMENTS);
}

export function savePayment(payment: Payment): void {
  const payments = getPayments();
  payments.push(payment);
  safeSet(KEYS.PAYMENTS, payments);
}

export function getPaymentsForOrder(orderId: string): Payment[] {
  return getPayments().filter((p) => p.orderId === orderId);
}

export function getPaymentsForCustomer(customerId: string): Payment[] {
  return getPayments().filter((p) => p.customerId === customerId);
}

// Cart
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
