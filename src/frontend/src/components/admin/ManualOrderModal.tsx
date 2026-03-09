import { Search, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCustomers } from "../../hooks/useFirestore";
import { addCustomer, addOrder } from "../../lib/firestoreService";
import { uploadToCloudinary } from "../../lib/imageUtils";
import { type Customer, type OrderStatus, generateId } from "../../lib/storage";

interface ManualOrderModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export function ManualOrderModal({ onClose, onSaved }: ManualOrderModalProps) {
  const { data: customers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [mode, setMode] = useState<"search" | "new">("search");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [designName, setDesignName] = useState("");
  const [designCode, setDesignCode] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [status, setStatus] = useState<OrderStatus>("Pending");
  const [totalAmount, setTotalAmount] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(
    null,
  );
  const [referenceImagePreview, setReferenceImagePreview] = useState("");
  const [referenceImageUploading, setReferenceImageUploading] = useState(false);

  const filteredCustomers = searchQuery.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery),
      )
    : customers.slice(0, 5);

  const handleReferenceImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReferenceImageFile(file);
    setReferenceImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeReferenceImage = () => {
    if (referenceImagePreview) URL.revokeObjectURL(referenceImagePreview);
    setReferenceImageFile(null);
    setReferenceImagePreview("");
  };

  const handleSave = async () => {
    if (mode === "search" && !selectedCustomer) {
      toast.error("Select a customer");
      return;
    }
    if (mode === "new" && !newName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!designName.trim()) {
      toast.error("Design name is required");
      return;
    }
    if (!deliveryDate) {
      toast.error("Delivery date is required");
      return;
    }

    setIsSubmitting(true);
    try {
      let customerId: string;
      let customerName: string;
      let customerPhone: string;

      if (mode === "new" || !selectedCustomer) {
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

      // Upload reference image if provided
      let refImageUrl = "";
      if (referenceImageFile) {
        setReferenceImageUploading(true);
        refImageUrl = await uploadToCloudinary(referenceImageFile);
        setReferenceImageUploading(false);
      }

      const code = designCode.trim() || `MAN${Date.now().toString().slice(-4)}`;
      await addOrder({
        id: generateId(),
        customerId,
        customerName,
        customerPhone,
        designs: [
          {
            designId: generateId(),
            designCode: code,
            designTitle: designName.trim(),
            designImage: refImageUrl,
            isManual: true,
            manualDescription: description.trim(),
            referenceImage: refImageUrl || undefined,
          },
        ],
        deliveryDate,
        status,
        totalAmount: Number.parseFloat(totalAmount) || 0,
        advancePaid: Number.parseFloat(advancePaid) || 0,
        orderDate: new Date().toISOString(),
        notes: description.trim(),
      });

      toast.success("Manual order added");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save order");
    } finally {
      setIsSubmitting(false);
      setReferenceImageUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
      <div className="bg-card rounded-t-2xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-foreground">Add Manual Order</h3>
          <button
            type="button"
            data-ocid="manual_order.close_button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Customer selection */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
              CUSTOMER
            </p>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                data-ocid="manual_order.search_tab"
                onClick={() => {
                  setMode("search");
                  setSelectedCustomer(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${mode === "search" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                Search
              </button>
              <button
                type="button"
                data-ocid="manual_order.new_tab"
                onClick={() => {
                  setMode("new");
                  setSelectedCustomer(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${mode === "new" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                New
              </button>
            </div>

            {mode === "search" && (
              <div>
                <div className="relative mb-2">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    data-ocid="manual_order.search.input"
                    type="text"
                    placeholder="Search customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  {filteredCustomers.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      data-ocid="manual_order.customer.card"
                      onClick={() => setSelectedCustomer(c)}
                      className={`w-full text-left p-2.5 rounded-xl border text-sm transition-colors ${
                        selectedCustomer?.id === c.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <p className="font-semibold text-foreground">{c.name}</p>
                      {c.phone && (
                        <p className="text-xs text-muted-foreground">
                          {c.phone}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "new" && (
              <div className="space-y-2">
                <input
                  data-ocid="manual_order.new_name.input"
                  type="text"
                  placeholder="Customer name *"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
                />
                <input
                  data-ocid="manual_order.new_phone.input"
                  type="tel"
                  placeholder="Phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Design details */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
              DESIGN
            </p>
            <input
              data-ocid="manual_order.design_name.input"
              type="text"
              placeholder="Design name *"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none mb-2"
            />
            <input
              data-ocid="manual_order.design_code.input"
              type="text"
              placeholder="Code (optional, auto-generated)"
              value={designCode}
              onChange={(e) => setDesignCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none mb-2"
            />
            <textarea
              data-ocid="manual_order.description.textarea"
              placeholder="Description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none resize-none mb-2"
            />

            {/* Reference Image Upload */}
            <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
              REFERENCE IMAGE (OPTIONAL)
            </p>
            {referenceImagePreview ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden bg-muted">
                <img
                  src={referenceImagePreview}
                  alt="Reference"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={removeReferenceImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label
                data-ocid="manual_order.reference_image.dropzone"
                className="flex flex-col items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Upload size={18} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Tap to attach reference image
                </span>
                <input
                  data-ocid="manual_order.reference_image.upload_button"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReferenceImageSelect}
                />
              </label>
            )}
          </div>

          {/* Order details */}
          <div className="space-y-2">
            <input
              data-ocid="manual_order.delivery_date.input"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
            />
            <select
              data-ocid="manual_order.status.select"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none"
            >
              <option value="Pending">Pending</option>
              <option value="Cutting">Cutting</option>
              <option value="Stitching">Stitching</option>
              <option value="Ready">Ready</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                data-ocid="manual_order.total.input"
                type="number"
                placeholder="Total ₹"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
              />
              <input
                data-ocid="manual_order.advance.input"
                type="number"
                placeholder="Advance ₹"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button
            type="button"
            data-ocid="manual_order.save.button"
            onClick={handleSave}
            disabled={isSubmitting || referenceImageUploading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60"
          >
            {referenceImageUploading
              ? "Uploading image..."
              : isSubmitting
                ? "Saving..."
                : "Add Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
