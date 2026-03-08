import { useState } from "react";
import { toast } from "sonner";
import { useOrders, usePayments } from "../../hooks/useFirestore";
import { addPayment, updateCustomer } from "../../lib/firestoreService";
import {
  type Customer,
  formatDate,
  generateId,
  getPaymentStatus,
} from "../../lib/storage";

interface CustomerProfileProps {
  customer: Customer;
  onClose?: () => void;
  onUpdated: () => void;
}

type ProfileTab = "orders" | "tracking" | "payments" | "measurements" | "notes";

const ORDER_STATUS_COLORS: Record<string, string> = {
  Pending: "status-pending",
  Cutting: "status-cutting",
  Stitching: "status-stitching",
  Ready: "status-ready",
  Completed: "status-completed",
};

export function CustomerProfile({ customer, onUpdated }: CustomerProfileProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("orders");
  const [measurements, setMeasurements] = useState(customer.measurements);
  const [notes, setNotes] = useState(customer.notes);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState<"advance" | "partial" | "final">(
    "partial",
  );
  const [payNotes, setPayNotes] = useState("");

  const { data: allOrders } = useOrders();
  const { data: allPayments } = usePayments();

  const orders = allOrders.filter((o) => o.customerId === customer.id);
  const payments = allPayments.filter((p) => p.customerId === customer.id);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCharged = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const balance = totalCharged - totalPaid;
  const paymentStatus = getPaymentStatus(totalCharged, totalPaid);

  const saveMeasurements = async () => {
    try {
      await updateCustomer({ ...customer, measurements });
      onUpdated();
      toast.success("Measurements saved");
    } catch {
      toast.error("Failed to save measurements");
    }
  };

  const saveNotes = async () => {
    try {
      await updateCustomer({ ...customer, notes });
      onUpdated();
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const handleAddPayment = async () => {
    const amount = Number.parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    // Find most recent order for reference
    const latestOrder = [...orders].sort(
      (a, b) =>
        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
    )[0];
    try {
      await addPayment({
        id: generateId(),
        orderId: latestOrder?.id || "",
        customerId: customer.id,
        amount,
        type: payType,
        date: new Date().toISOString(),
        notes: payNotes.trim(),
      });
      toast.success("Payment recorded");
      setShowPaymentForm(false);
      setPayAmount("");
      setPayNotes("");
      onUpdated();
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const measurementFields = [
    { key: "chest", label: "Chest" },
    { key: "waist", label: "Waist" },
    { key: "shoulder", label: "Shoulder" },
    { key: "sleeveLength", label: "Sleeve Length" },
    { key: "blouseLength", label: "Blouse Length" },
    { key: "frontNeckDepth", label: "Front Neck Depth" },
    { key: "backNeckDepth", label: "Back Neck Depth" },
  ] as const;

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "orders", label: "Orders" },
    { id: "tracking", label: "Tracking" },
    { id: "payments", label: "Payments" },
    { id: "measurements", label: "Measures" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Customer info */}
      <div className="px-4 pt-2 pb-3 border-b border-border bg-muted/30">
        <h3 className="font-bold text-base text-foreground">{customer.name}</h3>
        {customer.phone && (
          <p className="text-xs text-muted-foreground">{customer.phone}</p>
        )}
        {customer.address && (
          <p className="text-xs text-muted-foreground">{customer.address}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
            {orders.length} orders
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              paymentStatus === "Paid"
                ? "payment-paid"
                : paymentStatus === "Partial"
                  ? "payment-partial"
                  : "payment-pending"
            }`}
          >
            {paymentStatus}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            data-ocid={`customer.${tab.id}.tab`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p
                data-ocid="customer.orders.empty_state"
                className="text-center text-muted-foreground py-8"
              >
                No orders yet
              </p>
            ) : (
              [...orders]
                .sort(
                  (a, b) =>
                    new Date(b.orderDate).getTime() -
                    new Date(a.orderDate).getTime(),
                )
                .map((order, idx) => (
                  <div
                    key={order.id}
                    data-ocid={`customer.order.item.${idx + 1}`}
                    className="bg-muted/30 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Order {formatDate(order.orderDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Delivery: {formatDate(order.deliveryDate)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ORDER_STATUS_COLORS[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {order.designs.map((d) => (
                        <span
                          key={d.designId}
                          className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold"
                        >
                          {d.designCode}
                        </span>
                      ))}
                    </div>
                    {order.totalAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ₹{order.totalAmount} | Advance: ₹{order.advancePaid}
                      </p>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === "tracking" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-2.5">
              ℹ️ Status can be updated from the Orders tab
            </p>
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No orders yet
              </p>
            ) : (
              [...orders]
                .sort(
                  (a, b) =>
                    new Date(b.orderDate).getTime() -
                    new Date(a.orderDate).getTime(),
                )
                .map((order) => (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl border border-border p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-foreground">
                        {order.designs.map((d) => d.designCode).join(", ")}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ORDER_STATUS_COLORS[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                      {[
                        "Pending",
                        "Cutting",
                        "Stitching",
                        "Ready",
                        "Completed",
                      ].map((status) => (
                        <span
                          key={status}
                          className={`flex-shrink-0 text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                            order.status === status
                              ? ORDER_STATUS_COLORS[status]
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {status}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Delivery: {formatDate(order.deliveryDate)}
                    </p>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-foreground">
                  ₹{totalCharged}
                </p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-green-600">₹{totalPaid}</p>
                <p className="text-[10px] text-muted-foreground">Paid</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-primary">
                  ₹{Math.max(0, balance)}
                </p>
                <p className="text-[10px] text-muted-foreground">Balance</p>
              </div>
            </div>

            <button
              type="button"
              data-ocid="customer.add_payment.button"
              onClick={() => setShowPaymentForm(true)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              + Add Payment
            </button>

            {showPaymentForm && (
              <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Record Payment
                </p>
                <input
                  data-ocid="customer.payment_amount.input"
                  type="number"
                  placeholder="Amount (₹)"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none"
                />
                <select
                  data-ocid="customer.payment_type.select"
                  value={payType}
                  onChange={(e) =>
                    setPayType(
                      e.target.value as "advance" | "partial" | "final",
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none"
                >
                  <option value="advance">Advance</option>
                  <option value="partial">Partial</option>
                  <option value="final">Final</option>
                </select>
                <input
                  data-ocid="customer.payment_notes.input"
                  type="text"
                  placeholder="Notes (optional)"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-ocid="customer.payment_cancel.button"
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 py-2 rounded-xl bg-muted text-foreground text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-ocid="customer.payment_save.button"
                    onClick={handleAddPayment}
                    className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Payment history */}
            {payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  PAYMENT HISTORY
                </p>
                <div className="space-y-2">
                  {[...payments]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((p, idx) => (
                      <div
                        key={p.id}
                        data-ocid={`customer.payment.item.${idx + 1}`}
                        className="flex items-center justify-between bg-card rounded-xl border border-border p-3"
                      >
                        <div>
                          <p className="text-xs font-semibold text-foreground capitalize">
                            {p.type} payment
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(p.date)}
                          </p>
                          {p.notes && (
                            <p className="text-[10px] text-muted-foreground">
                              {p.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          +₹{p.amount}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "measurements" && (
          <div className="space-y-3">
            {measurementFields.map((field) => (
              <div key={field.key}>
                <p className="text-xs font-semibold text-muted-foreground block mb-1">
                  {field.label.toUpperCase()} (inches)
                </p>
                <input
                  data-ocid={`customer.measurement_${field.key}.input`}
                  type="number"
                  step="0.5"
                  placeholder="0"
                  value={measurements[field.key]}
                  onChange={(e) =>
                    setMeasurements((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
            <button
              type="button"
              data-ocid="customer.save_measurements.button"
              onClick={saveMeasurements}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm mt-2"
            >
              Save Measurements
            </button>
          </div>
        )}

        {activeTab === "notes" && (
          <div>
            <textarea
              data-ocid="customer.notes.textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Add notes about this customer..."
              rows={8}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <button
              type="button"
              data-ocid="customer.save_notes.button"
              onClick={saveNotes}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm mt-3"
            >
              Save Notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
