import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  type Order,
  type OrderStatus,
  deleteOrder,
  formatDate,
  getOrders,
  updateOrder,
} from "../../lib/storage";
import { ManualOrderModal } from "./ManualOrderModal";

const ALL_STATUSES: OrderStatus[] = [
  "Pending",
  "Cutting",
  "Stitching",
  "Ready",
  "Completed",
];
type FilterStatus = "All" | OrderStatus;

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: "status-pending",
  Cutting: "status-cutting",
  Stitching: "status-stitching",
  Ready: "status-ready",
  Completed: "status-completed",
};

export function AdminOrders() {
  const [orders, setOrders] = useState(() => getOrders());
  const [filter, setFilter] = useState<FilterStatus>("All");
  const [showManualModal, setShowManualModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);

  const refresh = useCallback(() => setOrders(getOrders()), []);

  const filtered =
    filter === "All" ? orders : orders.filter((o) => o.status === filter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
  );

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    updateOrder({ ...order, status: newStatus });
    refresh();
    setStatusDropdownId(null);
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleDelete = (id: string) => {
    deleteOrder(id);
    refresh();
    setDeleteConfirmId(null);
    toast.success("Order deleted");
  };

  const filters: FilterStatus[] = ["All", ...ALL_STATUSES];

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
        {filters.map((f) => (
          <button
            type="button"
            key={f}
            data-ocid={`admin.orders.filter_${f.toLowerCase()}.tab`}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add Manual Order */}
      <button
        type="button"
        data-ocid="admin.orders.add.button"
        onClick={() => setShowManualModal(true)}
        className="w-full py-2.5 mb-3 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
      >
        <Plus size={16} />
        Add Manual Order
      </button>

      <p className="text-xs text-muted-foreground mb-3">
        {sorted.length} orders
      </p>

      {sorted.length === 0 ? (
        <div data-ocid="admin.orders.empty_state" className="text-center py-12">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((order, idx) => (
            <div
              key={order.id}
              data-ocid={`admin.orders.item.${idx + 1}`}
              className="bg-card rounded-xl shadow-card p-3"
            >
              {/* Customer info */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm text-foreground">
                    {order.customerName}
                  </p>
                  {order.customerPhone && (
                    <p className="text-xs text-muted-foreground">
                      {order.customerPhone}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${STATUS_COLORS[order.status]}`}
                >
                  {order.status}
                </span>
              </div>

              {/* Designs */}
              <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-hide">
                {order.designs.map((d) => (
                  <div
                    key={d.designId}
                    className="flex-shrink-0 flex items-center gap-1.5 bg-muted/50 rounded-lg p-1.5"
                  >
                    {d.designImage ? (
                      <img
                        src={d.designImage}
                        alt={d.designCode}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs">
                        🧵
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-primary">
                        {d.designCode}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[60px]">
                        {d.designTitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div className="flex items-center gap-3 mb-2">
                <p className="text-[10px] text-muted-foreground">
                  Order: {formatDate(order.orderDate)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Delivery: {formatDate(order.deliveryDate)}
                </p>
              </div>

              {/* Payment */}
              {order.totalAmount > 0 && (
                <p className="text-xs text-muted-foreground mb-2">
                  ₹{order.totalAmount} | Paid: ₹{order.advancePaid} | Balance: ₹
                  {Math.max(0, order.totalAmount - order.advancePaid)}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {order.status === "Pending" && (
                  <button
                    type="button"
                    data-ocid={`admin.orders.mark_cutting.button.${idx + 1}`}
                    onClick={() => handleStatusChange(order, "Cutting")}
                    className="flex-1 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold"
                  >
                    Mark Cutting
                  </button>
                )}
                <div className="relative flex-1">
                  <button
                    type="button"
                    data-ocid={`admin.orders.status.button.${idx + 1}`}
                    onClick={() =>
                      setStatusDropdownId(
                        statusDropdownId === order.id ? null : order.id,
                      )
                    }
                    className="w-full py-2 rounded-lg bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    Status <ChevronDown size={11} />
                  </button>
                  {statusDropdownId === order.id && (
                    <div
                      data-ocid={`admin.orders.status.dropdown_menu.${idx + 1}`}
                      className="absolute bottom-full mb-1 left-0 right-0 bg-card border border-border rounded-xl shadow-card-hover z-10 overflow-hidden"
                    >
                      {ALL_STATUSES.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => handleStatusChange(order, s)}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors ${
                            order.status === s
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  data-ocid={`admin.orders.delete_button.${idx + 1}`}
                  onClick={() => setDeleteConfirmId(order.id)}
                  className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0"
                >
                  <Trash2 size={13} className="text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showManualModal && (
        <ManualOrderModal
          onClose={() => setShowManualModal(false)}
          onSaved={refresh}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div
            data-ocid="admin.delete_order.dialog"
            className="bg-card rounded-2xl p-5 w-full max-w-xs animate-fade-in"
          >
            <h3 className="font-bold text-foreground text-base mb-2">
              Delete Order?
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                data-ocid="admin.delete_order.cancel_button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="admin.delete_order.confirm_button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
