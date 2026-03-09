import { ChevronLeft, FlaskConical } from "lucide-react";
import { useAppStore } from "../store/appStore";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onNavigateTrialRoom?: () => void;
}

export function TopBar({
  title = "Vishal Embroidery Works",
  showBack = false,
  onBack,
  onNavigateTrialRoom,
}: TopBarProps) {
  const { openAdmin, trialRoom } = useAppStore();

  return (
    <header
      className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40 flex items-center px-4 pt-safe"
      style={{ height: "56px" }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showBack && (
          <button
            type="button"
            data-ocid="nav.back.button"
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Go back"
          >
            <ChevronLeft size={22} className="text-foreground" />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          {!showBack && (
            <div className="w-7 h-7 rounded-full vew-hero-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold leading-none">
                VEW
              </span>
            </div>
          )}
          <h1
            className={`font-bold text-foreground truncate ${showBack ? "text-base" : "text-sm"}`}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Right side: Trial Room icon + Admin button */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!showBack && onNavigateTrialRoom && (
          <button
            type="button"
            data-ocid="trial_room.open_modal_button"
            onClick={onNavigateTrialRoom}
            className="relative w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Trial Room"
          >
            <FlaskConical size={18} className="text-foreground" />
            {trialRoom.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {trialRoom.length}
              </span>
            )}
          </button>
        )}
        {!showBack && (
          <button
            type="button"
            data-ocid="admin.open_modal_button"
            onClick={openAdmin}
            className="w-9 h-9 rounded-full vew-hero-gradient flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            aria-label="Admin panel"
          >
            <span className="text-white text-[11px] font-bold leading-none">
              VEW
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
