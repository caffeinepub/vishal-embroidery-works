import { Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDesigns } from "../../hooks/useFirestore";
import { SUBCATEGORY_LABELS, generateDesignCode } from "../../lib/designCodes";
import { addDesign } from "../../lib/firestoreService";
import { fileToBase64 } from "../../lib/imageUtils";
import { type Category, type Subcategory, generateId } from "../../lib/storage";

const CATEGORY_SUBCATEGORIES: Record<Category, Subcategory[]> = {
  embroidery: ["embroidery", "ready-blouse-embroidery"],
  blouse: ["simple-blouse", "boat-neck", "bridal-blouse", "designer-blouse"],
};

export function UploadDesign({ onSaved }: { onSaved: () => void }) {
  const [category, setCategory] = useState<Category>("embroidery");
  const [subcategory, setSubcategory] = useState<Subcategory>("embroidery");
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isBridal, setIsBridal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: designs } = useDesigns();

  const previewCode = generateDesignCode(subcategory, designs);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setSubcategory(CATEGORY_SUBCATEGORIES[cat][0]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    setIsLoading(true);
    try {
      const newImages = await Promise.all(
        files.slice(0, 5 - images.length).map(fileToBase64),
      );
      setImages((prev) => [...prev, ...newImages]);
    } catch {
      toast.error("Failed to process images");
    } finally {
      setIsLoading(false);
    }
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Design title is required");
      return;
    }
    if (images.length === 0) {
      toast.error("At least one image is required");
      return;
    }

    setIsLoading(true);
    try {
      const code = generateDesignCode(subcategory, designs);
      const design = {
        id: generateId(),
        designCode: code,
        title: title.trim(),
        images,
        category,
        subcategory,
        isBridal,
        isHidden: false,
        createdAt: new Date().toISOString(),
      };
      await addDesign(design);
      toast.success(`Design ${code} saved successfully!`);
      onSaved();

      // Reset
      setTitle("");
      setImages([]);
      setIsBridal(false);
    } catch {
      toast.error("Failed to save design. Check connection.");
    } finally {
      setIsLoading(false);
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
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Images */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
          IMAGES ({images.length}/5)
        </p>
        <p className="text-[11px] text-muted-foreground mb-2">
          Max 5 images. Recommended: 1200×1200px (square)
        </p>

        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {images.map((img, idx) => (
              <div key={img.slice(0, 30)} className="relative w-16 h-16">
                <img
                  src={img}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  data-ocid={`upload.remove_image.button.${idx + 1}`}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < 5 && (
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
              onChange={handleImageUpload}
              disabled={isLoading}
            />
          </label>
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

      {/* Save button */}
      <button
        type="button"
        data-ocid="upload.save.button"
        onClick={handleSave}
        disabled={isLoading}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98] disabled:opacity-60"
      >
        {isLoading ? "Saving..." : "Save Design"}
      </button>
    </div>
  );
}
