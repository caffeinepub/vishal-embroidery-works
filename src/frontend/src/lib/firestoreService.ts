import { deleteDoc, doc, setDoc } from "firebase/firestore";
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
