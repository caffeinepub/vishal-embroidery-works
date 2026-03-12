import { CheckCircle, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDesigns } from "../../hooks/useFirestore";
import { SUBCATEGORY_LABELS } from "../../lib/designCodes";
import { addDesign } from "../../lib/firestoreService";
import { uploadToCloudinary } from "../../lib/imageUtils";
import { type Category, type Subcategory, generateId } from "../../lib/storage";

const CATEGORY_SUBCATEGORIES: Record<Category, Subcategory[]> = {
  embroidery: ["embroidery", "ready-blouse-embroidery"],
  blouse: [
    "boat-neck",
    "princess-cut",
    "high-neck",
    "collar-neck",
    "padded-blouse",
  ],
};

const PREFIXES: Record<Subcategory, string> = {
  embroidery: "EMB",
  "ready-blouse-embroidery": "RBE",
  "boat-neck": "BN",
  "princess-cut": "PC",
  "high-neck": "HN",
  "collar-neck": "CN",
  "padded-blouse": "PB",
};

const PRESET_TAGS = [
  "zari",
  "heavy",
  "simple",
  "bridal",
  "daily wear",
  "party wear",
];

type BulkStatus =
  | { phase: "idle" }
  | { phase: "uploading"; done: number; total: number }
  | { phase: "success"; count: number };

export function BulkUpload({ onSaved }: { onSaved: () => void }) {
  const [category, setCategory] = useState<Category>("embroidery");
  const [subcategory, setSubcategory] = useState<Subcategory>("embroidery");
  const [isBridal, setIsBridal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<BulkStatus>({ phase: "idle" });

  const { data: designs } = useDesigns();

  const isLoading = status.phase === "uploading";

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
    setStatus({ phase: "idle" });
    e.target.value = "";
  };

  const togglePresetTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (val && !tags.includes(val)) {
        setTags((prev) => [...prev, val]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) {
      toast.error("No files selected");
      return;
    }

    const total = selectedFiles.length;
    setStatus({ phase: "uploading", done: 0, total });

    const existingCount = designs.filter(
      (d) => d.subcategory === subcategory,
    ).length;

    const prefix = PREFIXES[subcategory];

    try {
      // Phase 1: Upload ALL images to Cloudinary first
      const imageUrls: string[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const url = await uploadToCloudinary(selectedFiles[i]);
        imageUrls.push(url);
        setStatus({ phase: "uploading", done: i + 1, total });
      }

      // Phase 2: Save all design documents to Firestore
      const saves = imageUrls.map((imageUrl, i) => {
        const localCount = existingCount + i + 1;
        const code = `${prefix}${String(localCount).padStart(3, "0")}`;
        return addDesign({
          id: generateId(),
          designCode: code,
          title: code,
          images: [imageUrl],
          category,
          subcategory,
          isBridal,
          isHidden: false,
          createdAt: new Date().toISOString(),
          tags,
          price: price ? Number.parseFloat(price) : null,
          notes: notes.trim() || "",
        });
      });
      await Promise.all(saves);

      setStatus({ phase: "success", count: total });
      onSaved();
      setSelectedFiles([]);
    } catch {
      toast.error("Upload failed. Please try again.");
      setStatus({ phase: "idle" });
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setStatus({ phase: "idle" });
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
              disabled={isLoading}
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
          disabled={isLoading}
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
          Recommended: Wide design image up to 1536 × 657 px
        </p>
      </div>

      {/* Price */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
          PRICE (OPTIONAL)
        </p>
        <input
          data-ocid="bulk.price.input"
          type="number"
          placeholder="Enter price in ₹..."
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={isLoading}
          min="0"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Leave blank to show &apos;Ask in Shop&apos;
        </p>
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
          TAGS
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PRESET_TAGS.map((tag) => (
            <button
              type="button"
              key={tag}
              data-ocid="bulk.tag_preset.toggle"
              onClick={() => togglePresetTag(tag)}
              disabled={isLoading}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                tags.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <input
          data-ocid="bulk.tag_input.input"
          type="text"
          placeholder="Add custom tag, press Enter..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          disabled={isLoading}
          className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {tags.filter((t) => !PRESET_TAGS.includes(t)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags
              .filter((t) => !PRESET_TAGS.includes(t))
              .map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
          </div>
        )}
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
          disabled={isLoading}
          className={`w-11 h-6 rounded-full transition-colors relative ${
            isBridal ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isBridal ? "translate-x-5" : "translate-x-0.5"}`}
          />
        </button>
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
          NOTES (OPTIONAL)
        </p>
        <textarea
          data-ocid="bulk.notes.textarea"
          placeholder="Admin notes for all designs in this batch..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* File Select */}
      {!isLoading && status.phase !== "success" && (
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
      )}

      {/* Progress Indicator */}
      {status.phase === "uploading" && (
        <div data-ocid="bulk.progress.loading_state" className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-muted-foreground">
              {status.done === 0
                ? "Starting upload..."
                : "Uploading to Cloudinary..."}
            </span>
            <span className="text-xl font-bold text-primary tabular-nums">
              {status.done} / {status.total}
            </span>
          </div>

          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{
                width: `${status.total > 0 ? (status.done / status.total) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>
              {status.done < status.total
                ? `${status.done} uploaded, ${status.total - status.done} remaining`
                : "Finalising..."}
            </span>
            <span>{Math.round((status.done / status.total) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Success State */}
      {status.phase === "success" && (
        <div
          data-ocid="bulk.success_state"
          className="bg-green-50 border border-green-200 rounded-xl p-5 text-center space-y-2"
        >
          <CheckCircle size={32} className="text-green-600 mx-auto" />
          <p className="text-base font-bold text-green-700">
            Upload Successful
          </p>
          <p className="text-xs text-green-600">
            {status.count} design{status.count !== 1 ? "s" : ""} saved to
            Firestore.
          </p>
          <button
            type="button"
            data-ocid="bulk.upload_more.button"
            onClick={handleReset}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Upload More
          </button>
        </div>
      )}

      {/* Upload Button */}
      {status.phase !== "success" && (
        <button
          type="button"
          data-ocid="bulk.upload.button"
          onClick={handleUploadAll}
          disabled={selectedFiles.length === 0 || isLoading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] disabled:opacity-60"
        >
          {isLoading
            ? `Uploading ${status.done} / ${status.total}...`
            : `Upload All (${selectedFiles.length} image${selectedFiles.length !== 1 ? "s" : ""})`}
        </button>
      )}
    </div>
  );
}
