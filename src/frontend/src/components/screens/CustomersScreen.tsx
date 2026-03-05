import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer, Order, OrderStatus } from "../../backend.d";
import {
  useAllCustomers,
  useAllOrders,
  useCreateCustomer,
  useCreateOrder,
  useCustomerOrders,
  useDeleteCustomer,
  useDeleteOrder,
  useUpdateCustomer,
  useUpdateOrder,
  useUpdateOrderStatus,
} from "../../hooks/useQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerFormData {
  name: string;
  phone: string;
  address: string;
  bust: string;
  waist: string;
  shoulder: string;
  sleeveLength: string;
  blouseLength: string;
  frontNeck: string;
  backNeck: string;
}

interface OrderFormData {
  workType: string;
  designCode: string;
  deliveryDate: string;
  status: OrderStatus;
}

const emptyCustomerForm: CustomerFormData = {
  name: "",
  phone: "",
  address: "",
  bust: "",
  waist: "",
  shoulder: "",
  sleeveLength: "",
  blouseLength: "",
  frontNeck: "",
  backNeck: "",
};

const emptyOrderForm: OrderFormData = {
  workType: "",
  designCode: "",
  deliveryDate: "",
  status: "pending" as OrderStatus,
};

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CYCLE: OrderStatus[] = [
  "pending" as OrderStatus,
  "inStitching" as OrderStatus,
  "ready" as OrderStatus,
  "delivered" as OrderStatus,
];

function getNextStatus(current: OrderStatus): OrderStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "inStitching":
      return "In Stitching";
    case "ready":
      return "Ready";
    case "delivered":
      return "Delivered";
    default:
      return String(status);
  }
}

function statusColor(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "inStitching":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "ready":
      return "bg-green-100 text-green-700 border-green-200";
    case "delivered":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
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

function getLastOrderDate(
  customerId: bigint,
  allOrders: Order[],
): string | null {
  const customerOrders = allOrders.filter(
    (o) => o.customerId.toString() === customerId.toString(),
  );
  if (customerOrders.length === 0) return null;
  // Find the most recent order by createdAt
  const latest = customerOrders.reduce((a, b) =>
    a.createdAt > b.createdAt ? a : b,
  );
  if (!latest.deliveryDate) return null;
  return formatDate(latest.deliveryDate);
}

// ─── Customer Form Dialog ─────────────────────────────────────────────────────

function CustomerFormDialog({
  open,
  onOpenChange,
  editingCustomer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingCustomer: Customer | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CustomerFormData>(() =>
    editingCustomer
      ? {
          name: editingCustomer.name,
          phone: editingCustomer.phone,
          address: editingCustomer.address,
          bust: editingCustomer.bust,
          waist: editingCustomer.waist,
          shoulder: editingCustomer.shoulder,
          sleeveLength: editingCustomer.sleeveLength,
          blouseLength: editingCustomer.blouseLength,
          frontNeck: editingCustomer.frontNeck,
          backNeck: editingCustomer.backNeck,
        }
      : emptyCustomerForm,
  );

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isPending = createCustomer.isPending || updateCustomer.isPending;

  // Reset form when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(
        editingCustomer
          ? {
              name: editingCustomer.name,
              phone: editingCustomer.phone,
              address: editingCustomer.address,
              bust: editingCustomer.bust,
              waist: editingCustomer.waist,
              shoulder: editingCustomer.shoulder,
              sleeveLength: editingCustomer.sleeveLength,
              blouseLength: editingCustomer.blouseLength,
              frontNeck: editingCustomer.frontNeck,
              backNeck: editingCustomer.backNeck,
            }
          : emptyCustomerForm,
      );
    }
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone number are required");
      return;
    }
    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({ id: editingCustomer.id, ...form });
        toast.success("Customer updated / ಗ್ರಾಹಕರ ಮಾಹಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ");
      } else {
        await createCustomer.mutateAsync(form);
        toast.success("Customer added / ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಲಾಗಿದೆ");
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  const field = (
    key: keyof CustomerFormData,
    label: string,
    kannada: string,
    opts?: { required?: boolean; type?: string; multiline?: boolean },
  ) => (
    <div key={key}>
      <Label className="text-[11px] mb-1.5 block text-foreground/80">
        {label} / {kannada}
        {opts?.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {opts?.multiline ? (
        <Textarea
          data-ocid={`customer.form.${key}.textarea`}
          value={form[key]}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="rounded-xl text-sm resize-none"
          rows={2}
        />
      ) : (
        <Input
          data-ocid={`customer.form.${key}.input`}
          type={opts?.type ?? "text"}
          value={form[key]}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="h-10 text-sm rounded-xl"
        />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="customer.form.dialog"
        className="max-w-[95vw] rounded-2xl max-h-[90vh] flex flex-col p-0"
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 flex-shrink-0">
          <DialogTitle className="text-base font-bold text-vew-navy">
            {editingCustomer
              ? "Edit Customer / ಗ್ರಾಹಕರನ್ನು ಸಂಪಾದಿಸಿ"
              : "Add Customer / ಹೊಸ ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಿ"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {field("name", "Customer Name", "ಗ್ರಾಹಕರ ಹೆಸರು", { required: true })}
          {field("phone", "Phone Number", "ಫೋನ್ ನಂಬರ್", {
            required: true,
            type: "tel",
          })}
          {field("address", "Address", "ವಿಳಾಸ", { multiline: true })}

          <p className="text-xs font-semibold text-vew-navy pt-1">
            Measurements / ಅಳತೆಗಳು{" "}
            <span className="text-muted-foreground font-normal text-[10px]">
              (inches)
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["bust", "Bust", "ಎದೆ"],
                ["waist", "Waist", "ಸೊಂಟ"],
                ["shoulder", "Shoulder", "ಭುಜ"],
                ["sleeveLength", "Sleeve Length", "ತೋಳಿನ ಉದ್ದ"],
                ["blouseLength", "Blouse Length", "ಬ್ಲೌಸ್ ಉದ್ದ"],
                ["frontNeck", "Front Neck", "ಮುಂದಿನ ಕತ್ತು"],
                ["backNeck", "Back Neck", "ಹಿಂದಿನ ಕತ್ತು"],
              ] as [keyof CustomerFormData, string, string][]
            ).map(([key, label, kannada]) => (
              <div key={key}>
                <Label className="text-[10px] mb-1 block text-foreground/70">
                  {label} / {kannada}
                </Label>
                <Input
                  value={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                  placeholder='e.g. 36"'
                  className="h-9 text-sm rounded-xl"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border/60 flex gap-3 flex-shrink-0">
          <Button
            variant="outline"
            data-ocid="customer.form.cancel_button"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            data-ocid="customer.form.submit_button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" />
                Saving...
              </span>
            ) : editingCustomer ? (
              "Update / ನವೀಕರಿಸಿ"
            ) : (
              "Add / ಸೇರಿಸಿ"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Order Form Dialog ────────────────────────────────────────────────────────

function OrderFormDialog({
  open,
  onOpenChange,
  customerId,
  editingOrder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: bigint;
  editingOrder: Order | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<OrderFormData>(() =>
    editingOrder
      ? {
          workType: editingOrder.workType,
          designCode: editingOrder.designCode,
          deliveryDate: editingOrder.deliveryDate,
          status: editingOrder.status,
        }
      : emptyOrderForm,
  );

  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const isPending = createOrder.isPending || updateOrder.isPending;

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(
        editingOrder
          ? {
              workType: editingOrder.workType,
              designCode: editingOrder.designCode,
              deliveryDate: editingOrder.deliveryDate,
              status: editingOrder.status,
            }
          : emptyOrderForm,
      );
    }
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!form.workType.trim()) {
      toast.error("Work type is required");
      return;
    }
    try {
      if (editingOrder) {
        await updateOrder.mutateAsync({
          id: editingOrder.id,
          customerId,
          workType: form.workType,
          designCode: form.designCode,
          deliveryDate: form.deliveryDate,
        });
        toast.success("Order updated / ಆದೇಶ ನವೀಕರಿಸಲಾಗಿದೆ");
      } else {
        await createOrder.mutateAsync({
          customerId,
          workType: form.workType,
          designCode: form.designCode,
          deliveryDate: form.deliveryDate,
          status: form.status,
        });
        toast.success("Order added / ಆದೇಶ ಸೇರಿಸಲಾಗಿದೆ");
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save order. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="order.form.dialog"
        className="max-w-[95vw] rounded-2xl max-h-[85vh] flex flex-col p-0"
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 flex-shrink-0">
          <DialogTitle className="text-base font-bold text-vew-navy">
            {editingOrder
              ? "Edit Order / ಆದೇಶ ಸಂಪಾದಿಸಿ"
              : "Add Order / ಹೊಸ ಆದೇಶ ಸೇರಿಸಿ"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <Label className="text-[11px] mb-1.5 block">
              Work Type / ಕೆಲಸದ ವಿಧ <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="order.form.worktype.input"
              value={form.workType}
              onChange={(e) =>
                setForm((p) => ({ ...p, workType: e.target.value }))
              }
              placeholder="e.g. Embroidery, Blouse Stitching"
              className="h-10 text-sm rounded-xl"
            />
          </div>

          <div>
            <Label className="text-[11px] mb-1.5 block">
              Design Code / ಡಿಸೈನ್ ಕೋಡ್
            </Label>
            <Input
              data-ocid="order.form.designcode.input"
              value={form.designCode}
              onChange={(e) =>
                setForm((p) => ({ ...p, designCode: e.target.value }))
              }
              placeholder="e.g. VEW-AE-001"
              className="h-10 text-sm rounded-xl font-mono"
            />
          </div>

          <div>
            <Label className="text-[11px] mb-1.5 block">
              Delivery Date / ತಲುಪಿಸುವ ದಿನಾಂಕ
            </Label>
            <Input
              data-ocid="order.form.deliverydate.input"
              type="date"
              value={form.deliveryDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, deliveryDate: e.target.value }))
              }
              className="h-10 text-sm rounded-xl"
            />
          </div>

          <div>
            <Label className="text-[11px] mb-1.5 block">Status / ಸ್ಥಿತಿ</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, status: v as OrderStatus }))
              }
            >
              <SelectTrigger
                data-ocid="order.form.status.select"
                className="h-10 rounded-xl text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending / ಬಾಕಿ</SelectItem>
                <SelectItem value="inStitching">
                  In Stitching / ಹೊಲಿಯುವ ಹಂತ
                </SelectItem>
                <SelectItem value="ready">Ready / ಸಿದ್ಧ</SelectItem>
                <SelectItem value="delivered">Delivered / ತಲುಪಿಸಲಾಗಿದೆ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border/60 flex gap-3 flex-shrink-0">
          <Button
            variant="outline"
            data-ocid="order.form.cancel_button"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            data-ocid="order.form.submit_button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" />
                Saving...
              </span>
            ) : editingOrder ? (
              "Update / ನವೀಕರಿಸಿ"
            ) : (
              "Add Order / ಸೇರಿಸಿ"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Customer Detail View ─────────────────────────────────────────────────────

function CustomerDetailView({
  customer,
  onBack,
  onEditCustomer,
}: {
  customer: Customer;
  onBack: () => void;
  onEditCustomer: (c: Customer) => void;
}) {
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteOrderTarget, setDeleteOrderTarget] = useState<Order | null>(
    null,
  );

  const ordersQuery = useCustomerOrders(customer.id);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

  const orders = ordersQuery.data ?? [];

  const handleStatusCycle = async (order: Order) => {
    const next = getNextStatus(order.status);
    try {
      await updateStatus.mutateAsync({
        id: order.id,
        customerId: customer.id,
        status: next,
      });
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderTarget) return;
    try {
      await deleteOrder.mutateAsync({
        id: deleteOrderTarget.id,
        customerId: customer.id,
      });
      toast.success("Order deleted / ಆದೇಶ ತೆಗೆಯಲಾಗಿದೆ");
      setDeleteOrderTarget(null);
    } catch {
      toast.error("Delete failed. Please try again.");
    }
  };

  const measurements = [
    { label: "Bust", kannada: "ಎದೆ", value: customer.bust },
    { label: "Waist", kannada: "ಸೊಂಟ", value: customer.waist },
    { label: "Shoulder", kannada: "ಭುಜ", value: customer.shoulder },
    {
      label: "Sleeve",
      kannada: "ತೋಳಿನ ಉದ್ದ",
      value: customer.sleeveLength,
    },
    {
      label: "Blouse Length",
      kannada: "ಬ್ಲೌಸ್ ಉದ್ದ",
      value: customer.blouseLength,
    },
    {
      label: "Front Neck",
      kannada: "ಮುಂದಿನ ಕತ್ತು",
      value: customer.frontNeck,
    },
    {
      label: "Back Neck",
      kannada: "ಹಿಂದಿನ ಕತ್ತು",
      value: customer.backNeck,
    },
  ];

  const whatsappUrl = `https://wa.me/91${customer.phone.replace(/\D/g, "")}`;
  const telUrl = `tel:${customer.phone}`;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60 flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          data-ocid="customer.detail.back_button"
          onClick={onBack}
          className="p-1"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="text-sm font-bold text-vew-navy flex-1 truncate">
          {customer.name}
        </h2>
        <button
          type="button"
          data-ocid="customer.detail.edit_button"
          onClick={() => onEditCustomer(customer)}
          className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
        >
          <Edit2 className="w-4 h-4 text-blue-500" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {/* Avatar + contact */}
        <div className="px-4 pt-5 pb-4 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-vew-sky-light flex items-center justify-center mb-3 shadow-sm">
            <span className="text-3xl font-bold text-vew-sky">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h3 className="text-lg font-bold text-vew-navy">{customer.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {customer.phone}
          </p>

          {/* Contact actions */}
          <div className="flex gap-3 mt-3">
            <a
              href={telUrl}
              data-ocid="customer.detail.call_button"
              className="flex items-center gap-1.5 bg-vew-sky text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-vew-sky/90 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="customer.detail.whatsapp_button"
              className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>

          {/* Address */}
          {customer.address && (
            <div className="flex items-start gap-1.5 mt-3 text-xs text-muted-foreground max-w-xs">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-vew-sky" />
              <span>{customer.address}</span>
            </div>
          )}
        </div>

        {/* Measurements */}
        <div className="px-4">
          <p className="text-xs font-bold text-vew-navy uppercase tracking-wider mb-3">
            Measurements / ಅಳತೆಗಳು
          </p>
          <div className="grid grid-cols-2 gap-2">
            {measurements.map((m) => (
              <div
                key={m.label}
                className="bg-vew-sky-light/40 rounded-xl p-2.5"
              >
                <p className="text-[9px] text-muted-foreground leading-tight">
                  {m.label} / {m.kannada}
                </p>
                <p className="text-sm font-bold text-vew-navy mt-0.5">
                  {m.value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Orders */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-vew-navy uppercase tracking-wider">
              Orders / ಆದೇಶಗಳು
            </p>
            <Button
              data-ocid="customer.detail.add_order_button"
              onClick={() => {
                setEditingOrder(null);
                setOrderFormOpen(true);
              }}
              size="sm"
              className="bg-vew-sky text-white hover:bg-vew-sky-dark rounded-xl h-8 px-3 text-xs gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Order
            </Button>
          </div>

          {ordersQuery.isLoading ? (
            <div
              data-ocid="customer.orders.loading_state"
              className="space-y-2"
            >
              {Array.from({ length: 2 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div
              data-ocid="customer.orders.empty_state"
              className="text-center py-8 bg-muted/30 rounded-xl"
            >
              <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs font-semibold text-muted-foreground">
                No orders yet
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                ಯಾವುದೇ ಆದೇಶಗಳಿಲ್ಲ
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.map((order, idx) => (
                <div
                  key={order.id.toString()}
                  data-ocid={`customer.orders.item.${idx + 1}`}
                  className="bg-white rounded-xl border border-border/60 shadow-xs p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-vew-navy truncate">
                          {order.workType || "—"}
                        </p>
                        {order.designCode && (
                          <span className="text-[9px] font-mono bg-vew-sky-light text-vew-sky px-1.5 py-0.5 rounded-md flex-shrink-0">
                            {order.designCode}
                          </span>
                        )}
                      </div>

                      {order.deliveryDate && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(order.deliveryDate)}</span>
                        </div>
                      )}

                      {/* Status badge — tap to cycle */}
                      <button
                        type="button"
                        data-ocid={`customer.orders.status.${idx + 1}`}
                        onClick={() => handleStatusCycle(order)}
                        disabled={updateStatus.isPending}
                        className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-opacity hover:opacity-80 ${statusColor(order.status)}`}
                        title="Tap to change status"
                      >
                        {statusLabel(order.status)}
                      </button>
                    </div>

                    {/* Order actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        data-ocid={`customer.orders.edit_button.${idx + 1}`}
                        onClick={() => {
                          setEditingOrder(order);
                          setOrderFormOpen(true);
                        }}
                        className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                      </button>
                      <button
                        type="button"
                        data-ocid={`customer.orders.delete_button.${idx + 1}`}
                        onClick={() => setDeleteOrderTarget(order)}
                        className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Form Dialog */}
      <OrderFormDialog
        open={orderFormOpen}
        onOpenChange={setOrderFormOpen}
        customerId={customer.id}
        editingOrder={editingOrder}
        onSaved={() => setEditingOrder(null)}
      />

      {/* Delete Order Confirmation */}
      <AlertDialog
        open={!!deleteOrderTarget}
        onOpenChange={(o) => !o && setDeleteOrderTarget(null)}
      >
        <AlertDialogContent
          data-ocid="order.delete.dialog"
          className="max-w-[90vw] rounded-2xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this order for "{deleteOrderTarget?.workType}"? This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="order.delete.cancel_button"
              className="rounded-xl"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="order.delete.confirm_button"
              onClick={handleDeleteOrder}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main Customers Screen ────────────────────────────────────────────────────

export function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomerTarget, setDeleteCustomerTarget] =
    useState<Customer | null>(null);

  const customersQuery = useAllCustomers();
  const allOrdersQuery = useAllOrders();
  const deleteCustomer = useDeleteCustomer();

  const customers = customersQuery.data ?? [];
  const allOrders = allOrdersQuery.data ?? [];

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery),
  );

  const handleAdd = () => {
    setEditingCustomer(null);
    setCustomerFormOpen(true);
  };

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setCustomerFormOpen(true);
    // Close detail view if open
    if (selectedCustomer?.id === c.id) {
      setSelectedCustomer(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCustomerTarget) return;
    try {
      await deleteCustomer.mutateAsync(deleteCustomerTarget.id);
      toast.success("Customer deleted / ಗ್ರಾಹಕರನ್ನು ತೆಗೆಯಲಾಗಿದೆ");
      setDeleteCustomerTarget(null);
      // Go back to list if viewing the deleted customer
      if (selectedCustomer?.id === deleteCustomerTarget.id) {
        setSelectedCustomer(null);
      }
    } catch {
      toast.error("Delete failed. Please try again.");
    }
  };

  // Show detail view
  if (selectedCustomer) {
    return (
      <>
        <CustomerDetailView
          customer={selectedCustomer}
          onBack={() => setSelectedCustomer(null)}
          onEditCustomer={(c) => {
            setSelectedCustomer(null);
            handleEdit(c);
          }}
        />
        <CustomerFormDialog
          open={customerFormOpen}
          onOpenChange={setCustomerFormOpen}
          editingCustomer={editingCustomer}
          onSaved={() => setEditingCustomer(null)}
        />
      </>
    );
  }

  // Customer list view
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-vew-sky" />
            <div>
              <h2 className="text-sm font-bold text-vew-navy">Customers</h2>
              <p className="text-[10px] text-vew-sky">ಗ್ರಾಹಕರು</p>
            </div>
            <span className="ml-1 bg-vew-sky-light text-vew-sky text-xs font-semibold px-2 py-0.5 rounded-full">
              {customers.length}
            </span>
          </div>
          <Button
            data-ocid="customers.add_button"
            onClick={handleAdd}
            size="sm"
            className="bg-vew-sky text-white hover:bg-vew-sky-dark rounded-xl h-9 px-3 text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            data-ocid="customers.search_input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="pl-8 h-9 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {customersQuery.isLoading ? (
          <div data-ocid="customers.loading_state" className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div
            data-ocid="customers.empty_state"
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-vew-sky-light flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-vew-sky" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {searchQuery ? "No customers found" : "No customers yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? "ಯಾವುದೇ ಫಲಿತಾಂಶ ಸಿಗಲಿಲ್ಲ" : "ಇನ್ನೂ ಯಾವುದೇ ಗ್ರಾಹಕರಿಲ್ಲ"}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleAdd}
                className="mt-4 bg-vew-sky text-white rounded-xl h-10 px-4"
              >
                Add First Customer
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredCustomers.map((c, idx) => {
              const lastOrder = getLastOrderDate(c.id, allOrders);
              const orderCount = allOrders.filter(
                (o) => o.customerId.toString() === c.id.toString(),
              ).length;
              return (
                <div
                  key={c.id.toString()}
                  data-ocid={`customers.item.${idx + 1}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-3.5 py-3"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-vew-sky-light flex items-center justify-center flex-shrink-0">
                    <span className="text-vew-sky font-bold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info — tap to open detail */}
                  <button
                    type="button"
                    className="flex-1 text-left min-w-0"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <p className="text-sm font-semibold text-vew-navy truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {c.phone}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {orderCount > 0 ? (
                        <span className="text-vew-sky font-medium">
                          {orderCount} order{orderCount !== 1 ? "s" : ""}
                          {lastOrder ? ` · Due: ${lastOrder}` : ""}
                        </span>
                      ) : (
                        <span>No orders</span>
                      )}
                    </p>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      data-ocid={`customers.edit_button.${idx + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(c);
                      }}
                      className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                    <button
                      type="button"
                      data-ocid={`customers.delete_button.${idx + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteCustomerTarget(c);
                      }}
                      className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        open={customerFormOpen}
        onOpenChange={setCustomerFormOpen}
        editingCustomer={editingCustomer}
        onSaved={() => setEditingCustomer(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteCustomerTarget}
        onOpenChange={(o) => !o && setDeleteCustomerTarget(null)}
      >
        <AlertDialogContent
          data-ocid="customers.delete.dialog"
          className="max-w-[90vw] rounded-2xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteCustomerTarget?.name}" and all their orders? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="customers.delete.cancel_button"
              className="rounded-xl"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="customers.delete.confirm_button"
              onClick={handleConfirmDelete}
              disabled={deleteCustomer.isPending}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              {deleteCustomer.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
