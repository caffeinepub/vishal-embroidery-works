import { Eye, EyeOff, Pencil, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDesigns } from "../../hooks/useFirestore";
import { SUBCATEGORY_LABELS } from "../../lib/designCodes";
import {
  deleteDesign,
  updateDesign,
  updateOrderDesignCode,
} from "../../lib/firestoreService";
import { uploadToCloudinary } from "../../lib/imageUtils";
import type { Category, Design, Subcategory } from "../../lib/storage";

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

const PRESET_TAGS = [
  "zari",
  "heavy",
  "simple",
  "bridal",
  "daily wear",
  "party wear",
];

const MAX_IMAGES = 10;

export function AdminDesigns() {
  const { data: designs, loading } = useDesigns();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("embroidery");
  const [editSubcategory, setEditSubcategory] =
    useState<Subcategory>("embroidery");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editBridal, setEditBridal] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = searchQuery.trim()
    ? designs.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.designCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.tags?.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : designs;

  const handleEdit = (design: Design) => {
    setEditingId(design.id);
    setEditCode(design.designCode);
    setEditTitle(design.title);
    setEditCategory(design.category);
    // Safely coerce subcategory – old values (simple-blouse etc.) fall back to first option
    const validSubs = CATEGORY_SUBCATEGORIES[design.category];
    setEditSubcategory(
      validSubs.includes(design.subcategory as Subcategory)
        ? (design.subcategory as Subcategory)
        : validSubs[0],
    );
    setEditImages(design.images);
    setEditBridal(design.isBridal);
    setEditTags(design.tags || []);
    setEditPrice(design.price?.toString() || "");
    setEditNotes(design.notes || "");
  };

  const handleCategoryChange = (cat: Category) => {
    setEditCategory(cat);
    setEditSubcategory(CATEGORY_SUBCATEGORIES[cat][0]);
  };

  const togglePresetTag = (tag: string) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = editTagInput.trim().toLowerCase();
      if (val && !editTags.includes(val)) {
        setEditTags((prev) => [...prev, val]);
      }
      setEditTagInput("");
    }
  };

  const removeEditTag = (tag: string) => {
    setEditTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleEditSave = async () => {
    if (!editCode.trim()) {
      toast.error("Design code is required");
      return;
    }
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    const design = designs.find((d) => d.id === editingId);
    if (!design) return;

    const codeConflict = designs.find(
      (d) =>
        d.id !== design.id &&
        d.designCode.toLowerCase() === editCode.trim().toLowerCase(),
    );
    if (codeConflict) {
      toast.error(
        `Code "${editCode.trim()}" is already used by another design`,
      );
      return;
    }

    setIsSaving(true);
    try {
      const oldCode = design.designCode;
      const newCode = editCode.trim().toUpperCase();
      if (oldCode !== newCode) await updateOrderDesignCode(oldCode, newCode);

      await updateDesign({
        ...design,
        designCode: newCode,
        title: editTitle.trim(),
        category: editCategory,
        subcategory: editSubcategory,
        images: editImages,
        isBridal: editBridal,
        tags: editTags,
        price: editPrice ? Number.parseFloat(editPrice) : null,
        notes: editNotes.trim() || "",
        blouseType: null, // blouse type derived from subcategory going forward
      });

      setEditingId(null);
      toast.success("Design updated");
    } catch {
      toast.error("Failed to update design");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleHide = async (design: Design) => {
    try {
      await updateDesign({ ...design, isHidden: !design.isHidden });
      toast.success(design.isHidden ? "Design visible" : "Design hidden");
    } catch {
      toast.error("Failed to update design");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDesign(id);
      setDeleteConfirmId(null);
      toast.success("Design deleted");
    } catch {
      toast.error("Failed to delete design");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (editImages.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images`);
      return;
    }
    e.target.value = "";
    try {
      toast.info("Uploading image...");
      const newUrls = await Promise.all(
        files.slice(0, MAX_IMAGES - editImages.length).map(uploadToCloudinary),
      );
      setEditImages((prev) => [...prev, ...newUrls]);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div
        data-ocid="admin.designs.loading_state"
        className="p-4 grid grid-cols-2 gap-3"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-muted animate-pulse"
            style={{ paddingBottom: "100%" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="relative mb-4">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          data-ocid="admin.designs.search_input"
          type="text"
          placeholder="Search by title, code, or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} designs
      </p>

      {filtered.length === 0 ? (
        <div
          data-ocid="admin.designs.empty_state"
          className="text-center py-12"
        >
          <p className="text-muted-foreground">No designs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((design, idx) => (
            <div
              key={design.id}
              data-ocid={`admin.designs.item.${idx + 1}`}
              className={`bg-card rounded-xl shadow-card overflow-hidden ${
                design.isHidden ? "opacity-50" : ""
              }`}
            >
              <div
                className="relative w-full"
                style={{ paddingBottom: "100%" }}
              >
                <div className="absolute inset-0">
                  {design.images[0] ? (
                    <img
                      src={design.images[0]}
                      alt={design.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-3xl">🧵</span>
                    </div>
                  )}
                  {design.isHidden && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <EyeOff size={24} className="text-white" />
                    </div>
                  )}
                  {design.isBridal && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-yellow-400/90 rounded-full flex items-center justify-center">
                      <span className="text-[10px]">👑</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2">
                <p className="text-[10px] font-bold text-primary">
                  {design.designCode}
                </p>
                <p className="text-xs font-semibold text-foreground line-clamp-1">
                  {design.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {SUBCATEGORY_LABELS[design.subcategory as Subcategory] ??
                    design.subcategory}
                </p>
                <p className="text-[10px] text-primary font-semibold mt-0.5">
                  {design.price != null ? `₹${design.price}` : "Ask in Shop"}
                </p>
                {design.tags && design.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {design.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded-full bg-muted text-[9px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    {design.tags.length > 2 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{design.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-1 mt-2">
                  <button
                    type="button"
                    data-ocid={`admin.designs.edit_button.${idx + 1}`}
                    onClick={() => handleEdit(design)}
                    className="flex-1 py-1.5 rounded-lg bg-muted flex items-center justify-center"
                  >
                    <Pencil size={12} className="text-foreground" />
                  </button>
                  <button
                    type="button"
                    data-ocid={`admin.designs.hide_button.${idx + 1}`}
                    onClick={() => handleToggleHide(design)}
                    className="flex-1 py-1.5 rounded-lg bg-muted flex items-center justify-center"
                  >
                    {design.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    type="button"
                    data-ocid={`admin.designs.delete_button.${idx + 1}`}
                    onClick={() => setDeleteConfirmId(design.id)}
                    className="flex-1 py-1.5 rounded-lg bg-destructive/10 flex items-center justify-center"
                  >
                    <Trash2 size={12} className="text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-card rounded-t-2xl p-4 space-y-4 max-h-[90vh] overflow-auto animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Edit Design</h3>
              <button
                type="button"
                data-ocid="admin.edit_design.close_button"
                onClick={() => setEditingId(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Design Code */}
            <div>
              <label
                htmlFor="edit-design-code"
                className="text-xs font-semibold text-muted-foreground block mb-1"
              >
                DESIGN CODE
              </label>
              <input
                id="edit-design-code"
                data-ocid="admin.edit_design.code.input"
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                placeholder="e.g. EMB021"
                className="w-full px-3 py-2.5 rounded-xl border border-primary/40 bg-primary/5 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Changing the code will update all linked order records
                automatically.
              </p>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="edit-design-title"
                className="text-xs font-semibold text-muted-foreground block mb-1"
              >
                TITLE
              </label>
              <input
                id="edit-design-title"
                data-ocid="admin.edit_design.title.input"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

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
                    data-ocid={`admin.edit_design.category_${cat}.toggle`}
                    onClick={() => handleCategoryChange(cat)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                      editCategory === cat
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
                data-ocid="admin.edit_design.subcategory.select"
                value={editSubcategory}
                onChange={(e) =>
                  setEditSubcategory(e.target.value as Subcategory)
                }
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CATEGORY_SUBCATEGORIES[editCategory].map((sub) => (
                  <option key={sub} value={sub}>
                    {SUBCATEGORY_LABELS[sub]}
                  </option>
                ))}
              </select>
            </div>

            {/* Images */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
                IMAGES ({editImages.length}/{MAX_IMAGES})
              </p>
              <div className="flex gap-2 flex-wrap mb-2">
                {editImages.map((img, i) => (
                  <div key={img.slice(0, 30)} className="relative w-14 h-14">
                    <img
                      src={img}
                      className="w-full h-full object-cover rounded-lg"
                      alt=""
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditImages((p) => p.filter((_, j) => j !== i))
                      }
                      className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center text-[9px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {editImages.length < MAX_IMAGES && (
                  <label className="w-14 h-14 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer">
                    <span className="text-lg text-muted-foreground">+</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
                PRICE (OPTIONAL)
              </p>
              <input
                data-ocid="admin.edit_design.price.input"
                type="number"
                placeholder="Enter price in ₹..."
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
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
                    data-ocid="admin.edit_design.tag_preset.toggle"
                    onClick={() => togglePresetTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                      editTags.includes(tag)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <input
                data-ocid="admin.edit_design.tag_input.input"
                type="text"
                placeholder="Add custom tag, press Enter..."
                value={editTagInput}
                onChange={(e) => setEditTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {editTags.filter((t) => !PRESET_TAGS.includes(t)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {editTags
                    .filter((t) => !PRESET_TAGS.includes(t))
                    .map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeEditTag(tag)}
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Bridal Tag 👑
              </p>
              <button
                type="button"
                data-ocid="admin.edit_design.bridal.toggle"
                onClick={() => setEditBridal((b) => !b)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  editBridal ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    editBridal ? "translate-x-5" : "translate-x-0.5"
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
                data-ocid="admin.edit_design.notes.textarea"
                placeholder="Admin notes..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <button
              type="button"
              data-ocid="admin.edit_design.save.button"
              onClick={handleEditSave}
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div
            data-ocid="admin.delete_design.dialog"
            className="bg-card rounded-2xl p-5 w-full max-w-xs animate-fade-in"
          >
            <h3 className="font-bold text-foreground text-base mb-2">
              Delete Design?
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                data-ocid="admin.delete_design.cancel_button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="admin.delete_design.confirm_button"
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
