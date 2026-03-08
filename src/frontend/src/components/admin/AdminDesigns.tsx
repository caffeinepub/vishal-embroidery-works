import { Eye, EyeOff, Pencil, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDesigns } from "../../hooks/useFirestore";
import { SUBCATEGORY_LABELS } from "../../lib/designCodes";
import { deleteDesign, updateDesign } from "../../lib/firestoreService";
import { fileToBase64 } from "../../lib/imageUtils";
import type { Design } from "../../lib/storage";

export function AdminDesigns() {
  const { data: designs, loading } = useDesigns();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editBridal, setEditBridal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = searchQuery.trim()
    ? designs.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.designCode.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : designs;

  const handleEdit = (design: Design) => {
    setEditingId(design.id);
    setEditTitle(design.title);
    setEditImages(design.images);
    setEditBridal(design.isBridal);
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    const design = designs.find((d) => d.id === editingId);
    if (!design) return;
    try {
      await updateDesign({
        ...design,
        title: editTitle.trim(),
        images: editImages,
        isBridal: editBridal,
      });
      setEditingId(null);
      toast.success("Design updated");
    } catch {
      toast.error("Failed to update design");
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
    if (editImages.length + files.length > 5) {
      toast.error("Maximum 5 images");
      return;
    }
    const newImgs = await Promise.all(
      files.slice(0, 5 - editImages.length).map(fileToBase64),
    );
    setEditImages((prev) => [...prev, ...newImgs]);
    e.target.value = "";
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
          placeholder="Search by title or code..."
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
              className={`bg-card rounded-xl shadow-card overflow-hidden ${design.isHidden ? "opacity-50" : ""}`}
            >
              {/* Thumbnail */}
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
                  {SUBCATEGORY_LABELS[design.subcategory]}
                </p>

                {/* Actions */}
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
          <div className="bg-card rounded-t-2xl p-4 space-y-4 max-h-[80vh] overflow-auto animate-slide-up">
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
            <div>
              <p className="text-xs font-semibold text-muted-foreground block mb-1.5">
                IMAGES ({editImages.length}/5)
              </p>
              <div className="flex gap-2 flex-wrap mb-2">
                {editImages.map((img, i) => (
                  <div key={img.slice(0, 30)} className="relative w-14 h-14">
                    <img
                      src={img}
                      className="w-full h-full object-cover rounded-lg"
                      alt=""
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
                {editImages.length < 5 && (
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Bridal Tag 👑
              </p>
              <button
                type="button"
                data-ocid="admin.edit_design.bridal.toggle"
                onClick={() => setEditBridal((b) => !b)}
                className={`w-11 h-6 rounded-full transition-colors relative ${editBridal ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editBridal ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </div>
            <button
              type="button"
              data-ocid="admin.edit_design.save.button"
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
