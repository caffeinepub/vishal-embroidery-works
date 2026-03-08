import { MessageCircle, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCustomers } from "../hooks/useFirestore";
import { addCustomer, addOrder, addPayment } from "../lib/firestoreService";
import { type CartItem, type Customer, generateId } from "../lib/storage";
import { useAppStore } from "../store/appStore";

interface ConfirmOrderModalProps {
  cartItems: CartItem[];
  onClose: () => void;
  onConfirmed: () => void;
}

export function ConfirmOrderModal({
  cartItems,
  onClose,
  onConfirmed,
}: ConfirmOrderModalProps) {
  const { clearCart } = useAppStore();
  const { data: customers } = useCustomers();
  const [mode, setMode] = useState<"search" | "new">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"customer" | "payment" | "done">("customer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    customerName: string;
    customerPhone: string;
    deliveryDate: string;
    totalAmount: number;
    advancePaid: number;
    balance: number;
    designCodes: string[];
  } | null>(null);

  const filteredCustomers = searchQuery.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery),
      )
    : customers.slice(0, 5);

  const total = Number.parseFloat(totalAmount) || 0;
  const advance = Number.parseFloat(advancePaid) || 0;
  const balance = total - advance;

  const handleNext = () => {
    if (mode === "search" && !selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (mode === "new" && !newName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!deliveryDate) {
      toast.error("Delivery date is required");
      return;
    }
    setStep("payment");
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      let customerId: string;
      let customerName: string;
      let customerPhone: string;

      if (mode === "new" || !selectedCustomer) {
        // Create new customer
        const newCustomer: Customer = {
          id: generateId(),
          name: newName.trim(),
          phone: newPhone.trim(),
          address: "",
          notes: "",
          measurements: {
            chest: "",
            waist: "",
            shoulder: "",
            sleeveLength: "",
            blouseLength: "",
            frontNeckDepth: "",
            backNeckDepth: "",
          },
          createdAt: new Date().toISOString(),
        };
        await addCustomer(newCustomer);
        customerId = newCustomer.id;
        customerName = newCustomer.name;
        customerPhone = newCustomer.phone;
      } else {
        customerId = selectedCustomer.id;
        customerName = selectedCustomer.name;
        customerPhone = selectedCustomer.phone;
      }

      const orderId = generateId();
      const order = {
        id: orderId,
        customerId,
        customerName,
        customerPhone,
        designs: cartItems.map((item) => ({
          designId: item.designId,
          designCode: item.designCode,
          designTitle: item.designTitle,
          designImage: item.designImage,
          isManual: false,
        })),
        deliveryDate,
        status: "Pending" as const,
        totalAmount: total,
        advancePaid: advance,
        orderDate: new Date().toISOString(),
        notes: notes.trim(),
      };
      await addOrder(order);

      if (advance > 0) {
        await addPayment({
          id: generateId(),
          orderId,
          customerId,
          amount: advance,
          type: "advance",
          date: new Date().toISOString(),
          notes: "Advance payment on order creation",
        });
      }

      clearCart();
      setConfirmedOrder({
        id: orderId,
        customerName,
        customerPhone,
        deliveryDate,
        totalAmount: total,
        advancePaid: advance,
        balance,
        designCodes: cartItems.map((i) => `${i.designCode} - ${i.designTitle}`),
      });
      setStep("done");
      toast.success("Order confirmed successfully!");
    } catch {
      toast.error("Failed to save order. Check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareOnWhatsApp = () => {
    if (!confirmedOrder) return;
    const message = `*Vishal Embroidery Works*\n\nCustomer: ${confirmedOrder.customerName}\nPhone: ${confirmedOrder.customerPhone}\n\n*Designs:*\n${confirmedOrder.designCodes.map((c) => `• ${c}`).join("\n")}\n\nDelivery Date: ${new Date(confirmedOrder.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}\n\n💰 Total Amount: ₹${confirmedOrder.totalAmount}\n✅ Advance Paid: ₹${confirmedOrder.advancePaid}\n⏳ Balance: ₹${confirmedOrder.balance}\n\nThank you for choosing VEW! 🌸`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end animate-fade-in">
      <div className="bg-card rounded-t-2xl max-h-[92vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">
            {step === "done" ? "Order Confirmed ✓" : "Confirm Stitching Order"}
          </h2>
          <button
            type="button"
            data-ocid="order.close_button"
            onClick={() => {
              onClose();
              if (step === "done") onConfirmed();
            }}
            className="p-2 rounded-full hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {step === "customer" && (
            <div className="space-y-4">
              {/* Cart summary */}
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  DESIGNS ({cartItems.length})
                </p>
                <div className="space-y-1.5">
                  {cartItems.map((item) => (
                    <div
                      key={item.designId}
                      className="flex items-center gap-2"
                    >
                      {item.designImage ? (
                        <img
                          src={item.designImage}
                          alt={item.designTitle}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          🧵
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-primary">
                          {item.designCode}
                        </p>
                        <p className="text-xs text-foreground line-clamp-1">
                          {item.designTitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2 bg-muted rounded-xl p-1">
                <button
                  type="button"
                  data-ocid="order.search_customer.tab"
                  onClick={() => {
                    setMode("search");
                    setSelectedCustomer(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    mode === "search"
                      ? "bg-card shadow-xs text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Search Customer
                </button>
                <button
                  type="button"
                  data-ocid="order.new_customer.tab"
                  onClick={() => {
                    setMode("new");
                    setSelectedCustomer(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    mode === "new"
                      ? "bg-card shadow-xs text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  New Customer
                </button>
              </div>

              {mode === "search" && (
                <div>
                  <div className="relative mb-3">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      data-ocid="order.search_input"
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No customers found
                      </p>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <button
                          type="button"
                          key={customer.id}
                          data-ocid="order.customer.card"
                          onClick={() => setSelectedCustomer(customer)}
                          className={`w-full text-left p-3 rounded-xl border transition-colors ${
                            selectedCustomer?.id === customer.id
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:bg-muted/50"
                          }`}
                        >
                          <p className="font-semibold text-sm text-foreground">
                            {customer.name}
                          </p>
                          {customer.phone && (
                            <p className="text-xs text-muted-foreground">
                              {customer.phone}
                            </p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {mode === "new" && (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="order-cust-name"
                      className="text-xs font-semibold text-muted-foreground block mb-1"
                    >
                      Customer Name *
                    </label>
                    <input
                      id="order-cust-name"
                      data-ocid="order.customer_name.input"
                      type="text"
                      placeholder="Enter name..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="order-cust-phone"
                      className="text-xs font-semibold text-muted-foreground block mb-1"
                    >
                      Phone (Optional)
                    </label>
                    <input
                      id="order-cust-phone"
                      data-ocid="order.customer_phone.input"
                      type="tel"
                      placeholder="Enter phone..."
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              )}

              {/* Delivery date */}
              <div>
                <label
                  htmlFor="order-delivery-date"
                  className="text-xs font-semibold text-muted-foreground block mb-1"
                >
                  Delivery Date *
                </label>
                <input
                  id="order-delivery-date"
                  data-ocid="order.delivery_date.input"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <p className="text-sm font-semibold text-foreground">
                  {selectedCustomer?.name || newName}
                </p>
                {(selectedCustomer?.phone || newPhone) && (
                  <p className="text-xs text-muted-foreground">
                    {selectedCustomer?.phone || newPhone}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  Delivery:{" "}
                  {deliveryDate
                    ? new Date(deliveryDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </p>
              </div>

              <div>
                <label
                  htmlFor="order-total"
                  className="text-xs font-semibold text-muted-foreground block mb-1"
                >
                  Total Amount (₹)
                </label>
                <input
                  id="order-total"
                  data-ocid="order.total_amount.input"
                  type="number"
                  placeholder="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label
                  htmlFor="order-advance"
                  className="text-xs font-semibold text-muted-foreground block mb-1"
                >
                  Advance Paid (₹)
                </label>
                <input
                  id="order-advance"
                  data-ocid="order.advance_paid.input"
                  type="number"
                  placeholder="0"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {(total > 0 || advance > 0) && (
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance Due</span>
                    <span className="font-bold text-foreground">
                      ₹{Math.max(0, balance)}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label
                  htmlFor="order-notes"
                  className="text-xs font-semibold text-muted-foreground block mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="order-notes"
                  data-ocid="order.notes.textarea"
                  placeholder="Any special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          )}

          {step === "done" && confirmedOrder && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">✓</span>
                </div>
                <p className="font-bold text-lg text-foreground">
                  Order Saved!
                </p>
                <p className="text-sm text-muted-foreground">
                  Order has been added to customer profile
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-semibold text-foreground">
                    {confirmedOrder.customerName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Designs</span>
                  <span className="font-semibold text-foreground">
                    {confirmedOrder.designCodes.length} design
                    {confirmedOrder.designCodes.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold text-foreground">
                    ₹{confirmedOrder.totalAmount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Advance</span>
                  <span className="font-semibold text-foreground">
                    ₹{confirmedOrder.advancePaid}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-bold text-primary">
                    ₹{confirmedOrder.balance}
                  </span>
                </div>
              </div>

              <button
                type="button"
                data-ocid="order.whatsapp.button"
                onClick={shareOnWhatsApp}
                className="w-full py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Share on WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {step === "customer" && (
            <button
              type="button"
              data-ocid="order.next.button"
              onClick={handleNext}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Continue to Payment
            </button>
          )}
          {step === "payment" && (
            <div className="flex gap-3">
              <button
                type="button"
                data-ocid="order.back.button"
                onClick={() => setStep("customer")}
                className="flex-1 py-3.5 rounded-xl bg-muted text-foreground font-semibold text-sm"
              >
                Back
              </button>
              <button
                type="button"
                data-ocid="order.confirm.button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Confirm Order"}
              </button>
            </div>
          )}
          {step === "done" && (
            <button
              type="button"
              data-ocid="order.done.button"
              onClick={() => {
                onClose();
                onConfirmed();
              }}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
