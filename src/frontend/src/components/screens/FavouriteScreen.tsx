import { Heart } from "lucide-react";
import type { Design } from "../../backend.d";
import { useAllDesigns } from "../../hooks/useQueries";
import { getFavourites } from "../../lib/favourites";
import { DesignGrid } from "../shared/DesignGrid";

interface FavouriteScreenProps {
  onDesignClick: (design: Design) => void;
}

export function FavouriteScreen({ onDesignClick }: FavouriteScreenProps) {
  const { data: allDesigns = [], isLoading } = useAllDesigns();

  const favIds = getFavourites();
  const favouriteDesigns = favIds
    .map((id) => allDesigns.find((d) => d.id.toString() === id))
    .filter((d): d is Design => !!d);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
          <div>
            <h2 className="text-sm font-bold text-vew-navy">My Favourites</h2>
            <p className="text-[10px] text-vew-sky">ನನ್ನ ಮೆಚ್ಚಿನವು</p>
          </div>
          {favouriteDesigns.length > 0 && (
            <span className="ml-auto bg-pink-100 text-pink-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              {favouriteDesigns.length}
            </span>
          )}
        </div>
      </div>

      {/* Grid or empty state */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div
            data-ocid="favourite.loading_state"
            className="flex flex-col items-center justify-center py-12 px-6"
          >
            <div className="w-8 h-8 rounded-full border-2 border-vew-sky border-t-transparent animate-spin mb-3" />
            <p className="text-xs text-muted-foreground">
              Loading favourites... / ಲೋಡ್ ಆಗುತ್ತಿದೆ
            </p>
          </div>
        ) : favouriteDesigns.length === 0 ? (
          <div
            data-ocid="favourite.empty_state"
            className="flex flex-col items-center justify-center py-16 px-6"
          >
            <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mb-4">
              <Heart className="w-9 h-9 text-pink-300" />
            </div>
            <p className="text-sm font-semibold text-foreground text-center">
              No favourites yet
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              ಇನ್ನೂ ಯಾವುದೇ ಮೆಚ್ಚಿನವುಗಳಿಲ್ಲ
            </p>
            <p className="text-xs text-muted-foreground text-center mt-3 max-w-[220px]">
              Tap the heart icon on any design to add it here
            </p>
          </div>
        ) : (
          <DesignGrid
            designs={favouriteDesigns}
            isLoading={false}
            onDesignClick={onDesignClick}
            emptyMessage="No favourites yet"
            emptyKannada="ಇನ್ನೂ ಯಾವುದೇ ಮೆಚ್ಚಿನವುಗಳಿಲ್ಲ"
          />
        )}
      </div>
    </div>
  );
}
