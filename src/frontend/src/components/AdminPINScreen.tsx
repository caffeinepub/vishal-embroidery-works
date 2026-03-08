import { X } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../store/appStore";

const ADMIN_PIN = "4321";

export function AdminPINScreen() {
  const { closeAdmin, authenticateAdmin } = useAppStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError("");

    if (newPin.length === 4) {
      setTimeout(() => {
        if (newPin === ADMIN_PIN) {
          authenticateAdmin();
        } else {
          setShake(true);
          setError("Incorrect PIN");
          setPin("");
          setTimeout(() => setShake(false), 500);
        }
      }, 200);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-end p-4">
        <button
          type="button"
          data-ocid="admin.pin.close_button"
          onClick={closeAdmin}
          className="p-2 rounded-full hover:bg-muted"
        >
          <X size={22} className="text-foreground" />
        </button>
      </div>

      {/* Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-20 h-20 rounded-2xl vew-hero-gradient flex items-center justify-center mb-4 shadow-card">
          <span className="text-white text-2xl font-bold">VEW</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Admin Access</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Enter your 4-digit PIN
        </p>

        {/* PIN dots */}
        <div className={`flex gap-4 mb-4 ${shake ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length ? "bg-primary scale-110" : "bg-border"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium mb-4">{error}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {digits.map((digit, idx) => {
            const keyVal = `digit-${idx}`;
            if (digit === "") {
              return <div key={keyVal} />;
            }
            return (
              <button
                type="button"
                key={keyVal}
                data-ocid={`admin.pin.key_${digit === "⌫" ? "delete" : digit}`}
                onClick={() =>
                  digit === "⌫" ? handleDelete() : handleDigit(digit)
                }
                className={`h-14 rounded-2xl font-semibold text-xl transition-all active:scale-95 ${
                  digit === "⌫"
                    ? "bg-muted text-muted-foreground"
                    : "bg-card shadow-xs text-foreground hover:bg-primary/5 active:bg-primary/10"
                }`}
              >
                {digit}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
