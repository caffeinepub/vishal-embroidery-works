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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Edit2,
  Loader2,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Measurement } from "../../backend.d";
import {
  useAllMeasurements,
  useCreateMeasurement,
  useDeleteMeasurement,
  useUpdateMeasurement,
} from "../../hooks/useQueries";

interface MeasurementFormData {
  name: string;
  phone: string;
  bust: string;
  waist: string;
  shoulder: string;
  sleeveLength: string;
  neck: string;
  blouseLength: string;
}

const emptyForm: MeasurementFormData = {
  name: "",
  phone: "",
  bust: "",
  waist: "",
  shoulder: "",
  sleeveLength: "",
  neck: "",
  blouseLength: "",
};

function MeasurementForm({
  form,
  onChange,
}: {
  form: MeasurementFormData;
  onChange: (field: keyof MeasurementFormData, value: string) => void;
}) {
  const fields: {
    key: keyof MeasurementFormData;
    label: string;
    kannada: string;
    type?: string;
    required?: boolean;
  }[] = [
    {
      key: "name",
      label: "Customer Name",
      kannada: "ಗ್ರಾಹಕರ ಹೆಸರು",
      required: true,
    },
    {
      key: "phone",
      label: "Phone Number",
      kannada: "ಫೋನ್ ನಂಬರ್",
      type: "tel",
      required: true,
    },
    { key: "bust", label: "Bust", kannada: "ಎದೆ" },
    { key: "waist", label: "Waist", kannada: "ಸೊಂಟ" },
    { key: "shoulder", label: "Shoulder", kannada: "ಭುಜ" },
    { key: "sleeveLength", label: "Sleeve Length", kannada: "ತೋಳಿನ ಉದ್ದ" },
    { key: "neck", label: "Neck", kannada: "ಕುತ್ತಿಗೆ" },
    { key: "blouseLength", label: "Blouse Length", kannada: "ಬ್ಲೌಸ್ ಉದ್ದ" },
  ];

  return (
    <div className="space-y-3">
      {/* Required fields */}
      {fields.slice(0, 2).map((f) => (
        <div key={f.key}>
          <Label className="text-xs mb-1.5 block">
            {f.label} / {f.kannada}
            {f.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            data-ocid={`customer.${f.key}.input`}
            value={form[f.key]}
            onChange={(e) => onChange(f.key, e.target.value)}
            type={f.type}
            placeholder={`Enter ${f.label.toLowerCase()}`}
            className="h-10 text-sm rounded-xl"
          />
        </div>
      ))}

      {/* Measurement fields grid */}
      <p className="text-xs font-semibold text-vew-navy pt-1">
        Measurements / ಅಳತೆಗಳು (inches)
      </p>
      <div className="grid grid-cols-2 gap-3">
        {fields.slice(2).map((f) => (
          <div key={f.key}>
            <Label className="text-[10px] mb-1.5 block">
              {f.label} / {f.kannada}
            </Label>
            <Input
              value={form[f.key]}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder='e.g. 36"'
              className="h-9 text-sm rounded-xl"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomersScreen() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Measurement | null>(
    null,
  );
  const [form, setForm] = useState<MeasurementFormData>(emptyForm);

  const measurementsQuery = useAllMeasurements();
  const createMutation = useCreateMeasurement();
  const updateMutation = useUpdateMeasurement();
  const deleteMutation = useDeleteMeasurement();

  const handleFormChange = (
    field: keyof MeasurementFormData,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleEdit = (m: Measurement) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      phone: m.phone,
      bust: m.bust,
      waist: m.waist,
      shoulder: m.shoulder,
      sleeveLength: m.sleeveLength,
      neck: m.neck,
      blouseLength: m.blouseLength,
    });
    setFormOpen(true);
  };

  const handleView = (m: Measurement) => {
    setSelectedCustomer(m);
    setViewOpen(true);
  };

  const handleDelete = (m: Measurement) => {
    setSelectedCustomer(m);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    try {
      if (editingId !== null) {
        await updateMutation.mutateAsync({ id: editingId, ...form });
        toast.success("Customer updated / ಗ್ರಾಹಕರ ಮಾಹಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Customer added / ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಲಾಗಿದೆ");
      }
      setFormOpen(false);
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await deleteMutation.mutateAsync(selectedCustomer.id);
      toast.success("Customer deleted / ಗ್ರಾಹಕರನ್ನು ತೆಗೆಯಲಾಗಿದೆ");
      setDeleteOpen(false);
    } catch {
      toast.error("Delete failed. Please try again.");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const measurements = measurementsQuery.data ?? [];

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-vew-sky" />
          <div>
            <h2 className="text-sm font-bold text-vew-navy">Customers</h2>
            <p className="text-[10px] text-vew-sky">ಗ್ರಾಹಕರು</p>
          </div>
          <span className="ml-2 bg-vew-sky-light text-vew-sky text-xs font-semibold px-2 py-0.5 rounded-full">
            {measurements.length}
          </span>
        </div>
        <Button
          data-ocid="customer.add_button"
          onClick={handleAdd}
          size="sm"
          className="bg-vew-sky text-white hover:bg-vew-sky-dark rounded-xl h-9 px-3 text-xs gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add New
        </Button>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {measurementsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : measurements.length === 0 ? (
          <div
            data-ocid="customers.empty_state"
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-vew-sky-light flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-vew-sky" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No customers yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ಇನ್ನೂ ಯಾವುದೇ ಗ್ರಾಹಕರಿಲ್ಲ
            </p>
            <Button
              onClick={handleAdd}
              className="mt-4 bg-vew-sky text-white rounded-xl h-10 px-4"
            >
              Add First Customer
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {measurements.map((m, idx) => (
              <div
                key={m.id.toString()}
                data-ocid={`customers.item.${idx + 1}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-3.5 py-3"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-vew-sky-light flex items-center justify-center flex-shrink-0">
                  <span className="text-vew-sky font-bold text-sm">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <button
                  type="button"
                  className="flex-1 text-left min-w-0"
                  onClick={() => handleView(m)}
                >
                  <p className="text-sm font-semibold text-vew-navy truncate">
                    {m.name}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {m.phone}
                  </p>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    data-ocid={`customers.edit_button.${idx + 1}`}
                    onClick={() => handleEdit(m)}
                    className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                  <button
                    type="button"
                    data-ocid={`customers.delete_button.${idx + 1}`}
                    onClick={() => handleDelete(m)}
                    className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent
          data-ocid="customer.form.dialog"
          className="max-w-[95vw] rounded-2xl max-h-[90vh] flex flex-col p-0"
        >
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 flex-shrink-0">
            <DialogTitle className="text-base font-bold text-vew-navy">
              {editingId !== null
                ? "Edit Customer / ಗ್ರಾಹಕರನ್ನು ಸಂಪಾದಿಸಿ"
                : "Add New Customer / ಹೊಸ ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಿ"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <MeasurementForm form={form} onChange={handleFormChange} />
          </div>

          <div className="px-5 py-4 border-t border-border/60 flex gap-3 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              data-ocid="customer.form.cancel_button"
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
              ) : editingId !== null ? (
                "Update / ನವೀಕರಿಸಿ"
              ) : (
                "Add / ಸೇರಿಸಿ"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Measurements Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-[95vw] rounded-2xl p-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60">
            <DialogTitle className="text-base font-bold text-vew-navy flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-vew-sky-light flex items-center justify-center">
                <span className="text-vew-sky font-bold text-sm">
                  {selectedCustomer?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="px-5 pb-5 pt-3">
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                {selectedCustomer.phone}
              </div>

              <p className="text-xs font-semibold text-vew-navy mb-3 uppercase tracking-wider">
                Measurements / ಅಳತೆಗಳು
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    label: "Bust / ಎದೆ",
                    value: selectedCustomer.bust || "—",
                  },
                  {
                    label: "Waist / ಸೊಂಟ",
                    value: selectedCustomer.waist || "—",
                  },
                  {
                    label: "Shoulder / ಭುಜ",
                    value: selectedCustomer.shoulder || "—",
                  },
                  {
                    label: "Sleeve / ತೋಳಿನ ಉದ್ದ",
                    value: selectedCustomer.sleeveLength || "—",
                  },
                  {
                    label: "Neck / ಕುತ್ತಿಗೆ",
                    value: selectedCustomer.neck || "—",
                  },
                  {
                    label: "Blouse Length / ಬ್ಲೌಸ್ ಉದ್ದ",
                    value: selectedCustomer.blouseLength || "—",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-vew-sky-light/40 rounded-xl p-2.5"
                  >
                    <p className="text-[9px] text-muted-foreground mb-0.5 leading-tight">
                      {item.label}
                    </p>
                    <p className="text-sm font-bold text-vew-navy">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewOpen(false);
                    handleEdit(selectedCustomer);
                  }}
                  className="flex-1 rounded-xl border-vew-sky text-vew-sky"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={() => setViewOpen(false)}
                  className="flex-1 rounded-xl bg-vew-sky text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent
          data-ocid="customers.delete.dialog"
          className="max-w-[90vw] rounded-2xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{selectedCustomer?.name}"? This cannot be undone.
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
