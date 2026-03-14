import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Customer, Design, Order, Payment } from "./storage";

/** Strip all undefined values so Firestore never receives them. */
function sanitizeDesign(design: Design): Record<string, unknown> {
  return {
    id: design.id ?? "",
    designCode: design.designCode ?? "",
    title: design.title ?? "",
    images: Array.isArray(design.images) ? design.images.filter(Boolean) : [],
    category: design.category ?? "",
    subcategory: design.subcategory ?? "",
    isBridal: design.isBridal ?? false,
    isHidden: design.isHidden ?? false,
    createdAt: design.createdAt ?? new Date().toISOString(),
    tags: Array.isArray(design.tags) ? design.tags : [],
    price: design.price != null ? design.price : null,
    notes: typeof design.notes === "string" ? design.notes : "",
    frontEmbroidery:
      typeof design.frontEmbroidery === "string"
        ? design.frontEmbroidery
        : null,
    backEmbroidery:
      typeof design.backEmbroidery === "string" ? design.backEmbroidery : null,
    sleeveEmbroidery:
      typeof design.sleeveEmbroidery === "string"
        ? design.sleeveEmbroidery
        : null,
    generatedImages: design.generatedImages
      ? {
          frontImage: design.generatedImages.frontImage || null,
          backImage: design.generatedImages.backImage || null,
          sideImage: design.generatedImages.sideImage || null,
        }
      : null,
  };
}

// --- Designs ---
export async function addDesign(design: Design): Promise<void> {
  await setDoc(doc(db, "designs", design.id), sanitizeDesign(design));
}

export async function updateDesign(design: Design): Promise<void> {
  await setDoc(doc(db, "designs", design.id), sanitizeDesign(design), {
    merge: true,
  });
}

export async function deleteDesign(id: string): Promise<void> {
  await deleteDoc(doc(db, "designs", id));
}

// --- Customers ---
export async function addCustomer(customer: Customer): Promise<void> {
  await setDoc(doc(db, "customers", customer.id), customer);
}

export async function updateCustomer(customer: Customer): Promise<void> {
  await setDoc(doc(db, "customers", customer.id), customer, { merge: true });
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(doc(db, "customers", id));
}

// --- Orders ---
export async function addOrder(order: Order): Promise<void> {
  await setDoc(doc(db, "orders", order.id), order);
}

export async function updateOrder(order: Order): Promise<void> {
  await setDoc(doc(db, "orders", order.id), order, { merge: true });
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, "orders", id));
}

// --- Payments ---
export async function addPayment(payment: Payment): Promise<void> {
  await setDoc(doc(db, "payments", payment.id), payment);
}

export async function updatePayment(payment: Payment): Promise<void> {
  await setDoc(doc(db, "payments", payment.id), payment, { merge: true });
}

export async function deletePayment(id: string): Promise<void> {
  await deleteDoc(doc(db, "payments", id));
}

// --- Bulk fetch helpers ---
export async function getAllDesigns(): Promise<Design[]> {
  const q = query(collection(db, "designs"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Design);
}

export async function getAllCustomers(): Promise<Customer[]> {
  const q = query(collection(db, "customers"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Customer);
}

export async function getAllOrders(): Promise<Order[]> {
  const q = query(collection(db, "orders"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Order);
}

export async function getAllPayments(): Promise<Payment[]> {
  const q = query(collection(db, "payments"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Payment);
}

/** Update all orders that reference the old design code to use the new design code. */
export async function updateOrderDesignCode(
  oldCode: string,
  newCode: string,
): Promise<void> {
  const orders = await getAllOrders();
  const affected = orders.filter((o) =>
    o.designs.some((d) => d.designCode === oldCode),
  );
  await Promise.all(
    affected.map((order) => {
      const updated = {
        ...order,
        designs: order.designs.map((d) =>
          d.designCode === oldCode ? { ...d, designCode: newCode } : d,
        ),
      };
      return updateOrder(updated);
    }),
  );
}
