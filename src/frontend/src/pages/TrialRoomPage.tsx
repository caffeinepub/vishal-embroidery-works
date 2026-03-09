import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getOptimizedImageUrl } from "../lib/imageUtils";
import type { TrialRoomItem } from "../lib/storage";
import { useAppStore } from "../store/appStore";

interface TrialRoomPageProps {
  onPreviewDesign: (item: TrialRoomItem) => void;
}

export function TrialRoomPage({ onPreviewDesign }: TrialRoomPageProps) {
  const { trialRoom, removeFromTrialRoom } = useAppStore();

  const handleRemove = (item: TrialRoomItem) => {
    removeFromTrialRoom(item.id);
    toast.success("Removed from Trial Room");
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Trial Room</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {trialRoom.length === 0
                ? "No designs saved"
                : `${trialRoom.length} / 10 designs`}
            </p>
          </div>
          {trialRoom.length > 0 && (
            <button
              type="button"
              data-ocid="trial_room.delete_button"
              onClick={() => {
                const { clearTrialRoom } = useAppStore.getState();
                clearTrialRoom();
                toast.success("Trial Room cleared");
              }}
              className="text-xs text-destructive border border-destructive/30 rounded-lg px-3 py-1.5 hover:bg-destructive/10 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {trialRoom.length === 0 ? (
        <div
          data-ocid="trial_room.empty_state"
          className="flex flex-col items-center justify-center py-20 px-8"
        >
          <span className="text-5xl mb-3">🧪</span>
          <p className="text-base font-semibold text-foreground">
            Trial Room is Empty
          </p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Tap "+ Trial Room" on any design card to save it here for
            comparison.
          </p>
        </div>
      ) : (
        <div
          data-ocid="trial_room.list"
          className="px-4 grid grid-cols-2 gap-3 pb-6"
        >
          {trialRoom.map((item, idx) => (
            <div
              key={item.id}
              data-ocid={`trial_room.item.${idx + 1}`}
              className="rounded-xl overflow-hidden bg-card shadow-card"
            >
              {/* Image */}
              <div
                className="relative w-full bg-black"
                style={{ paddingBottom: "42.77%" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {item.imageURL ? (
                    <img
                      src={getOptimizedImageUrl(item.imageURL, 600)}
                      alt={item.designCode}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-3xl">🧵</span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="px-2 pt-2 pb-1">
                <p className="text-[10px] font-bold text-primary tracking-wide">
                  {item.designCode}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {item.category}
                </p>
              </div>

              {/* Action buttons */}
              <div className="px-2 pb-2 flex gap-1.5">
                <button
                  type="button"
                  data-ocid={`trial_room.secondary_button.${idx + 1}`}
                  onClick={() => onPreviewDesign(item)}
                  className="flex-1 text-[10px] font-semibold py-1 px-2 rounded-lg border border-primary text-primary bg-transparent hover:bg-primary/10 transition-colors"
                >
                  Preview
                </button>
                <button
                  type="button"
                  data-ocid={`trial_room.delete_button.${idx + 1}`}
                  onClick={() => handleRemove(item)}
                  className="flex items-center justify-center w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
