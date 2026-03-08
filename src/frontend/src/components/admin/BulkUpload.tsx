import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDesigns } from "../../hooks/useFirestore";
import { SUBCATEGORY_LABELS, generateDesignCode } from "../../lib/designCodes";
import { addDesign } from "../../lib/firestoreService";
import { filesToBase64Batch } from "../../lib/imageUtils";
import { type Category, type Subcategory, generateId } from "../../lib/storage";

const CATEGORY_SUBCATEGORIES: Record<Category, Subcategory[]> = {
  embroidery: ["embroidery", "ready-blouse-embroidery"],
  blouse: ["simple-blouse", "boat-neck", "bridal-blouse", "designer-blouse"],
};

export function BulkUpload({ onSaved }: { onSaved: () => void }) {
  const [category, setCategory] = useState<Category>("embroidery");
  const [subcategory, setSubcategory] = useState<Subcategory>("embroidery");
  const [isBridal, setIsBridal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [done, setDone] = useState(false);

  const { data: designs } = useDesigns();

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setSubcategory(CATEGORY_SUBCATEGORIES[cat][0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 100) {
      toast.error("Maximum 100 images allowed at once");
      e.target.value = "";
      return;
    }
    setSelectedFiles(files);
    setDone(false);
    e.target.value = "";
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) {
      toast.error("No files selected");
      return;
    }

    const BATCH = 10;
    setProgress({ current: 0, total: selectedFiles.length });

    // Keep a local counter for design codes (since Firestore updates are async)
    const existingCount = designs.filter(
      (d) => d.subcategory === subcategory,
    ).length;

    try {
      let savedCount = 0;
      for (let i = 0; i < selectedFiles.length; i += BATCH) {
        const batch = selectedFiles.slice(i, i + BATCH);
        const batchImages = await filesToBase64Batch(batch, BATCH);

        const savePromises = batchImages.map((imgData, batchIdx) => {
          const localCount = existingCount + savedCount + batchIdx + 1;
          const prefix =
            subcategory === "embroidery"
              ? "EMB"
              : subcategory === "ready-blouse-embroidery"
                ? "RBE"
                : subcategory === "simple-blouse"
                  ? "SIM"
                  : subcategory === "boat-neck"
                    ? "BN"
                    : subcategory === "bridal-blouse"
                      ? "BRD"
                      : "DSG";
          const code = `${prefix}${String(localCount).padStart(3, "0")}`;
          return addDesign({
            id: generateId(),
            designCode: code,
            title: code,
            images: [imgData],
            category,
            subcategory,
            isBridal,
            isHidden: false,
            createdAt: new Date().toISOString(),
          });
        });

        await Promise.all(savePromises);
        savedCount += batchImages.length;

        setProgress({
          current: Math.min(i + BATCH, selectedFiles.length),
          total: selectedFiles.length,
        });
        // Yield to UI thread
        await new Promise((r) => setTimeout(r, 10));
      }

      toast.success(`${selectedFiles.length} designs added successfully!`);
      onSaved();
      setSelectedFiles([]);
      setProgress(null);
      setDone(true);
    } catch {
      toast.error("Failed to process some images");
      setProgress(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
          CATEGORY
        </p>
        <div className="flex gap-2">
          {(["embroidery", "blouse"] as Category[]).map((cat) => (
            <button
              type="button"
              key={cat}
              data-ocid={`bulk.category_${cat}.toggle`}
              onClick={() => handleCategoryChange(cat)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
          SUBCATEGORY
        </p>
        <select
          data-ocid="bulk.subcategory.select"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value as Subcategory)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {CATEGORY_SUBCATEGORIES[category].map((sub) => (
            <option key={sub} value={sub}>
              {SUBCATEGORY_LABELS[sub]}
            </option>
          ))}
        </select>
        <p
          data-ocid="bulk.helper_text.panel"
          className="text-[11px] text-muted-foreground mt-1"
        >
          {subcategory === "embroidery"
            ? "Recommended: Wide embroidery design up to 1536 × 657 px"
            : "Recommended: 1200 × 1200 px (square)"}
        </p>
      </div>

      {/* Bridal Toggle */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
        <p className="text-sm font-semibold text-foreground">
          Tag all as Bridal 👑
        </p>
        <button
          type="button"
          data-ocid="bulk.bridal.toggle"
          onClick={() => setIsBridal((b) => !b)}
          className={`w-11 h-6 rounded-full transition-colors relative ${
            isBridal ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isBridal ? "translate-x-5" : "translate-x-0.5"}`}
          />
        </button>
      </div>

      {/* File Select */}
      <div>
        <label
          data-ocid="bulk.upload.dropzone"
          className="flex flex-col items-center justify-center gap-3 w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <Upload size={28} className="text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} files selected`
                : "Select up to 100 images"}
            </p>
            <p className="text-xs text-muted-foreground">Tap to browse</p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Progress */}
      {progress && (
        <div data-ocid="bulk.progress.loading_state">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Uploading to cloud...</span>
            <span>
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {done && (
        <div
          data-ocid="bulk.success_state"
          className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"
        >
          <p className="text-sm font-semibold text-green-700">
            All designs added successfully!
          </p>
        </div>
      )}

      <button
        type="button"
        data-ocid="bulk.upload.button"
        onClick={handleUploadAll}
        disabled={selectedFiles.length === 0 || !!progress}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] disabled:opacity-60"
      >
        {progress
          ? `Uploading ${progress.current}/${progress.total}...`
          : `Upload All (${selectedFiles.length} images)`}
      </button>
    </div>
  );
}
