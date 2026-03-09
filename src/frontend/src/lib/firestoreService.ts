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

// --- Designs ---
export async function addDesign(design: Design): Promise<void> {
  await setDoc(doc(db, "designs", design.id), design);
}

export async function updateDesign(design: Design): Promise<void> {
  await setDoc(doc(db, "designs", design.id), design, { merge: true });
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

// --- Design code cascade ---
/**
 * When a design code is renamed, update every Order that references the old code
 * so the order history stays consistent.
 */
export async function updateOrderDesignCode(
  oldCode: string,
  newCode: string,
): Promise<void> {
  if (oldCode === newCode) return;
  const q = query(collection(db, "orders"));
  const snapshot = await getDocs(q);
  const updates: Promise<void>[] = [];
  for (const docSnap of snapshot.docs) {
    const order = docSnap.data() as Order;
    const hasMatch = order.designs?.some((d) => d.designCode === oldCode);
    if (hasMatch) {
      const updatedDesigns = order.designs.map((d) =>
        d.designCode === oldCode ? { ...d, designCode: newCode } : d,
      );
      updates.push(
        setDoc(
          doc(db, "orders", order.id),
          { ...order, designs: updatedDesigns },
          { merge: true },
        ),
      );
    }
  }
  await Promise.all(updates);
}
