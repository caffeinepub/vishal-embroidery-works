import { Crown, Home, Scissors, Shirt, ShoppingBag } from "lucide-react";
import { type ActiveTab, useAppStore } from "../store/appStore";

interface BottomNavProps {
  onTabChange: (tab: ActiveTab) => void;
}

const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <Home size={20} /> },
  { id: "embroidery", label: "Embroidery", icon: <Scissors size={20} /> },
  { id: "blouse", label: "Blouse", icon: <Shirt size={20} /> },
  { id: "bridal", label: "Bridal", icon: <Crown size={20} /> },
  { id: "orders", label: "Orders", icon: <ShoppingBag size={20} /> },
];

export function BottomNav({ onTabChange }: BottomNavProps) {
  const { activeTab, cart } = useAppStore();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-nav z-40 pb-safe"
      style={{ height: "60px" }}
    >
      <div className="flex items-stretch h-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isOrders = tab.id === "orders";
          return (
            <button
              type="button"
              key={tab.id}
              data-ocid={`nav.${tab.id}.link`}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              style={{ minHeight: "44px" }}
            >
              <div className="relative">
                {tab.icon}
                {isOrders && cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cart.length > 9 ? "9+" : cart.length}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium leading-none ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
