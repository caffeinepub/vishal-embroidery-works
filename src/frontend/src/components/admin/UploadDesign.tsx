import { CheckCircle, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDesigns } from "../../hooks/useFirestore";
import { SUBCATEGORY_LABELS, generateDesignCode } from "../../lib/designCodes";
import { addDesign } from "../../lib/firestoreService";
import { uploadToCloudinary } from "../../lib/imageUtils";
import { type Category, type Subcategory, generateId } from "../../lib/storage";

const CATEGORY_SUBCATEGORIES: Record<Category, Subcategory[]> = {
  embroidery: ["embroidery", "ready-blouse-embroidery"],
  blouse: ["simple-blouse", "boat-neck", "bridal-blouse", "designer-blouse"],
};

const PRESET_TAGS = [
  "zari",
  "heavy",
  "simple",
  "bridal",
  "daily wear",
  "party wear",
];

function getHelperText(sub: Subcategory): string {
  if (sub === "embroidery")
    return "Recommended: Wide embroidery design up to 1536 × 657 px";
  return "Recommended: Wide design image up to 1536 × 657 px";
}

type UploadStatus =
  | { phase: "idle" }
  | { phase: "uploading"; done: number; total: number }
  | { phase: "saving" }
  | { phase: "success" };

export function UploadDesign({ onSaved }: { onSaved: () => void }) {
  const [category, setCategory] = useState<Category>("embroidery");
  const [subcategory, setSubcategory] = useState<Subcategory>("embroidery");
  const [title, setTitle] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isBridal, setIsBridal] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<UploadStatus>({ phase: "idle" });

  const { data: designs } = useDesigns();

  const previewCode = generateDesignCode(subcategory, designs);
  const isLoading = status.phase === "uploading" || status.phase === "saving";

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setSubcategory(CATEGORY_SUBCATEGORIES[cat][0]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (previews.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      e.target.value = "";
      return;
    }
    const sliced = files.slice(0, 5 - previews.length);
    const newPreviews = sliced.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setPendingFiles((prev) => [...prev, ...sliced]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setPreviews((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      URL.revokeObjectURL(prev[idx]);
      return updated;
    });
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
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

  const handleSave = async () => {
    if (!category) {
      toast.error("Category is required");
      return;
    }
    if (!subcategory) {
      toast.error("Subcategory is required");
      return;
    }
    if (!title.trim()) {
      toast.error("Design title is required");
      return;
    }
    if (pendingFiles.length === 0) {
      toast.error("At least one image is required");
      return;
    }

    const total = pendingFiles.length;
    setStatus({ phase: "uploading", done: 0, total });

    try {
      const imageUrls: string[] = [];
      for (let i = 0; i < pendingFiles.length; i++) {
        const url = await uploadToCloudinary(pendingFiles[i]);
        imageUrls.push(url);
        setStatus({ phase: "uploading", done: i + 1, total });
      }

      setStatus({ phase: "saving" });
      const code = generateDesignCode(subcategory, designs);
      await addDesign({
        id: generateId(),
        designCode: code,
        title: title.trim(),
        images: imageUrls,
        category,
        subcategory,
        isBridal,
        isHidden: false,
        createdAt: new Date().toISOString(),
        tags,
        price: price ? Number.parseFloat(price) : null,
        notes: notes.trim() || "",
      });

      setStatus({ phase: "success" });
      onSaved();

      setTimeout(() => {
        setTitle("");
        setPreviews([]);
        setPendingFiles([]);
        setIsBridal(false);
        setTags([]);
        setTagInput("");
        setPrice("");
        setNotes("");
        setStatus({ phase: "idle" });
      }, 2000);
    } catch {
      toast.error("Upload failed. Please try again.");
      setStatus({ phase: "idle" });
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
              data-ocid={`upload.category_${cat}.toggle`}
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
          data-ocid="upload.subcategory.select"
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
      </div>

      {/* Code preview */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Auto-generated code
        </span>
        <span className="text-sm font-bold text-primary">{previewCode}</span>
      </div>

      {/* Title */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
          DESIGN TITLE
        </p>
        <input
          data-ocid="upload.title.input"
          type="text"
          placeholder="Enter design title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Images */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
          IMAGES ({previews.length}/5)
        </p>
        <p
          data-ocid="upload.helper_text.panel"
          className="text-[11px] text-muted-foreground mb-2"
        >
          Max 5 images. {getHelperText(subcategory)}
        </p>

        {previews.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {previews.map((preview, idx) => (
              <div key={preview} className="relative w-16 h-16">
                <img
                  src={preview}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-contain rounded-lg bg-muted"
                />
                {!isLoading && (
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    data-ocid={`upload.remove_image.button.${idx + 1}`}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {previews.length < 5 && !isLoading && (
          <label
            data-ocid="upload.image.upload_button"
            className="flex flex-col items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <Upload size={20} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Tap to upload images
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
          </label>
        )}
      </div>

      {/* Price */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
          PRICE (OPTIONAL)
        </p>
        <input
          data-ocid="upload.price.input"
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
        {/* Preset tag chips */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PRESET_TAGS.map((tag) => (
            <button
              type="button"
              key={tag}
              data-ocid="upload.tag_preset.toggle"
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
        {/* Custom tag input */}
        <input
          data-ocid="upload.tag_input.input"
          type="text"
          placeholder="Add custom tag, press Enter..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          disabled={isLoading}
          className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {/* Selected custom tags (non-preset) */}
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
        <div>
          <p className="text-sm font-semibold text-foreground">
            Tag as Bridal Design 👑
          </p>
          <p className="text-xs text-muted-foreground">
            Shows in Bridal collection
          </p>
        </div>
        <button
          type="button"
          data-ocid="upload.bridal.toggle"
          onClick={() => setIsBridal((b) => !b)}
          disabled={isLoading}
          className={`w-11 h-6 rounded-full transition-colors relative ${
            isBridal ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              isBridal ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
          NOTES (OPTIONAL)
        </p>
        <textarea
          data-ocid="upload.notes.textarea"
          placeholder="Admin notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Upload Progress */}
      {status.phase === "uploading" && (
        <div data-ocid="upload.progress.loading_state" className="space-y-2">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-muted-foreground">
              Uploading to Cloudinary...
            </span>
            <span className="text-primary font-bold">
              {status.done} / {status.total}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(status.done / status.total) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            {status.done === 0
              ? "Starting upload..."
              : status.done < status.total
                ? `${status.done} of ${status.total} uploaded`
                : "Saving design..."}
          </p>
        </div>
      )}

      {status.phase === "saving" && (
        <div
          data-ocid="upload.saving.loading_state"
          className="py-2 text-center"
        >
          <p className="text-sm text-muted-foreground animate-pulse">
            Saving design to cloud...
          </p>
        </div>
      )}

      {/* Success */}
      {status.phase === "success" && (
        <div
          data-ocid="upload.success_state"
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
        >
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-700">
              Upload Successful
            </p>
            <p className="text-xs text-green-600">Design saved to cloud.</p>
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        data-ocid="upload.save.button"
        onClick={handleSave}
        disabled={isLoading || status.phase === "success"}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] disabled:opacity-60"
      >
        {status.phase === "uploading"
          ? `Uploading... ${status.done}/${status.total}`
          : status.phase === "saving"
            ? "Saving..."
            : status.phase === "success"
              ? "Upload Successful"
              : "Save Design"}
      </button>
    </div>
  );
}
