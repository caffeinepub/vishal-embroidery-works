import { Lock, X } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../../store/appStore";
import { AdminCustomers } from "./AdminCustomers";
import { AdminDashboard } from "./AdminDashboard";
import { AdminDesigns } from "./AdminDesigns";
import { AdminOrders } from "./AdminOrders";
import { BulkUpload } from "./BulkUpload";
import { UploadDesign } from "./UploadDesign";

type AdminTab =
  | "upload"
  | "bulk"
  | "designs"
  | "customers"
  | "orders"
  | "dashboard";

const tabs: { id: AdminTab; label: string; emoji: string }[] = [
  { id: "upload", label: "Upload", emoji: "📸" },
  { id: "bulk", label: "Bulk", emoji: "📦" },
  { id: "designs", label: "Designs", emoji: "🧵" },
  { id: "customers", label: "Customers", emoji: "👥" },
  { id: "orders", label: "Orders", emoji: "📋" },
  { id: "dashboard", label: "Dashboard", emoji: "📊" },
];

export function AdminPanel() {
  const { closeAdmin, lockAdmin } = useAppStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("upload");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleLock = () => {
    lockAdmin();
    closeAdmin();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl vew-hero-gradient flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">VEW</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Admin Panel</p>
            <p className="text-[10px] text-muted-foreground">
              Vishal Embroidery Works
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="admin.lock.button"
            onClick={handleLock}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Lock admin"
          >
            <Lock size={16} />
          </button>
          <button
            type="button"
            data-ocid="admin.close.button"
            onClick={closeAdmin}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Close admin"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto scrollbar-hide bg-card border-b border-border px-3 py-1.5 gap-1">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            data-ocid={`admin.${tab.id}.tab`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "upload" && (
          <UploadDesign key={`upload-${refreshKey}`} onSaved={handleSaved} />
        )}
        {activeTab === "bulk" && (
          <BulkUpload key={`bulk-${refreshKey}`} onSaved={handleSaved} />
        )}
        {activeTab === "designs" && (
          <AdminDesigns key={`designs-${refreshKey}`} />
        )}
        {activeTab === "customers" && (
          <AdminCustomers key={`customers-${refreshKey}`} />
        )}
        {activeTab === "orders" && <AdminOrders key={`orders-${refreshKey}`} />}
        {activeTab === "dashboard" && (
          <AdminDashboard key={`dashboard-${refreshKey}`} />
        )}
      </div>
    </div>
  );
}
