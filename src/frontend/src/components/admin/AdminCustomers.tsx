import { ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCustomers, useOrders } from "../../hooks/useFirestore";
import {
  addCustomer,
  deleteCustomer,
  updateCustomer,
} from "../../lib/firestoreService";
import { type Customer, formatDate, generateId } from "../../lib/storage";
import { CustomerProfile } from "./CustomerProfile";

export function AdminCustomers() {
  const { data: customers } = useCustomers();
  const { data: allOrders } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // New customer form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const filtered = searchQuery.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery),
      )
    : customers;

  const handleAddCustomer = async () => {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    const customer: Customer = {
      id: generateId(),
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
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
    try {
      await addCustomer(customer);
      toast.success("Customer added");
      setShowAddForm(false);
      setNewName("");
      setNewPhone("");
      setNewAddress("");
    } catch {
      toast.error("Failed to add customer");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      setDeleteConfirmId(null);
      toast.success("Customer deleted");
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const handleEditSave = async () => {
    if (!editingCustomer) return;
    try {
      await updateCustomer(editingCustomer);
      setEditingCustomer(null);
      toast.success("Customer updated");
    } catch {
      toast.error("Failed to update customer");
    }
  };

  // If viewing customer profile
  if (viewingCustomer) {
    const latestCustomer =
      customers.find((c) => c.id === viewingCustomer.id) || viewingCustomer;
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <button
            type="button"
            data-ocid="admin.customer_profile.back.button"
            onClick={() => setViewingCustomer(null)}
            className="p-1.5 rounded-full hover:bg-muted"
          >
            <X size={18} />
          </button>
          <h3 className="font-bold text-foreground">{latestCustomer.name}</h3>
        </div>
        <div className="flex-1 overflow-auto">
          <CustomerProfile
            customer={latestCustomer}
            onClose={() => setViewingCustomer(null)}
            onUpdated={() => {
              // Real-time hook auto-updates
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Search + Add */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            data-ocid="admin.customers.search_input"
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="button"
          data-ocid="admin.add_customer.button"
          onClick={() => setShowAddForm(true)}
          className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center flex-shrink-0"
        >
          <Plus size={18} />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} customers
      </p>

      {filtered.length === 0 ? (
        <div
          data-ocid="admin.customers.empty_state"
          className="text-center py-12"
        >
          <p className="text-muted-foreground">No customers yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((customer, idx) => {
            const customerOrders = allOrders.filter(
              (o) => o.customerId === customer.id,
            );
            const lastOrder = customerOrders.sort(
              (a, b) =>
                new Date(b.orderDate).getTime() -
                new Date(a.orderDate).getTime(),
            )[0];

            return (
              <div
                key={customer.id}
                data-ocid={`admin.customers.item.${idx + 1}`}
                className="bg-card rounded-xl shadow-card p-3"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setViewingCustomer(customer)}
                  data-ocid={`admin.customers.view.button.${idx + 1}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">
                        {customer.name}
                      </p>
                      {customer.phone && (
                        <p className="text-xs text-muted-foreground">
                          {customer.phone}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {customerOrders.length} orders
                        </span>
                        {lastOrder && (
                          <span className="text-[10px] text-muted-foreground">
                            Last: {formatDate(lastOrder.orderDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-muted-foreground mt-1 flex-shrink-0"
                    />
                  </div>
                </button>
                <div className="flex gap-1 mt-2 pt-2 border-t border-border/50">
                  <button
                    type="button"
                    data-ocid={`admin.customers.edit_button.${idx + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCustomer(customer);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-semibold"
                  >
                    <Pencil size={11} />
                    Edit
                  </button>
                  <button
                    type="button"
                    data-ocid={`admin.customers.delete_button.${idx + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(customer.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold"
                  >
                    <Trash2 size={11} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-card rounded-t-2xl p-4 space-y-3 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Add Customer</h3>
              <button
                type="button"
                data-ocid="admin.add_customer.close_button"
                onClick={() => setShowAddForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <input
              data-ocid="admin.add_customer.name.input"
              type="text"
              placeholder="Name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
            />
            <input
              data-ocid="admin.add_customer.phone.input"
              type="tel"
              placeholder="Phone"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
            />
            <input
              data-ocid="admin.add_customer.address.input"
              type="text"
              placeholder="Address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
            />
            <button
              type="button"
              data-ocid="admin.add_customer.save.button"
              onClick={handleAddCustomer}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
            >
              Add Customer
            </button>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-card rounded-t-2xl p-4 space-y-3 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Edit Customer</h3>
              <button
                type="button"
                data-ocid="admin.edit_customer.close_button"
                onClick={() => setEditingCustomer(null)}
              >
                <X size={20} />
              </button>
            </div>
            <input
              data-ocid="admin.edit_customer.name.input"
              type="text"
              placeholder="Name"
              value={editingCustomer.name}
              onChange={(e) =>
                setEditingCustomer((c) =>
                  c ? { ...c, name: e.target.value } : c,
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
            />
            <input
              data-ocid="admin.edit_customer.phone.input"
              type="tel"
              placeholder="Phone"
              value={editingCustomer.phone}
              onChange={(e) =>
                setEditingCustomer((c) =>
                  c ? { ...c, phone: e.target.value } : c,
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
            />
            <input
              data-ocid="admin.edit_customer.address.input"
              type="text"
              placeholder="Address"
              value={editingCustomer.address}
              onChange={(e) =>
                setEditingCustomer((c) =>
                  c ? { ...c, address: e.target.value } : c,
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
            />
            <button
              type="button"
              data-ocid="admin.edit_customer.save.button"
              onClick={handleEditSave}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div
            data-ocid="admin.delete_customer.dialog"
            className="bg-card rounded-2xl p-5 w-full max-w-xs animate-fade-in"
          >
            <h3 className="font-bold text-foreground text-base mb-2">
              Delete Customer?
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              All customer data will be removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                data-ocid="admin.delete_customer.cancel_button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="admin.delete_customer.confirm_button"
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
