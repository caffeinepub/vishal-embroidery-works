import { ShoppingBag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ConfirmOrderModal } from "../components/ConfirmOrderModal";
import { useAppStore } from "../store/appStore";

export function StitchingOrdersPage() {
  const { cart, removeFromCart, clearCart } = useAppStore();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleConfirmed = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header info */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Stitching Orders
          </h2>
          <p className="text-xs text-muted-foreground">
            {cart.length} design{cart.length !== 1 ? "s" : ""} selected
          </p>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            data-ocid="orders.clear_all.button"
            onClick={clearCart}
            className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-2.5 py-1.5 rounded-lg font-semibold"
          >
            <Trash2 size={13} />
            Clear All
          </button>
        )}
      </div>

      {/* Cart items */}
      {cart.length === 0 ? (
        <div
          data-ocid="orders.empty_state"
          className="flex-1 flex flex-col items-center justify-center py-16 px-8"
        >
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <ShoppingBag size={36} className="text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">
            No designs selected yet
          </p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Browse designs and tap "Add to Stitching Orders" to get started
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="space-y-2">
            {cart.map((item, idx) => (
              <div
                key={item.designId}
                data-ocid={`orders.item.${idx + 1}`}
                className="bg-card rounded-xl shadow-card flex items-center gap-3 p-3"
              >
                {item.designImage ? (
                  <img
                    src={item.designImage}
                    alt={item.designTitle}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🧵</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-primary">
                    {item.designCode}
                  </span>
                  <p className="text-sm font-semibold text-foreground line-clamp-1 mt-0.5">
                    {item.designTitle}
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid={`orders.remove.button.${idx + 1}`}
                  onClick={() => removeFromCart(item.designId)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-destructive/10 transition-colors flex-shrink-0"
                  aria-label="Remove from cart"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      {cart.length > 0 && (
        <div className="px-4 pb-4">
          <button
            type="button"
            data-ocid="orders.confirm.button"
            onClick={() => setShowConfirmModal(true)}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-card active:scale-[0.98] transition-transform"
          >
            Confirm Stitching Order ({cart.length})
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <ConfirmOrderModal
          cartItems={cart}
          onClose={() => setShowConfirmModal(false)}
          onConfirmed={handleConfirmed}
        />
      )}
    </div>
  );
}
