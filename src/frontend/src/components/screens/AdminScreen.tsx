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
import { Progress } from "@/components/ui/progress";
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
  ArrowLeft,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  Flame,
  Heart,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Search,
  Shield,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Design, Measurement } from "../../backend.d";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  useAllDesigns,
  useAllMeasurements,
  useCreateDesign,
  useCreateDesignBulk,
  useDeleteDesign,
  useDeleteMeasurement,
  useSetBridal,
  useSetTrending,
  useUpdateDesign,
} from "../../hooks/useQueries";
import { useUploadImage } from "../../hooks/useUploadImage";

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

type AdminTab = "designs" | "add" | "bulk" | "customers";

interface DesignFormData {
  designCode: string;
  category: string;
  workType: string;
  imageUrls: string[];
  isBridal: boolean;
  isTrending: boolean;
}

const emptyDesignForm: DesignFormData = {
  designCode: "",
  category: "",
  workType: "",
  imageUrls: [],
  isBridal: false,
  isTrending: false,
};

// ─── Admin Login ──────────────────────────────────────────────────────────────

function AdminLogin({
  onBack,
  onLoginSuccess,
}: {
  onBack: () => void;
  onLoginSuccess: () => void;
}) {
  const { login } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    setIsLoading(true);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 400));
    const success = login(username, password);
    setIsLoading(false);
    if (success) {
      onLoginSuccess();
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-16 h-16 rounded-2xl bg-vew-sky-light flex items-center justify-center mb-5 shadow-sm">
        <Shield className="w-8 h-8 text-vew-sky" />
      </div>

      <h2 className="text-xl font-bold text-vew-navy mb-1">Admin Login</h2>
      <p className="text-xs text-muted-foreground mb-6 text-center">
        ಅಡ್ಮಿನ್ ಲಾಗಿನ್ · Enter your credentials to access the admin panel
      </p>

      <form
        onSubmit={handleLogin}
        className="w-full max-w-[320px] space-y-3"
        noValidate
      >
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            data-ocid="admin.login.username.input"
            type="text"
            placeholder="Username / ಬಳಕೆದಾರ ಹೆಸರು"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            autoComplete="username"
            className="pl-9 h-11 rounded-xl text-sm"
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            data-ocid="admin.login.password.input"
            type={showPassword ? "text" : "password"}
            placeholder="Password / ಪಾಸ್‌ವರ್ಡ್"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            autoComplete="current-password"
            className="pl-9 pr-10 h-11 rounded-xl text-sm"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {error && (
          <p
            data-ocid="admin.login.error_state"
            className="text-xs text-destructive text-center bg-destructive/5 rounded-lg py-2 px-3"
          >
            {error}
          </p>
        )}

        <Button
          data-ocid="admin.login.submit_button"
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark font-semibold text-sm gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Logging in...
            </>
          ) : (
            "Login / ಲಾಗಿನ್"
          )}
        </Button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="mt-5 text-sm text-muted-foreground hover:text-vew-sky transition-colors flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to app
      </button>
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
          designCode: editingDesign.designCode,
          category: editingDesign.category,
          workType: editingDesign.workType,
          imageUrls: editingDesign.imageUrls ?? [],
          isBridal: editingDesign.isBridal,
          isTrending: editingDesign.isTrending,
        }
      : emptyDesignForm,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [localPreviews, setLocalPreviews] = useState<string[]>(
    editingDesign?.imageUrls ?? [],
  );

  const { uploadImage } = useUploadImage();

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = 10 - form.imageUrls.length;
    const toUpload = files.slice(0, remaining);

    if (files.length > remaining) {
      toast.error(`Max 10 images. Only ${remaining} slot(s) remaining.`);
    }

    setUploadError("");

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      const localPreview = URL.createObjectURL(file);

      // Optimistically show the preview
      setLocalPreviews((prev) => [...prev, localPreview]);
      setUploadingIndex(form.imageUrls.length + i);
      setUploadProgress(0);

      try {
        const url = await uploadImage(file, (pct) => setUploadProgress(pct));
        setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
        setUploadProgress(100);
      } catch (err) {
        console.error("Image upload failed:", err);
        setUploadError("One or more uploads failed. Please try again.");
        setLocalPreviews((prev) => prev.filter((p) => p !== localPreview));
      } finally {
        URL.revokeObjectURL(localPreview);
      }
    }

    setUploadingIndex(null);
    // Reset file input so same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
    setLocalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Combine confirmed URLs with local previews for display
  const displayImages =
    form.imageUrls.length > 0 ? form.imageUrls : localPreviews;

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
        {/* Multi-Image Upload */}
        <div>
          <Label className="text-xs mb-2 block">
            Design Images / ಚಿತ್ರಗಳು{" "}
            <span className="text-muted-foreground font-normal">(max 10)</span>
          </Label>

          {/* Image grid thumbnails */}
          {displayImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-2">
              {displayImages.map((src, idx) => (
                <div
                  key={`img-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: image slots are positional
                    idx
                  }`}
                  className="relative aspect-square rounded-lg overflow-hidden bg-vew-sky-light/30 border border-border/60"
                >
                  <img
                    src={src}
                    alt={`Uploaded ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
                    aria-label={`Remove image ${idx + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* Uploading overlay */}
                  {uploadingIndex === idx && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                      <span className="text-[9px] text-white font-medium">
                        {uploadProgress}%
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Add more button */}
              {displayImages.length < 10 && (
                <button
                  type="button"
                  data-ocid="admin.add_design.upload_button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingIndex !== null}
                  className="aspect-square rounded-lg border-2 border-dashed border-vew-sky/40 bg-vew-sky-light/20 flex flex-col items-center justify-center hover:bg-vew-sky-light/40 transition-colors disabled:opacity-50"
                >
                  <ImagePlus className="w-5 h-5 text-vew-sky mb-0.5" />
                  <span className="text-[9px] text-vew-sky font-medium">
                    Add
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Initial upload zone when no images */}
          {displayImages.length === 0 && (
            <button
              type="button"
              data-ocid="admin.add_design.upload_button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingIndex !== null}
              className="w-full h-28 rounded-xl border-2 border-dashed border-vew-sky/40 bg-vew-sky-light/30 flex flex-col items-center justify-center hover:bg-vew-sky-light/50 transition-colors disabled:opacity-60"
            >
              {uploadingIndex !== null ? (
                <div className="flex flex-col items-center gap-2 w-full px-6">
                  <Loader2 className="w-6 h-6 text-vew-sky animate-spin" />
                  <p className="text-xs text-vew-sky font-medium">
                    Uploading... {uploadProgress}%
                  </p>
                  <div className="w-full bg-vew-sky/20 rounded-full h-1">
                    <div
                      className="bg-vew-sky h-1 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-vew-sky mb-1.5" />
                  <p className="text-xs text-vew-sky font-medium">
                    Upload Images (up to 10)
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ಚಿತ್ರಗಳನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಿ
                  </p>
                </>
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImagesChange}
          />

          {uploadError && (
            <p
              data-ocid="admin.add_design.upload.error_state"
              className="text-[10px] text-destructive mt-1 text-center"
            >
              {uploadError}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            {displayImages.length}/10 images added
          </p>
        </div>

        {/* Design Code */}
        <div>
          <Label className="text-xs mb-1.5 block">Design Code / ಡಿಸೈನ್ ಕೋಡ್ *</Label>
          <Input
            data-ocid="admin.add_design.code.input"
            value={form.designCode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, designCode: e.target.value }))
            }
            placeholder="e.g. VEW-EMB-001"
            className="h-10 text-sm rounded-xl"
          />
        </div>

        {/* Category */}
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

        {/* Work Type */}
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

        {/* Toggles */}
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

// ─── Bulk Upload Panel ────────────────────────────────────────────────────────

interface BulkFile {
  file: File;
  preview: string;
  uploadedUrl: string | null;
  status: "pending" | "uploading" | "done" | "error";
}

function BulkUploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkFiles, setBulkFiles] = useState<BulkFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { uploadImage } = useUploadImage();
  const createDesignBulk = useCreateDesignBulk();

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 500);
    const newFiles: BulkFile[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploadedUrl: null,
      status: "pending",
    }));
    setBulkFiles(newFiles);
    setIsDone(false);
    setErrorMsg("");
    setUploadedCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadAll = async () => {
    if (!bulkFiles.length) return;
    setIsUploading(true);
    setUploadedCount(0);
    setErrorMsg("");
    setIsDone(false);

    const batchSize = 3;
    const results: BulkFile[] = [...bulkFiles];

    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (item, batchIdx) => {
          const globalIdx = i + batchIdx;
          results[globalIdx] = { ...results[globalIdx], status: "uploading" };
          setBulkFiles([...results]);

          try {
            const url = await uploadImage(item.file);
            results[globalIdx] = {
              ...results[globalIdx],
              uploadedUrl: url,
              status: "done",
            };
          } catch {
            results[globalIdx] = {
              ...results[globalIdx],
              status: "error",
            };
          }

          setUploadedCount((c) => c + 1);
          setBulkFiles([...results]);
        }),
      );
    }

    // Collect successful uploads
    const successfulEntries = results
      .filter((f) => f.status === "done" && f.uploadedUrl)
      .map((f) => ({
        designCode: f.file.name.replace(/\.[^.]+$/, ""), // strip extension
        imageUrl: f.uploadedUrl as string,
      }));

    const errorCount = results.filter((f) => f.status === "error").length;

    if (successfulEntries.length > 0) {
      try {
        await createDesignBulk.mutateAsync(successfulEntries);
        toast.success(
          `Added ${successfulEntries.length} design${successfulEntries.length !== 1 ? "s" : ""} successfully!`,
        );
        setIsDone(true);
        if (errorCount > 0) {
          setErrorMsg(
            `${errorCount} file${errorCount !== 1 ? "s" : ""} failed to upload.`,
          );
        }
      } catch {
        setErrorMsg("Failed to save designs to database. Please try again.");
      }
    } else {
      setErrorMsg(
        "All uploads failed. Please check your connection and try again.",
      );
    }

    setIsUploading(false);
  };

  const handleClear = () => {
    // Revoke object URLs to free memory
    for (const f of bulkFiles) {
      URL.revokeObjectURL(f.preview);
    }
    setBulkFiles([]);
    setIsDone(false);
    setErrorMsg("");
    setUploadedCount(0);
  };

  const progress =
    bulkFiles.length > 0 ? (uploadedCount / bulkFiles.length) * 100 : 0;

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="bg-vew-sky-light/30 rounded-xl p-3 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-vew-sky" />
          <p className="text-xs font-bold text-vew-navy">Bulk Upload</p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Upload up to 500 images at once. Each image will create a new design
          entry using the filename as the design code.
        </p>
      </div>

      {/* Drop zone */}
      {bulkFiles.length === 0 ? (
        <button
          type="button"
          data-ocid="admin.bulk.dropzone"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-36 rounded-xl border-2 border-dashed border-vew-sky/40 bg-vew-sky-light/20 flex flex-col items-center justify-center hover:bg-vew-sky-light/40 transition-colors gap-2"
        >
          <Upload className="w-8 h-8 text-vew-sky" />
          <p className="text-sm font-semibold text-vew-sky">
            Select up to 500 images
          </p>
          <p className="text-[10px] text-muted-foreground">
            Tap to browse files / ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ
          </p>
        </button>
      ) : (
        <div>
          {/* Count + actions */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-vew-navy">
              {bulkFiles.length} file{bulkFiles.length !== 1 ? "s" : ""}{" "}
              selected
            </p>
            <button
              type="button"
              onClick={handleClear}
              disabled={isUploading}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          </div>

          {/* Progress bar when uploading */}
          {isUploading && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>
                  Uploading {uploadedCount}/{bulkFiles.length}...
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress
                data-ocid="admin.bulk.loading_state"
                value={progress}
                className="h-2 rounded-full"
              />
            </div>
          )}

          {/* Done state */}
          {isDone && (
            <div
              data-ocid="admin.bulk.success_state"
              className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-green-700">
                  Upload complete!
                </p>
                <p className="text-[10px] text-green-600">
                  {bulkFiles.filter((f) => f.status === "done").length} designs
                  added successfully
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div
              data-ocid="admin.bulk.error_state"
              className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-3"
            >
              <X className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{errorMsg}</p>
            </div>
          )}

          {/* Thumbnail grid preview */}
          <div className="grid grid-cols-4 gap-1.5 max-h-60 overflow-y-auto mb-3">
            {bulkFiles.map((item, idx) => (
              <div
                key={`bulk-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional
                  idx
                }`}
                className="relative aspect-square rounded-lg overflow-hidden bg-vew-sky-light/30"
              >
                <img
                  src={item.preview}
                  alt={item.file.name}
                  className="w-full h-full object-cover"
                />
                {/* Status overlay */}
                {item.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
                {item.status === "done" && (
                  <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
                {item.status === "error" && (
                  <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upload button */}
          {!isDone && (
            <Button
              data-ocid="admin.bulk.upload_button"
              onClick={handleUploadAll}
              disabled={isUploading || createDesignBulk.isPending}
              className="w-full h-12 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark font-semibold gap-2"
            >
              {isUploading || createDesignBulk.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {createDesignBulk.isPending
                    ? "Saving designs..."
                    : `Uploading ${uploadedCount}/${bulkFiles.length}...`}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload All {bulkFiles.length} Images
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesChange}
      />

      {/* Info note */}
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/60">
        <p className="text-[10px] text-amber-700 leading-relaxed">
          <strong>Auto settings per image:</strong>
          <br />
          Category: All Embroidery Works · Work Type: Embroidery
          <br />
          Trending: Off · Bridal: Off
          <br />
          Design Code = filename (without extension)
        </p>
      </div>
    </div>
  );
}

// ─── Admin Screen (main) ──────────────────────────────────────────────────────

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const { isLoggedIn, logout } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("designs");
  const [showForm, setShowForm] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [deleteDesignTarget, setDeleteDesignTarget] = useState<Design | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const allDesignsQuery = useAllDesigns();
  const measurementsQuery = useAllMeasurements();
  const createDesign = useCreateDesign();
  const updateDesign = useUpdateDesign();
  const deleteDesign = useDeleteDesign();
  const setTrending = useSetTrending();
  const setBridal = useSetBridal();
  const deleteMeasurement = useDeleteMeasurement();

  const designs = allDesignsQuery.data ?? [];

  const filteredDesigns = designs.filter(
    (d) =>
      d.designCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isLoggedIn) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border/60">
          <button type="button" onClick={onBack} className="p-1">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="text-sm font-bold text-vew-navy">Admin Panel</h2>
        </div>
        <AdminLogin onBack={onBack} onLoginSuccess={() => {}} />
      </div>
    );
  }

  const handleSaveDesign = async (form: DesignFormData) => {
    if (!form.designCode.trim() || !form.category) {
      toast.error("Design code and category are required");
      return;
    }
    try {
      if (editingDesign) {
        await updateDesign.mutateAsync({
          id: editingDesign.id,
          designCode: form.designCode,
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
        await createDesign.mutateAsync({
          designCode: form.designCode,
          category: form.category,
          workType: form.workType,
          imageUrls: form.imageUrls,
          isBridal: form.isBridal,
          isTrending: form.isTrending,
        });
        toast.success("Design added / ಡಿಸೈನ್ ಸೇರಿಸಲಾಗಿದೆ");
      }
      setShowForm(false);
      setEditingDesign(null);
    } catch (err) {
      console.error("Save design error:", err);
      toast.error("Failed to save design. Please try again.");
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

  // Show form panel when editing/adding
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border/60 flex-shrink-0">
        <button type="button" onClick={onBack} className="p-1">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <Shield className="w-4 h-4 text-vew-sky" />
        <h2 className="text-sm font-bold text-vew-navy">Admin Panel</h2>
        <button
          type="button"
          onClick={logout}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60 flex-shrink-0 overflow-x-auto">
        {[
          { id: "designs" as AdminTab, label: "Designs", kannada: "ಡಿಸೈನ್ಸ್" },
          { id: "add" as AdminTab, label: "Add Design", kannada: "ಸೇರಿಸಿ" },
          {
            id: "bulk" as AdminTab,
            label: "Bulk Upload",
            kannada: "ಬಲ್ಕ್ ಅಪ್ಲೋಡ್",
          },
          {
            id: "customers" as AdminTab,
            label: "Customers",
            kannada: "ಗ್ರಾಹಕರು",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-ocid={`admin.${tab.id}.tab`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-3 py-2.5 text-center transition-colors ${
              activeTab === tab.id
                ? "text-vew-sky border-b-2 border-vew-sky"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="text-xs font-semibold whitespace-nowrap">
              {tab.label}
            </div>
            <div className="text-[9px] opacity-60">{tab.kannada}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Designs Tab */}
        {activeTab === "designs" && (
          <div>
            <div className="px-4 pt-3 pb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-ocid="admin.designs.search_input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search designs..."
                  className="pl-9 h-9 rounded-xl text-sm"
                />
              </div>
              <Button
                data-ocid="admin.designs.primary_button"
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
                    data-ocid={`admin.designs.item.${idx + 1}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-3 py-2.5"
                  >
                    {/* Thumbnail */}
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
                      {/* Multi-image badge */}
                      {(design.imageUrls?.length ?? 0) > 1 && (
                        <div className="absolute bottom-0 right-0 bg-vew-sky text-white text-[8px] font-bold px-1 rounded-tl-md">
                          {design.imageUrls.length}
                        </div>
                      )}
                    </div>

                    {/* Info */}
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

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        data-ocid={`admin.designs.edit_button.${idx + 1}`}
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
                        data-ocid={`admin.designs.delete_button.${idx + 1}`}
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
                    data-ocid="admin.designs.empty_state"
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No designs found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Design Tab */}
        {activeTab === "add" && (
          <div className="flex flex-col h-full">
            <DesignFormPanel
              editingDesign={null}
              onSave={handleSaveDesign}
              onCancel={() => setActiveTab("designs")}
              isPending={createDesign.isPending}
            />
          </div>
        )}

        {/* Bulk Upload Tab */}
        {activeTab === "bulk" && <BulkUploadPanel />}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <div>
            <div className="px-4 pt-3 pb-2">
              <p className="text-xs text-muted-foreground">
                {(measurementsQuery.data ?? []).length} customer
                {(measurementsQuery.data ?? []).length !== 1 ? "s" : ""}{" "}
                registered
              </p>
            </div>

            {measurementsQuery.isLoading ? (
              <div className="px-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="px-4 pb-6 space-y-2">
                {(measurementsQuery.data ?? []).map((m: Measurement, idx) => (
                  <div
                    key={m.id.toString()}
                    data-ocid={`admin.customers.item.${idx + 1}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-3.5 py-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-vew-sky-light flex items-center justify-center flex-shrink-0">
                      <span className="text-vew-sky font-bold text-sm">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-vew-navy truncate">
                        {m.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid={`admin.customers.delete_button.${idx + 1}`}
                      onClick={async () => {
                        try {
                          await deleteMeasurement.mutateAsync(m.id);
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

                {(measurementsQuery.data ?? []).length === 0 && (
                  <div
                    data-ocid="admin.customers.empty_state"
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No customers yet
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
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
