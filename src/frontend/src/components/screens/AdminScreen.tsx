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
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  CheckCircle2,
  Clock,
  Delete,
  Edit2,
  Flame,
  Heart,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Customer, Design, Order } from "../../backend.d";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  useAllCustomers,
  useAllDesigns,
  useAllOrders,
  useCreateDesign,
  useCreateDesignBulk,
  useDeleteCustomer,
  useDeleteDesign,
  useGetAnalytics,
  useGetNextDesignCode,
  useSetBridal,
  useSetTrending,
  useUpdateDesign,
} from "../../hooks/useQueries";
import { useAdminSessionStore } from "../../store/adminSessionStore";
import { uploadBatchToCloudinary } from "../../utils/cloudinaryUpload";
import { CloudinaryImageUploader } from "../shared/CloudinaryImageUploader";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All Embroidery Works",
  "All Embroidery",
  "Ready Blouse Embroidery",
  "Simple Blouse",
  "Princess Cut Blouse",
  "Boat Neck Blouse",
  "Collar Blouse",
  "Fashion Blouse",
];

type AdminTab =
  | "analytics"
  | "update_design"
  | "design_upload"
  | "bulk_upload"
  | "customer";

interface DesignFormData {
  category: string;
  workType: string;
  imageUrls: string[];
  isBridal: boolean;
  isTrending: boolean;
}

const emptyDesignForm: DesignFormData = {
  category: "",
  workType: "",
  imageUrls: [],
  isBridal: false,
  isTrending: false,
};

// ─── Auth Status Banner ───────────────────────────────────────────────────────
// Reads from the Zustand store to display token/session health.

function AuthStatusBanner() {
  const { status, session, error } = useAdminSessionStore();

  if (status === "loading" || status === "idle") return null;

  if (status === "error") {
    return (
      <div
        data-ocid="admin.auth.error_state"
        className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
      >
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-semibold text-red-700">
            Authentication Status: Unauthorized
          </p>
          <p className="text-[10px] text-red-600 leading-snug">
            Uploads will fail. Open the app via your Caffeine admin link and
            refresh.
          </p>
          {error && (
            <p className="text-[10px] text-red-500 mt-0.5 font-mono break-all">
              {error.substring(0, 120)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // status === "ready"
  if (session?.isAnonymous) {
    return (
      <div
        data-ocid="admin.auth.success_state"
        className="mx-4 mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
      >
        <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-semibold text-amber-700">
            Authentication Status: Limited
          </p>
          <p className="text-[10px] text-amber-600 leading-snug">
            Photo uploads (Cloudinary) work. ICP design saves may fail — open
            via your Caffeine admin link for full access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid="admin.auth.success_state"
      className="mx-4 mt-3 flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2"
    >
      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[11px] font-semibold text-green-700">
          Authentication Status: Active
        </p>
        <p className="text-[10px] text-green-600 leading-snug">
          Admin session active — all uploads and saves are authorised.
        </p>
      </div>
    </div>
  );
}

// ─── Config Ready Boundary ────────────────────────────────────────────────────
// Wraps Design Upload and Bulk Upload panels so they never render before the
// session is confirmed as ready. Prevents "Cannot read properties of undefined"
// crashes from components that call hooks requiring a configured actor.

function ConfigReadyBoundary({ children }: { children: React.ReactNode }) {
  const { status, error, initSession } = useAdminSessionStore();

  if (status === "idle" || status === "loading") {
    return (
      <div
        data-ocid="admin.session.loading_state"
        className="flex flex-col items-center justify-center gap-4 px-6 py-16"
      >
        <div className="w-12 h-12 rounded-2xl bg-vew-sky-light flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-vew-sky animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-vew-navy">
            Loading Configuration
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            ಕಾನ್ಫಿಗರೇಶನ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ…
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        data-ocid="admin.config.error_state"
        className="flex flex-col items-center justify-center gap-4 px-6 py-16"
      >
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-vew-navy">
            Configuration Unavailable
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
            The backend could not be reached. Cloudinary uploads still work.
            Open the app via your Caffeine admin link and refresh to restore
            full access.
          </p>
          {error && (
            <p className="text-[10px] text-red-500 mt-2 font-mono break-all bg-red-50 rounded-lg p-2">
              {error.substring(0, 160)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs"
          onClick={() => {
            useAdminSessionStore.setState({ status: "idle" });
            initSession();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  // status === "ready" — safe to render children
  return <>{children}</>;
}

// ─── Admin PIN Login ──────────────────────────────────────────────────────────

const PIN_LENGTH = 4;

const KEYPAD: Array<string | null> = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  null,
  "0",
  "⌫",
];

function AdminPinLogin({
  onBack,
  onLoginSuccess,
}: {
  onBack: () => void;
  onLoginSuccess: () => void;
}) {
  const { loginWithPin } = useAdminAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleKey = (key: string) => {
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    setError("");

    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        const ok = loginWithPin(next);
        if (ok) {
          // Pre-warm the session immediately after login
          useAdminSessionStore
            .getState()
            .initSession()
            .catch((e) => console.warn("[AdminPinLogin] pre-warm failed:", e));
          onLoginSuccess();
        } else {
          setShake(true);
          setError("Incorrect PIN. Try again.");
          setTimeout(() => {
            setPin("");
            setShake(false);
          }, 600);
        }
      }, 100);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 select-none">
      <div className="w-16 h-16 rounded-2xl bg-vew-sky-light flex items-center justify-center mb-5 shadow-sm">
        <Lock className="w-8 h-8 text-vew-sky" />
      </div>
      <h2 className="text-xl font-bold text-vew-navy mb-1">Admin Access</h2>
      <p className="text-xs text-muted-foreground mb-7 text-center">
        Enter the 4-digit PIN to continue · ಪಿನ್ ನಮೂದಿಸಿ
      </p>

      <div
        className={`flex gap-4 mb-3 transition-transform duration-150 ${shake ? "translate-x-2" : ""}`}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              i < pin.length
                ? "bg-vew-sky border-vew-sky scale-110"
                : "bg-transparent border-vew-sky/40"
            }`}
          />
        ))}
      </div>

      {error ? (
        <p
          data-ocid="admin.pin.error_state"
          className="text-xs text-destructive text-center mb-3 bg-destructive/5 rounded-lg py-1.5 px-3"
        >
          {error}
        </p>
      ) : (
        <div className="mb-3 h-7" />
      )}

      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {KEYPAD.map((key, idx) => {
          if (key === null) {
            // biome-ignore lint/suspicious/noArrayIndexKey: positional layout
            return <div key={idx} />;
          }
          const isDelete = key === "⌫";
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: positional layout
              key={idx}
              type="button"
              data-ocid={
                isDelete ? "admin.pin.delete_button" : `admin.pin.key.${key}`
              }
              onClick={() => handleKey(key)}
              className={`h-14 rounded-2xl text-lg font-bold transition-all duration-100 active:scale-95 ${
                isDelete
                  ? "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-500"
                  : "bg-vew-sky-light text-vew-navy hover:bg-vew-sky hover:text-white shadow-sm"
              }`}
            >
              {isDelete ? <Delete className="w-5 h-5 mx-auto" /> : key}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-8 text-sm text-muted-foreground hover:text-vew-sky transition-colors flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
    </div>
  );
}

// ─── Admin Session Loading Gate ───────────────────────────────────────────────
// Shown after successful PIN login while the global session is still initialising.

function AdminSessionLoadingGate() {
  return (
    <div
      data-ocid="admin.session.loading_state"
      className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12"
    >
      <div className="w-14 h-14 rounded-2xl bg-vew-sky-light flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-vew-sky animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-vew-navy">
          Initialising Admin Panel
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Loading configuration… · ಕಾನ್ಫಿಗರೇಶನ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ…
        </p>
      </div>
    </div>
  );
}

// ─── Design Form Panel ────────────────────────────────────────────────────────

function DesignFormPanel({
  editingDesign,
  onSave,
  onCancel,
  isPending,
}: {
  editingDesign: Design | null;
  onSave: (form: DesignFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<DesignFormData>(
    editingDesign
      ? {
          category: editingDesign.category,
          workType: editingDesign.workType,
          imageUrls: editingDesign.imageUrls ?? [],
          isBridal: editingDesign.isBridal,
          isTrending: editingDesign.isTrending,
        }
      : emptyDesignForm,
  );

  const nextCodeQuery = useGetNextDesignCode(
    editingDesign ? "" : form.category,
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border/60 flex items-center gap-2 flex-shrink-0">
        <button type="button" onClick={onCancel} className="p-1">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h3 className="text-sm font-bold text-vew-navy">
          {editingDesign ? "Edit Design / ಡಿಸೈನ್ ಸಂಪಾದಿಸಿ" : "Add Design / ಡಿಸೈನ್ ಸೇರಿಸಿ"}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <CloudinaryImageUploader
          value={form.imageUrls}
          onChange={(urls) => setForm((prev) => ({ ...prev, imageUrls: urls }))}
          maxImages={10}
          disabled={isPending}
        />

        <div>
          <Label className="text-xs mb-1.5 block">Category / ವರ್ಗ *</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
          >
            <SelectTrigger
              data-ocid="admin.add_design.category.select"
              className="h-10 rounded-xl text-sm"
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {editingDesign ? (
          <div>
            <Label className="text-xs mb-1.5 block">Design Code / ಡಿಸೈನ್ ಕೋಡ್</Label>
            <div className="h-10 rounded-xl border border-border/60 bg-muted/30 flex items-center px-3 text-sm text-muted-foreground font-mono">
              {editingDesign.designCode}
            </div>
          </div>
        ) : (
          <div
            data-ocid="admin.add_design.code_preview.panel"
            className="bg-vew-sky-light/40 rounded-xl px-4 py-3"
          >
            {!form.category ? (
              <p className="text-[11px] text-muted-foreground">
                Select a category to see the auto-generated code
              </p>
            ) : nextCodeQuery.isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-vew-sky animate-spin" />
                <p className="text-[11px] text-vew-sky">Generating code...</p>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-vew-sky font-semibold">
                  Auto-generated code:{" "}
                  <span className="font-mono font-bold">
                    {nextCodeQuery.data ?? "—"}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ಸ್ವಯಂ ಕೋಡ್ ನಿಯೋಜಿಸಲಾಗುವುದು
                </p>
              </>
            )}
          </div>
        )}

        <div>
          <Label className="text-xs mb-1.5 block">Work Type / ಕೆಲಸದ ವಿಧ</Label>
          <Input
            data-ocid="admin.add_design.worktype.input"
            value={form.workType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, workType: e.target.value }))
            }
            placeholder="e.g. Zari Work, Thread Work"
            className="h-10 text-sm rounded-xl"
          />
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between bg-vew-sky-light/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-vew-navy">Trending</p>
                <p className="text-[10px] text-muted-foreground">ಟ್ರೆಂಡಿಂಗ್</p>
              </div>
            </div>
            <Switch
              data-ocid="admin.add_design.trending.switch"
              checked={form.isTrending}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, isTrending: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between bg-pink-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              <div>
                <p className="text-sm font-medium text-vew-navy">Bridal</p>
                <p className="text-[10px] text-muted-foreground">ಮದುವೆ ಡಿಸೈನ್</p>
              </div>
            </div>
            <Switch
              data-ocid="admin.add_design.bridal.switch"
              checked={form.isBridal}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, isBridal: v }))
              }
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-border/60 flex gap-3 flex-shrink-0">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          data-ocid="admin.add_design.submit_button"
          onClick={() => onSave(form)}
          disabled={isPending}
          className="flex-1 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : editingDesign ? (
            "Update"
          ) : (
            "Add Design"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Single Design Upload Panel ───────────────────────────────────────────────
// ALWAYS rendered inside <ConfigReadyBoundary> — never mounts before config is ready.

function SingleDesignUploadPanel() {
  const [form, setForm] = useState<DesignFormData>(emptyDesignForm);
  const createDesign = useCreateDesign();
  const nextCodeQuery = useGetNextDesignCode(form.category);

  const handleSave = async () => {
    if (!form.category) {
      toast.error("Category is required");
      return;
    }
    if (form.imageUrls.length === 0) {
      toast.error("Please upload at least one photo / ಕನಿಷ್ಠ ಒಂದು ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ");
      return;
    }
    try {
      const assignedCode = await createDesign.mutateAsync({
        category: form.category,
        workType: form.workType,
        imageUrls: form.imageUrls,
        isBridal: form.isBridal,
        isTrending: form.isTrending,
      });
      toast.success(`Design added: ${assignedCode} / ಡಿಸೈನ್ ಸೇರಿಸಲಾಗಿದೆ`);
      setForm(emptyDesignForm);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to save design: ${reason}`);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <CloudinaryImageUploader
        value={form.imageUrls}
        onChange={(urls) => setForm((prev) => ({ ...prev, imageUrls: urls }))}
        maxImages={10}
        disabled={createDesign.isPending}
      />

      <div>
        <Label className="text-xs mb-1.5 block">Category / ವರ್ಗ *</Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
        >
          <SelectTrigger
            data-ocid="admin.design_upload.category.select"
            className="h-10 rounded-xl text-sm"
          >
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        data-ocid="admin.design_upload.code_preview.panel"
        className="bg-vew-sky-light/40 rounded-xl px-4 py-3"
      >
        {!form.category ? (
          <p className="text-[11px] text-muted-foreground">
            Select a category to see the auto-generated code
          </p>
        ) : nextCodeQuery.isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-vew-sky animate-spin" />
            <p className="text-[11px] text-vew-sky">Generating code...</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-vew-sky font-semibold">
              Auto-generated code:{" "}
              <span className="font-mono font-bold">
                {nextCodeQuery.data ?? "—"}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ಸ್ವಯಂ ಕೋಡ್ ನಿಯೋಜಿಸಲಾಗುವುದು
            </p>
          </>
        )}
      </div>

      <div>
        <Label className="text-xs mb-1.5 block">Work Type / ಕೆಲಸದ ವಿಧ</Label>
        <Input
          data-ocid="admin.design_upload.worktype.input"
          value={form.workType}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, workType: e.target.value }))
          }
          placeholder="e.g. Zari Work, Thread Work"
          className="h-10 text-sm rounded-xl"
        />
      </div>

      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between bg-vew-sky-light/40 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-vew-navy">Trending</p>
              <p className="text-[10px] text-muted-foreground">ಟ್ರೆಂಡಿಂಗ್</p>
            </div>
          </div>
          <Switch
            data-ocid="admin.design_upload.trending.switch"
            checked={form.isTrending}
            onCheckedChange={(v) =>
              setForm((prev) => ({ ...prev, isTrending: v }))
            }
          />
        </div>

        <div className="flex items-center justify-between bg-pink-50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            <div>
              <p className="text-sm font-medium text-vew-navy">Bridal</p>
              <p className="text-[10px] text-muted-foreground">ಮದುವೆ ಡಿಸೈನ್</p>
            </div>
          </div>
          <Switch
            data-ocid="admin.design_upload.bridal.switch"
            checked={form.isBridal}
            onCheckedChange={(v) =>
              setForm((prev) => ({ ...prev, isBridal: v }))
            }
          />
        </div>
      </div>

      <Button
        data-ocid="admin.design_upload.submit_button"
        onClick={handleSave}
        disabled={createDesign.isPending}
        className="w-full h-11 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark font-semibold"
      >
        {createDesign.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </span>
        ) : (
          "Add Design / ಡಿಸೈನ್ ಸೇರಿಸಿ"
        )}
      </Button>
    </div>
  );
}

// ─── Bulk Upload Panel ────────────────────────────────────────────────────────
// ALWAYS rendered inside <ConfigReadyBoundary> — never mounts before config is ready.

function BulkUploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [bulkCategory, setBulkCategory] = useState("All Embroidery Works");
  const [uploadingProgress, setUploadingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const createDesignBulk = useCreateDesignBulk();
  const isBusy = createDesignBulk.isPending || uploadingProgress !== null;

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).slice(0, 500);
    setSelectedFiles(arr);
    setIsDone(false);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveAll = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one photo / ಕನಿಷ್ಠ ಒಂದು ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಿ");
      return;
    }

    setErrorMsg("");
    setIsDone(false);
    setUploadingProgress({ current: 0, total: selectedFiles.length });

    const { successes, failures } = await uploadBatchToCloudinary(
      selectedFiles,
      (fileIdx) => {
        setUploadingProgress({
          current: fileIdx + 1,
          total: selectedFiles.length,
        });
      },
    );

    setUploadingProgress(null);

    if (successes.length === 0) {
      setErrorMsg(
        `All ${failures.length} uploads failed. ${failures.map((f) => f.error).join(" | ")}`,
      );
      return;
    }

    const entries = successes.map((s) => ({
      imageUrl: s.secureUrl,
      category: bulkCategory,
    }));

    try {
      const result = await createDesignBulk.mutateAsync(entries);
      const sc = result.savedCount;
      const fc = result.failedCount + failures.length;
      const parts: string[] = [];
      if (sc > 0) parts.push(`${sc} design${sc !== 1 ? "s" : ""} saved`);
      if (fc > 0) parts.push(`${fc} failed`);
      toast.success(`${parts.join(", ")}.`);
      setSavedCount(sc);
      setIsDone(true);
      if (
        failures.length > 0 ||
        (result.failedCount > 0 && result.errors.length > 0)
      ) {
        const reasons = [...failures.map((f) => f.error), ...result.errors];
        setErrorMsg(
          `${fc} design${fc !== 1 ? "s" : ""} could not be saved. Reasons: ${reasons.join(" | ")}`,
        );
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to save designs: ${errMsg}`);
    }
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setIsDone(false);
    setSavedCount(0);
    setErrorMsg("");
    setUploadingProgress(null);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="bg-vew-sky-light/30 rounded-xl p-3">
        <p className="text-[10px] text-muted-foreground leading-snug">
          Select up to 500 photos from your gallery. Each photo will be uploaded
          to Cloudinary and a design entry created automatically.
          <br />
          ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಿ — ಡಿಸೈನ್ ಕೋಡ್ ಸ್ವಯಂ ನಿಯೋಜಿಸಲಾಗುವುದು.
        </p>
      </div>

      <div>
        <Label className="text-xs mb-1.5 block">
          Category for all designs / ಎಲ್ಲ ಡಿಸೈನ್‌ಗಳಿಗೆ ವರ್ಗ
        </Label>
        <Select
          value={bulkCategory}
          onValueChange={setBulkCategory}
          disabled={isBusy}
        >
          <SelectTrigger
            data-ocid="admin.bulk_upload.category.select"
            className="h-10 rounded-xl text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
        aria-hidden="true"
        tabIndex={-1}
      />

      <button
        type="button"
        data-ocid="admin.bulk_upload.upload_button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isBusy}
        className="w-full min-h-[60px] rounded-2xl border-2 border-dashed border-vew-sky/40 bg-vew-sky-light/20 hover:bg-vew-sky-light/40 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-3 px-4 py-4 select-none touch-manipulation disabled:opacity-50"
      >
        <div className="w-10 h-10 rounded-xl bg-vew-sky/10 flex items-center justify-center flex-shrink-0">
          <Plus className="w-5 h-5 text-vew-sky" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-vew-sky">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} photo${selectedFiles.length !== 1 ? "s" : ""} selected — tap to change`
              : "Select Photos / ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಿ"}
          </p>
          <p className="text-[10px] text-vew-sky/70">
            PNG, JPG, JPEG · max 10 MB each · up to 500 photos
          </p>
        </div>
      </button>

      {uploadingProgress && (
        <div
          data-ocid="admin.bulk_upload.loading_state"
          className="bg-vew-sky-light/40 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <Loader2 className="w-4 h-4 text-vew-sky animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-vew-navy">
              Uploading images: {uploadingProgress.current} /{" "}
              {uploadingProgress.total}
            </p>
            <div className="mt-1.5 h-1.5 bg-vew-sky/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-vew-sky rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((uploadingProgress.current / uploadingProgress.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {isDone && (
        <div
          data-ocid="admin.bulk_upload.success_state"
          className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-700">
              Upload complete!
            </p>
            <p className="text-[10px] text-green-600">
              {savedCount} design{savedCount !== 1 ? "s" : ""} added
              successfully
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          data-ocid="admin.bulk_upload.error_state"
          className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3"
        >
          <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-snug">{errorMsg}</p>
        </div>
      )}

      <div className="flex gap-2">
        {isDone ? (
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex-1 rounded-xl border-vew-sky text-vew-sky"
          >
            Upload More Photos / ಇನ್ನಷ್ಟು ಅಪ್ಲೋಡ್ ಮಾಡಿ
          </Button>
        ) : (
          <>
            {selectedFiles.length > 0 && !isBusy && (
              <Button
                variant="outline"
                onClick={handleClear}
                className="rounded-xl"
              >
                Clear
              </Button>
            )}
            <Button
              data-ocid="admin.bulk_upload.primary_button"
              onClick={handleSaveAll}
              disabled={isBusy || selectedFiles.length === 0}
              className="flex-1 h-12 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark font-semibold gap-2"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadingProgress
                    ? `Uploading ${uploadingProgress.current}/${uploadingProgress.total}...`
                    : "Saving designs..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save All Designs ({selectedFiles.length})
                </>
              )}
            </Button>
          </>
        )}
      </div>

      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/60">
        <p className="text-[10px] text-amber-700 leading-relaxed">
          <strong>Auto settings per photo:</strong>
          <br />
          Category: {bulkCategory} · Work Type: auto-assigned
          <br />
          Trending: Off · Bridal: Off
          <br />
          Design Code: auto-generated (e.g. VEW-AE-001, VEW-AE-002...)
        </p>
      </div>
    </div>
  );
}

// ─── Analytics Dashboard ──────────────────────────────────────────────────────

function AnalyticsDashboard() {
  const analyticsQuery = useGetAnalytics();
  const data = analyticsQuery.data;

  const statCards = [
    {
      label: "Total Designs",
      kannada: "ಒಟ್ಟು ಡಿಸೈನ್‌ಗಳು",
      value: data ? Number(data.totalDesigns) : null,
      icon: <Sparkles className="w-5 h-5 text-blue-500" />,
      bg: "bg-blue-50",
      border: "border-blue-100",
      valueColor: "text-blue-700",
    },
    {
      label: "Total Customers",
      kannada: "ಒಟ್ಟು ಗ್ರಾಹಕರು",
      value: data ? Number(data.totalCustomers) : null,
      icon: <Users className="w-5 h-5 text-green-500" />,
      bg: "bg-green-50",
      border: "border-green-100",
      valueColor: "text-green-700",
    },
    {
      label: "Pending Orders",
      kannada: "ಬಾಕಿ ಆದೇಶಗಳು",
      value: data ? Number(data.pendingOrders) : null,
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
      bg: "bg-yellow-50",
      border: "border-yellow-100",
      valueColor: "text-yellow-700",
    },
    {
      label: "Completed Orders",
      kannada: "ಪೂರ್ಣಗೊಂಡ ಆದೇಶಗಳು",
      value: data ? Number(data.completedOrders) : null,
      icon: <CheckCircle className="w-5 h-5 text-purple-500" />,
      bg: "bg-purple-50",
      border: "border-purple-100",
      valueColor: "text-purple-700",
    },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-vew-sky" />
        <div>
          <h3 className="text-sm font-bold text-vew-navy">
            Analytics Dashboard
          </h3>
          <p className="text-[10px] text-vew-sky">ವಿಶ್ಲೇಷಣೆ</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} ${card.border} border rounded-2xl p-4 flex flex-col gap-2`}
          >
            <div className="flex items-center justify-between">
              {card.icon}
              <TrendingUp className="w-3 h-3 text-muted-foreground/40" />
            </div>
            {analyticsQuery.isLoading ? (
              <div className="h-7 w-12 bg-current/10 rounded-lg animate-pulse" />
            ) : (
              <p className={`text-2xl font-extrabold ${card.valueColor}`}>
                {card.value ?? "—"}
              </p>
            )}
            <div>
              <p className="text-xs font-semibold text-foreground/80">
                {card.label}
              </p>
              <p className="text-[9px] text-muted-foreground leading-tight">
                {card.kannada}
              </p>
            </div>
          </div>
        ))}
      </div>

      {analyticsQuery.isError && (
        <div
          data-ocid="admin.analytics.error_state"
          className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700">
            Failed to load analytics. Try again later.
          </p>
        </div>
      )}

      {data && Number(data.inProgressOrders) > 0 && (
        <div className="bg-vew-sky-light/40 border border-vew-sky/20 rounded-xl p-3 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-vew-sky animate-spin flex-shrink-0" />
          <p className="text-xs text-vew-sky font-medium">
            {Number(data.inProgressOrders)} order
            {Number(data.inProgressOrders) !== 1 ? "s" : ""} currently in
            stitching
            <span className="block text-[9px] text-vew-sky/70">ಹೊಲಿಗೆ ಹಂತದಲ್ಲಿ</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Delivery Reminders Section ───────────────────────────────────────────────

function DeliveryRemindersSection() {
  const ordersQuery = useAllOrders();
  const customersQuery = useAllCustomers();
  const orders = ordersQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  const upcomingOrders = orders.filter((o: Order) => {
    if (!o.deliveryDate || o.status === "delivered") return false;
    try {
      const d = new Date(o.deliveryDate);
      d.setHours(0, 0, 0, 0);
      return d <= sevenDaysLater;
    } catch {
      return false;
    }
  });

  upcomingOrders.sort((a: Order, b: Order) => {
    try {
      return (
        new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
      );
    } catch {
      return 0;
    }
  });

  const getCustomerName = (customerId: bigint) => {
    const c = customers.find(
      (cu: Customer) => cu.id.toString() === customerId.toString(),
    );
    return c?.name ?? "Unknown";
  };

  const isOverdue = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return d < today;
    } catch {
      return false;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-amber-500" />
        <div>
          <p className="text-xs font-bold text-vew-navy">Delivery Reminders</p>
          <p className="text-[9px] text-amber-600">ಡೆಲಿವರಿ ನೆನಪು</p>
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : upcomingOrders.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-xs text-green-700">
            No upcoming deliveries / ಯಾವುದೇ ಡೆಲಿವರಿ ಇಲ್ಲ
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingOrders.map((order: Order, idx: number) => {
            const overdue = isOverdue(order.deliveryDate);
            return (
              <div
                key={order.id.toString()}
                data-ocid={`admin.delivery.item.${idx + 1}`}
                className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 ${
                  overdue
                    ? "bg-red-50 border-red-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    overdue ? "bg-red-100" : "bg-amber-100"
                  }`}
                >
                  <Clock
                    className={`w-4 h-4 ${overdue ? "text-red-500" : "text-amber-500"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${overdue ? "text-red-800" : "text-amber-800"}`}
                  >
                    {getCustomerName(order.customerId)}
                  </p>
                  <p
                    className={`text-[10px] truncate ${overdue ? "text-red-600" : "text-amber-600"}`}
                  >
                    {order.workType}
                    {order.designCode ? ` · ${order.designCode}` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-[10px] font-semibold ${overdue ? "text-red-700" : "text-amber-700"}`}
                  >
                    {overdue ? "⚠ Overdue" : formatDate(order.deliveryDate)}
                  </p>
                  {overdue && (
                    <p className="text-[9px] text-red-500">
                      {formatDate(order.deliveryDate)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Admin Screen (main export) ───────────────────────────────────────────────

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const { isLoggedIn, logout } = useAdminAuth();
  const [loggedInLocal, setLoggedInLocal] = useState(isLoggedIn);

  const {
    status: sessionStatus,
    error: sessionError,
    initSession,
    clearSession,
  } = useAdminSessionStore();

  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");
  const [showForm, setShowForm] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [deleteDesignTarget, setDeleteDesignTarget] = useState<Design | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Kick off session init as soon as the user logs in.
  // initSession() is idempotent — safe to call multiple times.
  useEffect(() => {
    if (loggedInLocal) {
      initSession().catch((e) =>
        console.error("[AdminScreen] initSession failed:", e),
      );
    }
  }, [loggedInLocal, initSession]);

  const allDesignsQuery = useAllDesigns();
  const customersQuery = useAllCustomers();
  const createDesign = useCreateDesign();
  const updateDesign = useUpdateDesign();
  const deleteDesign = useDeleteDesign();
  const setTrending = useSetTrending();
  const setBridal = useSetBridal();
  const deleteCustomerMutation = useDeleteCustomer();

  const designs = allDesignsQuery.data ?? [];
  const filteredDesigns = designs.filter(
    (d) =>
      d.designCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Not logged in → PIN screen ──────────────────────────────────────────────
  if (!loggedInLocal) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminPinLogin
          onBack={onBack}
          onLoginSuccess={() => setLoggedInLocal(true)}
        />
      </div>
    );
  }

  // ── Logged in but session still initialising → loading gate ────────────────
  // CRITICAL: Nothing that reads `config` (useCreateDesign, CloudinaryImageUploader,
  // etc.) can render until sessionStatus === "ready". The loading gate here prevents
  // the "Cannot read properties of undefined (reading 'config')" crash.
  if (sessionStatus === "idle" || sessionStatus === "loading") {
    return (
      <div className="flex-1 flex flex-col">
        <AdminSessionLoadingGate />
      </div>
    );
  }

  // ── Session init failed → clear error with back-to-login ───────────────────
  if (sessionStatus === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-vew-navy">
            Admin Panel Unavailable
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            The app configuration could not be loaded. Please open the app via
            your Caffeine admin link and refresh the page.
          </p>
          {sessionError && (
            <p className="text-[10px] text-red-500 mt-2 font-mono break-all bg-red-50 rounded-lg p-2">
              {sessionError.substring(0, 200)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          className="rounded-xl text-xs"
          onClick={() => {
            clearSession();
            setLoggedInLocal(false);
          }}
        >
          Back to Login
        </Button>
      </div>
    );
  }

  // ── Session ready — render full dashboard ──────────────────────────────────

  const handleSaveDesign = async (form: DesignFormData) => {
    if (!form.category) {
      toast.error("Category is required");
      return;
    }
    if (!editingDesign && form.imageUrls.length === 0) {
      toast.error(
        "Please upload at least one design image / ಕನಿಷ್ಠ ಒಂದು ಚಿತ್ರ ಅಪ್ಲೋಡ್ ಮಾಡಿ",
      );
      return;
    }
    try {
      if (editingDesign) {
        await updateDesign.mutateAsync({
          id: editingDesign.id,
          designCode: editingDesign.designCode,
          category: form.category,
          workType: form.workType,
          imageUrls: form.imageUrls,
        });
        await Promise.all([
          setTrending.mutateAsync({
            id: editingDesign.id,
            flag: form.isTrending,
          }),
          setBridal.mutateAsync({ id: editingDesign.id, flag: form.isBridal }),
        ]);
        toast.success("Design updated / ಡಿಸೈನ್ ನವೀಕರಿಸಲಾಗಿದೆ");
      } else {
        const assignedCode = await createDesign.mutateAsync({
          category: form.category,
          workType: form.workType,
          imageUrls: form.imageUrls,
          isBridal: form.isBridal,
          isTrending: form.isTrending,
        });
        toast.success(`Design added: ${assignedCode} / ಡಿಸೈನ್ ಸೇರಿಸಲಾಗಿದೆ`);
        setActiveTab("update_design");
      }
      setShowForm(false);
      setEditingDesign(null);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to save design: ${reason}`);
    }
  };

  const handleDeleteDesign = async () => {
    if (!deleteDesignTarget) return;
    try {
      await deleteDesign.mutateAsync(deleteDesignTarget.id);
      toast.success("Design deleted / ಡಿಸೈನ್ ತೆಗೆಯಲಾಗಿದೆ");
      setDeleteDesignTarget(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleTrending = async (design: Design) => {
    try {
      await setTrending.mutateAsync({
        id: design.id,
        flag: !design.isTrending,
      });
      toast.success(
        design.isTrending ? "Removed from trending" : "Marked as trending",
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleToggleBridal = async (design: Design) => {
    try {
      await setBridal.mutateAsync({ id: design.id, flag: !design.isBridal });
      toast.success(
        design.isBridal ? "Removed bridal tag" : "Marked as bridal",
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  if (showForm) {
    return (
      <div className="flex-1 flex flex-col">
        <DesignFormPanel
          editingDesign={editingDesign}
          onSave={handleSaveDesign}
          onCancel={() => {
            setShowForm(false);
            setEditingDesign(null);
          }}
          isPending={
            createDesign.isPending ||
            updateDesign.isPending ||
            setTrending.isPending ||
            setBridal.isPending
          }
        />
      </div>
    );
  }

  const ADMIN_TABS: Array<{ id: AdminTab; label: string; kannada: string }> = [
    { id: "analytics", label: "Analytics", kannada: "ವಿಶ್ಲೇಷಣೆ" },
    { id: "update_design", label: "Update Design", kannada: "ಡಿಸೈನ್ ಅಪ್ಡೇಟ್" },
    { id: "design_upload", label: "Design Upload", kannada: "ಡಿಸೈನ್ ಅಪ್ಲೋಡ್" },
    { id: "bulk_upload", label: "Bulk Upload", kannada: "ಬಲ್ಕ್ ಅಪ್ಲೋಡ್" },
    { id: "customer", label: "Customer", kannada: "ಗ್ರಾಹಕ" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border/60 flex-shrink-0">
        <button type="button" onClick={onBack} className="p-1">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <Shield className="w-4 h-4 text-vew-sky" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-vew-navy">Admin Panel</h2>
          <p className="text-[10px] text-vew-sky/70">ಅಡ್ಮಿನ್ ಪ್ಯಾನೆಲ್</p>
        </div>
        <button
          type="button"
          data-ocid="admin.logout.button"
          onClick={() => {
            logout();
            clearSession();
            setLoggedInLocal(false);
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border/60 flex-shrink-0 overflow-x-auto">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-ocid={`admin.${tab.id}.tab`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 px-2 py-2.5 text-center transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "text-vew-sky border-b-2 border-vew-sky"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="text-[10px] font-semibold leading-tight">
              {tab.label}
            </div>
            <div className="text-[8px] opacity-60 leading-tight mt-0.5">
              {tab.kannada}
            </div>
          </button>
        ))}
      </div>

      {/* Auth Status Banner */}
      <AuthStatusBanner />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "analytics" && <AnalyticsDashboard />}

        {activeTab === "update_design" && (
          <div>
            <div className="px-4 pt-3 pb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-ocid="admin.update_design.search_input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search designs..."
                  className="pl-9 h-9 rounded-xl text-sm"
                />
              </div>
              <Button
                data-ocid="admin.update_design.primary_button"
                onClick={() => {
                  setEditingDesign(null);
                  setShowForm(true);
                }}
                size="sm"
                className="h-9 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark px-3 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {allDesignsQuery.isLoading ? (
              <div className="px-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="px-4 pb-6 space-y-2">
                {filteredDesigns.map((design, idx) => (
                  <div
                    key={design.id.toString()}
                    data-ocid={`admin.update_design.item.${idx + 1}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-3 py-2.5"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-vew-sky-light/40 flex-shrink-0 relative">
                      {design.imageUrls?.[0] ? (
                        <img
                          src={design.imageUrls[0]}
                          alt={design.designCode}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            No img
                          </span>
                        </div>
                      )}
                      {(design.imageUrls?.length ?? 0) > 1 && (
                        <div className="absolute bottom-0 right-0 bg-vew-sky text-white text-[8px] font-bold px-1 rounded-tl-md">
                          {design.imageUrls.length}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-vew-navy truncate">
                        {design.designCode}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {design.category}
                      </p>
                      <div className="flex gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTrending(design)}
                          className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full transition-colors ${
                            design.isTrending
                              ? "bg-orange-100 text-orange-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Flame className="w-2.5 h-2.5" />
                          {design.isTrending ? "Trending" : "Not Trending"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleBridal(design)}
                          className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full transition-colors ${
                            design.isBridal
                              ? "bg-pink-100 text-pink-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Heart className="w-2.5 h-2.5" />
                          {design.isBridal ? "Bridal" : "Not Bridal"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        data-ocid={`admin.update_design.edit_button.${idx + 1}`}
                        onClick={() => {
                          setEditingDesign(design);
                          setShowForm(true);
                        }}
                        className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                      </button>
                      <button
                        type="button"
                        data-ocid={`admin.update_design.delete_button.${idx + 1}`}
                        onClick={() => setDeleteDesignTarget(design)}
                        className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredDesigns.length === 0 && (
                  <div
                    data-ocid="admin.update_design.empty_state"
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No designs found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Design Upload — wrapped in ConfigReadyBoundary */}
        {activeTab === "design_upload" && (
          <ConfigReadyBoundary>
            <SingleDesignUploadPanel />
          </ConfigReadyBoundary>
        )}

        {/* Bulk Upload — wrapped in ConfigReadyBoundary */}
        {activeTab === "bulk_upload" && (
          <ConfigReadyBoundary>
            <BulkUploadPanel />
          </ConfigReadyBoundary>
        )}

        {activeTab === "customer" && (
          <div>
            <DeliveryRemindersSection />

            <div className="px-4 pt-1 pb-2 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                {(customersQuery.data ?? []).length} customer
                {(customersQuery.data ?? []).length !== 1 ? "s" : ""} registered
              </p>
            </div>

            {customersQuery.isLoading ? (
              <div className="px-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="px-4 pb-6 space-y-2">
                {(customersQuery.data ?? []).map((c: Customer, idx) => (
                  <div
                    key={c.id.toString()}
                    data-ocid={`admin.customer.item.${idx + 1}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-3.5 py-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-vew-sky-light flex items-center justify-center flex-shrink-0">
                      <span className="text-vew-sky font-bold text-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-vew-navy truncate">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.phone}
                      </p>
                      {c.address && (
                        <p className="text-[10px] text-muted-foreground/70 truncate">
                          {c.address}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right mr-1">
                      <p className="text-[9px] text-muted-foreground">Added</p>
                      <p className="text-[9px] text-vew-navy font-medium">
                        {new Date(
                          Number(c.createdAt) / 1_000_000,
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid={`admin.customer.delete_button.${idx + 1}`}
                      onClick={async () => {
                        try {
                          await deleteCustomerMutation.mutateAsync(c.id);
                          toast.success("Customer deleted");
                        } catch {
                          toast.error("Failed to delete");
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}

                {(customersQuery.data ?? []).length === 0 && (
                  <div
                    data-ocid="admin.customer.empty_state"
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No customers yet
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Customers added via the Customers screen will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Design Confirmation Dialog */}
      <AlertDialog
        open={!!deleteDesignTarget}
        onOpenChange={(o) => !o && setDeleteDesignTarget(null)}
      >
        <AlertDialogContent
          data-ocid="admin.delete_design.dialog"
          className="max-w-[90vw] rounded-2xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Design?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteDesignTarget?.designCode}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.delete_design.cancel_button"
              className="rounded-xl"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.delete_design.confirm_button"
              onClick={handleDeleteDesign}
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
