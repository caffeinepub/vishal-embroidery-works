import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import type { Customer, Design, Order, Payment } from "../lib/storage";

export function useDesigns(): { data: Design[]; loading: boolean } {
  const [data, setData] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "designs"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const designs = snapshot.docs.map((d) => d.data() as Design);
        setData(designs);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { data, loading };
}

export function useCustomers(): { data: Customer[]; loading: boolean } {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "customers"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const customers = snapshot.docs.map((d) => d.data() as Customer);
        setData(customers);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { data, loading };
}

export function useOrders(): { data: Order[]; loading: boolean } {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((d) => d.data() as Order);
        setData(orders);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { data, loading };
}

export function usePayments(): { data: Payment[]; loading: boolean } {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "payments"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const payments = snapshot.docs.map((d) => d.data() as Payment);
        setData(payments);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { data, loading };
}
