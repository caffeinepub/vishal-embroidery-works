import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  Flame,
  Heart,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Search,
  Shield,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Customer, Design } from "../../backend.d";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  useAllCustomers,
  useAllDesigns,
  useCreateDesign,
  useCreateDesignBulk,
  useDeleteCustomer,
  useDeleteDesign,
  useGetNextDesignCode,
  useSetBridal,
  useSetTrending,
  useUpdateDesign,
} from "../../hooks/useQueries";
import { useUploadImage } from "../../hooks/useUploadImage";
import { getAdminActor, getAdminSession } from "../../utils/adminActor";

const CATEGORIES = [
  "All Embroidery Works",
  "All Embroidery",
  "Ready Blouse Embroidery",
  "Simple Blouse",
  "Princess Cut Blouse",
  "Boat Neck Blouse",
  "Collar Blouse",
  "Fashion Blouse",
];

type AdminTab = "designs" | "upload" | "customers";

interface DesignFormData {
  category: string;
  workType: string;
  imageUrls: string[];
  isBridal: boolean;
  isTrending: boolean;
}

const emptyDesignForm: DesignFormData = {
  category: "",
  workType: "",
  imageUrls: [],
  isBridal: false,
  isTrending: false,
};

// ─── Google Identity Services type declarations ───────────────────────────────

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (
            notification?: (n: {
              isNotDisplayed(): boolean;
              isSkippedMoment(): boolean;
            }) => void,
          ) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

// Google OAuth Client ID for Vishal Embroidery Works Admin Panel
const GOOGLE_CLIENT_ID =
  "1002480004594-gvas36ut7eloj28h9738htb3ec1p0oud.apps.googleusercontent.com";

// ─── Auth Status Banner ───────────────────────────────────────────────────────
// Shows a real-time indicator of whether the admin session token is ready.
// Green = token found + session initialised → uploads will succeed.
// Red   = token missing → uploads will fail with "Unauthorized".
// This saves opening DevTools to diagnose upload failures.

type AuthTokenStatus = "checking" | "ok" | "missing";

function AuthStatusBanner() {
  const [status, setStatus] = useState<AuthTokenStatus>("checking");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAdminSession()
      .then(() => {
        if (!cancelled) {
          setStatus("ok");
          setDetail("Admin session active — uploads are authorised.");
          console.info(
            "[AuthStatus] Banner: ✅ Admin session verified and ready.",
          );
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setStatus("missing");
          setDetail(msg);
          console.error("[AuthStatus] Banner: ❌ Admin session failed —", msg);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") return null;

  if (status === "ok") {
    return (
      <div
        data-ocid="admin.auth.success_state"
        className="mx-4 mt-3 flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2"
      >
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-semibold text-green-700">
            Authentication Status: Active
          </p>
          <p className="text-[10px] text-green-600 leading-snug">{detail}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid="admin.auth.error_state"
      className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
    >
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[11px] font-semibold text-red-700">
          Authentication Status: Unauthorized
        </p>
        <p className="text-[10px] text-red-600 leading-snug">
          Uploads will fail. Open this app via the correct admin link, then
          refresh the page.
        </p>
        <p className="text-[10px] text-red-500 mt-0.5 font-mono break-all">
          {detail}
        </p>
      </div>
    </div>
  );
}

// ─── Admin Login ──────────────────────────────────────────────────────────────

function AdminLogin({
  onBack,
  onLoginSuccess,
}: {
  onBack: () => void;
  onLoginSuccess: () => void;
}) {
  const { login, loginWithGoogle } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const isPlaceholderClientId = GOOGLE_CLIENT_ID.startsWith(
    "YOUR_GOOGLE_CLIENT_ID",
  );

  const handleGoogleCredential = (response: { credential: string }) => {
    try {
      // Decode JWT payload (middle segment)
      const parts = response.credential.split(".");
      if (parts.length !== 3) throw new Error("Invalid credential format");
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      ) as { email?: string; name?: string; given_name?: string };
      const email: string = payload.email ?? "";
      const name: string = payload.name ?? payload.given_name ?? email;

      if (!email) {
        setError("Could not retrieve email from Google account.");
        setIsGoogleLoading(false);
        return;
      }

      const authorized = loginWithGoogle(email, name);
      if (authorized) {
        // Token was already saved to sessionStorage by the bootstrap code in
        // main.tsx (which ran before React rendered). We re-check here as a
        // belt-and-suspenders measure in case the token is still in the URL
        // at the time the Google popup closes (e.g. when using One Tap without
        // a full OAuth redirect).
        const TOKEN_KEY = "vew_caffeine_admin_token";
        const tokenFromQuery = new URLSearchParams(window.location.search).get(
          "caffeineAdminToken",
        );
        if (tokenFromQuery) {
          sessionStorage.setItem(TOKEN_KEY, tokenFromQuery);
          console.info(
            "[AdminAuth] Google login: token re-persisted from URL query string.",
          );
        }

        const tokenInSession = sessionStorage.getItem(TOKEN_KEY);
        console.info(
          `[AdminAuth] Google login success. Token in sessionStorage: ${tokenInSession ? "YES ✅" : "NO ❌"}`,
        );

        // Pre-warm the singleton admin actor so it is ready before the first upload.
        getAdminActor().catch((e) =>
          console.warn("Admin actor pre-warm failed:", e),
        );
        onLoginSuccess();
      } else {
        setError("Your account is not authorized to access the Admin Panel.");
      }
    } catch (err) {
      console.error("Google credential parse error:", err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const initializeGoogle = () => {
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    // Render the hidden Google button (used as fallback for the OAuth popup)
    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
        text: "continue_with",
        shape: "rectangular",
      });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initializeGoogle is intentionally stable — it reads window.google which is only available after script load, so it must be called from within the effect after confirming the script is ready.
  useEffect(() => {
    if (isPlaceholderClientId) return;

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      setGoogleScriptLoaded(true);
      initializeGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleScriptLoaded(true);
      initializeGoogle();
    };
    script.onerror = () => {
      console.error("Failed to load Google Identity Services script");
    };
    document.head.appendChild(script);
  }, [isPlaceholderClientId]);

  const handleGoogleLogin = () => {
    if (isPlaceholderClientId) {
      setError(
        "Google login requires configuration. Please set up a Google OAuth Client ID in Google Cloud Console, then add it to the GOOGLE_CLIENT_ID constant in AdminScreen.tsx.",
      );
      return;
    }
    if (!window.google?.accounts?.id) {
      setError(
        "Google Identity Services not loaded. Check your internet connection.",
      );
      return;
    }
    setError("");
    setIsGoogleLoading(true);
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setIsGoogleLoading(false);
        // Fallback: click the hidden rendered Google button
        const btn = googleButtonRef.current?.querySelector(
          "div[role='button']",
        ) as HTMLElement | null;
        btn?.click();
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    setIsLoading(true);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 400));
    const success = login(username, password);
    setIsLoading(false);
    if (success) {
      // Token was already saved by main.tsx bootstrap. Re-check as a safety net.
      const TOKEN_KEY = "vew_caffeine_admin_token";
      const tokenFromQuery = new URLSearchParams(window.location.search).get(
        "caffeineAdminToken",
      );
      if (tokenFromQuery) {
        sessionStorage.setItem(TOKEN_KEY, tokenFromQuery);
        console.info(
          "[AdminAuth] Password login: token re-persisted from URL query string.",
        );
      }

      const tokenInSession = sessionStorage.getItem(TOKEN_KEY);
      console.info(
        `[AdminAuth] Password login success. Token in sessionStorage: ${tokenInSession ? "YES ✅" : "NO ❌"}`,
      );

      // Pre-warm the singleton admin actor in the background so it's ready
      // before the admin attempts their first upload or design save.
      getAdminActor().catch((e) =>
        console.warn("Admin actor pre-warm failed:", e),
      );
      onLoginSuccess();
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-16 h-16 rounded-2xl bg-vew-sky-light flex items-center justify-center mb-5 shadow-sm">
        <Shield className="w-8 h-8 text-vew-sky" />
      </div>

      <h2 className="text-xl font-bold text-vew-navy mb-1">Admin Login</h2>
      <p className="text-xs text-muted-foreground mb-6 text-center">
        ಅಡ್ಮಿನ್ ಲಾಗಿನ್ · Enter your credentials to access the admin panel
      </p>

      <form
        onSubmit={handleLogin}
        className="w-full max-w-[320px] space-y-3"
        noValidate
      >
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            data-ocid="admin.login.username.input"
            type="text"
            placeholder="Username / ಬಳಕೆದಾರ ಹೆಸರು"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            autoComplete="username"
            className="pl-9 h-11 rounded-xl text-sm"
            disabled={isLoading || isGoogleLoading}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            data-ocid="admin.login.password.input"
            type={showPassword ? "text" : "password"}
            placeholder="Password / ಪಾಸ್‌ವರ್ಡ್"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            autoComplete="current-password"
            className="pl-9 pr-10 h-11 rounded-xl text-sm"
            disabled={isLoading || isGoogleLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {error && (
          <p
            data-ocid="admin.login.error_state"
            className="text-xs text-destructive text-center bg-destructive/5 rounded-lg py-2 px-3"
          >
            {error}
          </p>
        )}

        <Button
          data-ocid="admin.login.submit_button"
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full h-11 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark font-semibold text-sm gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Logging in...
            </>
          ) : (
            "Login / ಲಾಗಿನ್"
          )}
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Google Sign-In */}
        {isPlaceholderClientId ? (
          <>
            <Button
              type="button"
              data-ocid="admin.login.google_button"
              variant="outline"
              className="w-full h-11 rounded-xl text-sm gap-2"
              onClick={handleGoogleLogin}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Configure Google Login
            </Button>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              To enable Google login, configure a Google OAuth Client ID in
              Google Cloud Console and update the GOOGLE_CLIENT_ID constant in
              AdminScreen.tsx
            </p>
          </>
        ) : (
          <div className="w-full">
            {/* Hidden rendered Google button (for proper OAuth popup flow) */}
            <div ref={googleButtonRef} className="hidden" aria-hidden="true" />
            {/* Our styled trigger button */}
            <Button
              type="button"
              data-ocid="admin.login.google_button"
              variant="outline"
              className="w-full h-11 rounded-xl text-sm gap-2"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || !googleScriptLoaded}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in with Google...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </div>
        )}
      </form>

      <button
        type="button"
        onClick={onBack}
        className="mt-5 text-sm text-muted-foreground hover:text-vew-sky transition-colors flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to app
      </button>
    </div>
  );
}

// ─── Design Form Panel ────────────────────────────────────────────────────────

function DesignFormPanel({
  editingDesign,
  onSave,
  onCancel,
  isPending,
}: {
  editingDesign: Design | null;
  onSave: (form: DesignFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<DesignFormData>(
    editingDesign
      ? {
          category: editingDesign.category,
          workType: editingDesign.workType,
          imageUrls: editingDesign.imageUrls ?? [],
          isBridal: editingDesign.isBridal,
          isTrending: editingDesign.isTrending,
        }
      : emptyDesignForm,
  );

  const nextCodeQuery = useGetNextDesignCode(
    editingDesign ? "" : form.category,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [localPreviews, setLocalPreviews] = useState<string[]>(
    editingDesign?.imageUrls ?? [],
  );

  const { uploadImage } = useUploadImage();

  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
  const MAX_FILE_SIZE_MB = 10;

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Validate file types
    const invalidType = files.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalidType) {
      toast.error(
        `"${invalidType.name}" is not supported. Please upload PNG, JPG or JPEG images only.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file sizes
    const oversized = files.find(
      (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024,
    );
    if (oversized) {
      toast.error(
        `"${oversized.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit. Please use a smaller image.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const remaining = 10 - form.imageUrls.length;
    const toUpload = files.slice(0, remaining);

    if (files.length > remaining) {
      toast.error(`Max 10 images. Only ${remaining} slot(s) remaining.`);
    }

    setUploadError("");

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      const localPreview = URL.createObjectURL(file);
      const uploadSlotIndex = form.imageUrls.length + i;

      // Optimistically show the preview
      setLocalPreviews((prev) => [...prev, localPreview]);
      setUploadingIndex(uploadSlotIndex);
      setUploadProgress(0);

      try {
        const url = await uploadImage(file, (pct) => setUploadProgress(pct));
        // Replace the local preview URL with the confirmed remote URL
        setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
        setLocalPreviews((prev) => {
          const updated = [...prev];
          // Replace the matching local blob URL with the remote URL so display stays intact
          const idx = updated.indexOf(localPreview);
          if (idx !== -1) updated[idx] = url;
          return updated;
        });
        setUploadProgress(100);
      } catch (err) {
        console.error("Image upload failed:", err);
        // Always show the real error reason — imageHandler now includes the
        // full upstream message (canister trap text, HTTP status, token errors).
        const realMsg = err instanceof Error ? err.message : String(err);
        setUploadError(realMsg);
        setLocalPreviews((prev) => prev.filter((p) => p !== localPreview));
        URL.revokeObjectURL(localPreview);
      }
    }

    setUploadingIndex(null);
    // Reset file input so same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setLocalPreviews((prev) => {
      const removed = prev[index];
      // Revoke if it's a local blob URL (not a remote http URL)
      if (removed?.startsWith("blob:")) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== index);
    });
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  // Show localPreviews as the source of truth for display -- they get replaced
  // with remote URLs in-place once each upload completes.
  const displayImages =
    localPreviews.length > 0 ? localPreviews : form.imageUrls;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border/60 flex items-center gap-2 flex-shrink-0">
        <button type="button" onClick={onCancel} className="p-1">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h3 className="text-sm font-bold text-vew-navy">
          {editingDesign ? "Edit Design / ಡಿಸೈನ್ ಸಂಪಾದಿಸಿ" : "Add Design / ಡಿಸೈನ್ ಸೇರಿಸಿ"}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Multi-Image Upload */}
        <div>
          <Label className="text-xs mb-2 block">
            Design Images / ಚಿತ್ರಗಳು{" "}
            <span className="text-muted-foreground font-normal">(max 10)</span>
          </Label>

          {/* Image grid thumbnails */}
          {displayImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-2">
              {displayImages.map((src, idx) => (
                <div
                  key={`img-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: image slots are positional
                    idx
                  }`}
                  className="relative aspect-square rounded-lg overflow-hidden bg-vew-sky-light/30 border border-border/60"
                >
                  <img
                    src={src}
                    alt={`Uploaded ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
                    aria-label={`Remove image ${idx + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* Uploading overlay */}
                  {uploadingIndex === idx && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                      <span className="text-[9px] text-white font-medium">
                        {uploadProgress}%
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Add more button */}
              {displayImages.length < 10 && (
                <button
                  type="button"
                  data-ocid="admin.add_design.upload_button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingIndex !== null}
                  className="aspect-square rounded-lg border-2 border-dashed border-vew-sky/40 bg-vew-sky-light/20 flex flex-col items-center justify-center hover:bg-vew-sky-light/40 transition-colors disabled:opacity-50"
                >
                  <ImagePlus className="w-5 h-5 text-vew-sky mb-0.5" />
                  <span className="text-[9px] text-vew-sky font-medium">
                    Add
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Initial upload zone when no images */}
          {displayImages.length === 0 && (
            <button
              type="button"
              data-ocid="admin.add_design.upload_button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingIndex !== null}
              className="w-full h-28 rounded-xl border-2 border-dashed border-vew-sky/40 bg-vew-sky-light/30 flex flex-col items-center justify-center hover:bg-vew-sky-light/50 transition-colors disabled:opacity-60"
            >
              {uploadingIndex !== null ? (
                <div className="flex flex-col items-center gap-2 w-full px-6">
                  <Loader2 className="w-6 h-6 text-vew-sky animate-spin" />
                  <p className="text-xs text-vew-sky font-medium">
                    Uploading... {uploadProgress}%
                  </p>
                  <div className="w-full bg-vew-sky/20 rounded-full h-1">
                    <div
                      className="bg-vew-sky h-1 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-vew-sky mb-1.5" />
                  <p className="text-xs text-vew-sky font-medium">
                    Upload Images (up to 10)
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ಚಿತ್ರಗಳನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಿ
                  </p>
                </>
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            multiple
            className="hidden"
            onChange={handleImagesChange}
          />

          {uploadError && (
            <div
              data-ocid="admin.add_design.upload.error_state"
              className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5 mt-1"
            >
              <X className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-[10px] text-red-700 leading-snug">
                {uploadError}
              </p>
            </div>
          )}
          {displayImages.length === 0 && !editingDesign && (
            <p className="text-[10px] text-amber-600 mt-1 text-center">
              At least one image is required / ಕನಿಷ್ಠ ಒಂದು ಚಿತ್ರ ಅಗತ್ಯ
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            {displayImages.length}/10 images added
          </p>
        </div>

        {/* Category */}
        <div>
          <Label className="text-xs mb-1.5 block">Category / ವರ್ಗ *</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
          >
            <SelectTrigger
              data-ocid="admin.add_design.category.select"
              className="h-10 rounded-xl text-sm"
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Design Code — read-only for edit, auto-preview for new */}
        {editingDesign ? (
          <div>
            <Label className="text-xs mb-1.5 block">Design Code / ಡಿಸೈನ್ ಕೋಡ್</Label>
            <div className="h-10 rounded-xl border border-border/60 bg-muted/30 flex items-center px-3 text-sm text-muted-foreground font-mono">
              {editingDesign.designCode}
            </div>
          </div>
        ) : (
          <div
            data-ocid="admin.add_design.code_preview.panel"
            className="bg-vew-sky-light/40 rounded-xl px-4 py-3"
          >
            {!form.category ? (
              <p className="text-[11px] text-muted-foreground">
                Select a category to see the auto-generated code
              </p>
            ) : nextCodeQuery.isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-vew-sky animate-spin" />
                <p className="text-[11px] text-vew-sky">Generating code...</p>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-vew-sky font-semibold">
                  Auto-generated code:{" "}
                  <span className="font-mono font-bold">
                    {nextCodeQuery.data ?? "—"}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ಸ್ವಯಂ ಕೋಡ್ ನಿಯೋಜಿಸಲಾಗುವುದು
                </p>
              </>
            )}
          </div>
        )}

        {/* Work Type */}
        <div>
          <Label className="text-xs mb-1.5 block">Work Type / ಕೆಲಸದ ವಿಧ</Label>
          <Input
            data-ocid="admin.add_design.worktype.input"
            value={form.workType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, workType: e.target.value }))
            }
            placeholder="e.g. Zari Work, Thread Work"
            className="h-10 text-sm rounded-xl"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between bg-vew-sky-light/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-vew-navy">Trending</p>
                <p className="text-[10px] text-muted-foreground">ಟ್ರೆಂಡಿಂಗ್</p>
              </div>
            </div>
            <Switch
              data-ocid="admin.add_design.trending.switch"
              checked={form.isTrending}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, isTrending: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between bg-pink-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              <div>
                <p className="text-sm font-medium text-vew-navy">Bridal</p>
                <p className="text-[10px] text-muted-foreground">ಮದುವೆ ಡಿಸೈನ್</p>
              </div>
            </div>
            <Switch
              data-ocid="admin.add_design.bridal.switch"
              checked={form.isBridal}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, isBridal: v }))
              }
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-border/60 flex gap-3 flex-shrink-0">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          data-ocid="admin.add_design.submit_button"
          onClick={() => onSave(form)}
          disabled={isPending || uploadingIndex !== null}
          className="flex-1 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : editingDesign ? (
            "Update"
          ) : (
            "Add Design"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Bulk Upload Panel ────────────────────────────────────────────────────────

interface BulkFile {
  file: File;
  preview: string;
  uploadedUrl: string | null;
  status: "pending" | "uploading" | "done" | "error";
}

// ─── Unified Upload Panel ─────────────────────────────────────────────────────
// Combines single-image Add Design form and Bulk Upload in one scrollable view.

function UnifiedUploadPanel() {
  // ── Single design form state ──────────────────────────────────────────────
  const [form, setForm] = useState<DesignFormData>(emptyDesignForm);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);

  const { uploadImage: uploadSingleImage } = useUploadImage();
  const createDesign = useCreateDesign();
  const nextCodeQuery = useGetNextDesignCode(form.category);

  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
  const MAX_FILE_SIZE_MB = 10;

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const invalidType = files.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalidType) {
      toast.error(
        `"${invalidType.name}" is not supported. Please upload PNG, JPG or JPEG images only.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const oversized = files.find(
      (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024,
    );
    if (oversized) {
      toast.error(
        `"${oversized.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit. Please use a smaller image.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const remaining = 10 - form.imageUrls.length;
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.error(`Max 10 images. Only ${remaining} slot(s) remaining.`);
    }

    setUploadError("");

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      const localPreview = URL.createObjectURL(file);
      const uploadSlotIndex = form.imageUrls.length + i;

      setLocalPreviews((prev) => [...prev, localPreview]);
      setUploadingIndex(uploadSlotIndex);
      setUploadProgress(0);

      try {
        const url = await uploadSingleImage(file, (pct) =>
          setUploadProgress(pct),
        );
        setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
        setLocalPreviews((prev) => {
          const updated = [...prev];
          const idx = updated.indexOf(localPreview);
          if (idx !== -1) updated[idx] = url;
          return updated;
        });
        setUploadProgress(100);
      } catch (err) {
        const realMsg = err instanceof Error ? err.message : String(err);
        setUploadError(realMsg);
        setLocalPreviews((prev) => prev.filter((p) => p !== localPreview));
        URL.revokeObjectURL(localPreview);
      }
    }

    setUploadingIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setLocalPreviews((prev) => {
      const removed = prev[index];
      if (removed?.startsWith("blob:")) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== index);
    });
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const displayImages =
    localPreviews.length > 0 ? localPreviews : form.imageUrls;

  const handleSaveSingleDesign = async () => {
    if (!form.category) {
      toast.error("Category is required");
      return;
    }
    if (form.imageUrls.length === 0) {
      toast.error(
        "Please upload at least one design image / ಕನಿಷ್ಠ ಒಂದು ಚಿತ್ರ ಅಪ್ಲೋಡ್ ಮಾಡಿ",
      );
      return;
    }
    try {
      const assignedCode = await createDesign.mutateAsync({
        category: form.category,
        workType: form.workType,
        imageUrls: form.imageUrls,
        isBridal: form.isBridal,
        isTrending: form.isTrending,
      });
      toast.success(`Design added: ${assignedCode} / ಡಿಸೈನ್ ಸೇರಿಸಲಾಗಿದೆ`);
      // Reset form after successful save
      setForm(emptyDesignForm);
      setLocalPreviews([]);
      setUploadError("");
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to save design: ${reason}`);
    }
  };

  // ── Bulk upload state ─────────────────────────────────────────────────────
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [bulkFiles, setBulkFiles] = useState<BulkFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [bulkCategory, setBulkCategory] = useState("All Embroidery Works");

  const { uploadImage: uploadBulkImage } = useUploadImage();
  const createDesignBulk = useCreateDesignBulk();

  const BULK_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
  const BULK_MAX_SIZE_MB = 10;

  const handleBulkFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files ?? []);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";

    const invalidType = allFiles.find(
      (f) => !BULK_ALLOWED_TYPES.includes(f.type),
    );
    if (invalidType) {
      toast.error(
        `"${invalidType.name}" is not a supported format. Only PNG, JPG and JPEG are allowed.`,
      );
      return;
    }

    const oversized = allFiles.find(
      (f) => f.size > BULK_MAX_SIZE_MB * 1024 * 1024,
    );
    if (oversized) {
      toast.error(
        `"${oversized.name}" exceeds ${BULK_MAX_SIZE_MB} MB. Please resize or remove that image.`,
      );
      return;
    }

    const files = allFiles.slice(0, 500);
    const newFiles: BulkFile[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploadedUrl: null,
      status: "pending",
    }));
    setBulkFiles(newFiles);
    setIsDone(false);
    setErrorMsg("");
    setUploadedCount(0);
  };

  const handleUploadAll = async () => {
    if (!bulkFiles.length) return;
    setIsUploading(true);
    setUploadedCount(0);
    setErrorMsg("");
    setIsDone(false);

    const batchSize = 3;
    const results: BulkFile[] = [...bulkFiles];

    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item, batchIdx) => {
          const globalIdx = i + batchIdx;
          results[globalIdx] = { ...results[globalIdx], status: "uploading" };
          setBulkFiles([...results]);
          try {
            const url = await uploadBulkImage(item.file);
            results[globalIdx] = {
              ...results[globalIdx],
              uploadedUrl: url,
              status: "done",
            };
          } catch (err) {
            console.error(`Bulk upload failed for "${item.file.name}":`, err);
            results[globalIdx] = { ...results[globalIdx], status: "error" };
          }
          setUploadedCount((c) => c + 1);
          setBulkFiles([...results]);
        }),
      );
    }

    const successfulEntries = results
      .filter((f) => f.status === "done" && f.uploadedUrl)
      .map((f) => ({
        imageUrl: f.uploadedUrl as string,
        category: bulkCategory,
      }));

    const errorCount = results.filter((f) => f.status === "error").length;

    if (successfulEntries.length > 0) {
      try {
        const { savedCount, failedCount, errors } =
          await createDesignBulk.mutateAsync(successfulEntries);
        const parts: string[] = [];
        if (savedCount > 0)
          parts.push(
            `${savedCount} design${savedCount !== 1 ? "s" : ""} saved`,
          );
        if (failedCount > 0) parts.push(`${failedCount} failed to save`);
        if (errorCount > 0)
          parts.push(
            `${errorCount} file${errorCount !== 1 ? "s" : ""} failed to upload`,
          );
        toast.success(`${parts.join(", ")}.`);
        setIsDone(true);
        const msgParts: string[] = [];
        if (errorCount > 0) {
          msgParts.push(
            `${errorCount} file${errorCount !== 1 ? "s" : ""} failed to upload (see red tiles above).`,
          );
        }
        if (failedCount > 0 && errors.length > 0) {
          msgParts.push(
            `${failedCount} design${failedCount !== 1 ? "s" : ""} could not be saved. Reasons: ${errors.join(" | ")}`,
          );
        }
        if (msgParts.length > 0) setErrorMsg(msgParts.join(" "));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setErrorMsg(`Failed to save designs: ${errMsg}`);
      }
    } else {
      setErrorMsg(
        "All image uploads failed. If every tile shows an auth error, please log out, refresh the page, and log in again before retrying.",
      );
    }

    setIsUploading(false);
  };

  const handleBulkClear = () => {
    for (const f of bulkFiles) URL.revokeObjectURL(f.preview);
    setBulkFiles([]);
    setIsDone(false);
    setErrorMsg("");
    setUploadedCount(0);
  };

  const bulkProgress =
    bulkFiles.length > 0 ? (uploadedCount / bulkFiles.length) * 100 : 0;

  return (
    <div
      data-ocid="admin.unified_upload.section"
      className="flex flex-col overflow-y-auto"
    >
      {/* ── Section 1: Add Single Design ────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <ImagePlus className="w-4 h-4 text-vew-sky" />
          <h3 className="text-sm font-bold text-vew-navy">
            Add Single Design / ಒಂದು ಡಿಸೈನ್ ಸೇರಿಸಿ
          </h3>
        </div>
      </div>

      {/* Single design form body */}
      <div className="px-4 space-y-4 pb-2">
        {/* Multi-Image Upload */}
        <div>
          <Label className="text-xs mb-2 block">
            Design Images / ಚಿತ್ರಗಳು{" "}
            <span className="text-muted-foreground font-normal">(max 10)</span>
          </Label>

          {displayImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-2">
              {displayImages.map((src, idx) => (
                <div
                  key={`single-img-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional
                    idx
                  }`}
                  className="relative aspect-square rounded-lg overflow-hidden bg-vew-sky-light/30 border border-border/60"
                >
                  <img
                    src={src}
                    alt={`Uploaded ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
                    aria-label={`Remove image ${idx + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {uploadingIndex === idx && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                      <span className="text-[9px] text-white font-medium">
                        {uploadProgress}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {displayImages.length < 10 && (
                <button
                  type="button"
                  data-ocid="admin.upload.single.upload_button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingIndex !== null}
                  className="aspect-square rounded-lg border-2 border-dashed border-vew-sky/40 bg-vew-sky-light/20 flex flex-col items-center justify-center hover:bg-vew-sky-light/40 transition-colors disabled:opacity-50"
                >
                  <ImagePlus className="w-5 h-5 text-vew-sky mb-0.5" />
                  <span className="text-[9px] text-vew-sky font-medium">
                    Add
                  </span>
                </button>
              )}
            </div>
          )}

          {displayImages.length === 0 && (
            <button
              type="button"
              data-ocid="admin.upload.single.upload_button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingIndex !== null}
              className="w-full h-28 rounded-xl border-2 border-dashed border-vew-sky/40 bg-vew-sky-light/30 flex flex-col items-center justify-center hover:bg-vew-sky-light/50 transition-colors disabled:opacity-60"
            >
              {uploadingIndex !== null ? (
                <div className="flex flex-col items-center gap-2 w-full px-6">
                  <Loader2 className="w-6 h-6 text-vew-sky animate-spin" />
                  <p className="text-xs text-vew-sky font-medium">
                    Uploading... {uploadProgress}%
                  </p>
                  <div className="w-full bg-vew-sky/20 rounded-full h-1">
                    <div
                      className="bg-vew-sky h-1 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-vew-sky mb-1.5" />
                  <p className="text-xs text-vew-sky font-medium">
                    Upload Images (up to 10)
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ಚಿತ್ರಗಳನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಿ
                  </p>
                </>
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            multiple
            className="hidden"
            onChange={handleImagesChange}
          />

          {uploadError && (
            <div
              data-ocid="admin.upload.single.error_state"
              className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5 mt-1"
            >
              <X className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-[10px] text-red-700 leading-snug">
                {uploadError}
              </p>
            </div>
          )}
          {displayImages.length === 0 && (
            <p className="text-[10px] text-amber-600 mt-1 text-center">
              At least one image is required / ಕನಿಷ್ಠ ಒಂದು ಚಿತ್ರ ಅಗತ್ಯ
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            {displayImages.length}/10 images added
          </p>
        </div>

        {/* Category */}
        <div>
          <Label className="text-xs mb-1.5 block">Category / ವರ್ಗ *</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
          >
            <SelectTrigger
              data-ocid="admin.upload.single.category.select"
              className="h-10 rounded-xl text-sm"
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto code preview */}
        <div
          data-ocid="admin.upload.single.code_preview.panel"
          className="bg-vew-sky-light/40 rounded-xl px-4 py-3"
        >
          {!form.category ? (
            <p className="text-[11px] text-muted-foreground">
              Select a category to see the auto-generated code
            </p>
          ) : nextCodeQuery.isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-vew-sky animate-spin" />
              <p className="text-[11px] text-vew-sky">Generating code...</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-vew-sky font-semibold">
                Auto-generated code:{" "}
                <span className="font-mono font-bold">
                  {nextCodeQuery.data ?? "—"}
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                ಸ್ವಯಂ ಕೋಡ್ ನಿಯೋಜಿಸಲಾಗುವುದು
              </p>
            </>
          )}
        </div>

        {/* Work Type */}
        <div>
          <Label className="text-xs mb-1.5 block">Work Type / ಕೆಲಸದ ವಿಧ</Label>
          <Input
            data-ocid="admin.upload.single.worktype.input"
            value={form.workType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, workType: e.target.value }))
            }
            placeholder="e.g. Zari Work, Thread Work"
            className="h-10 text-sm rounded-xl"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between bg-vew-sky-light/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-vew-navy">Trending</p>
                <p className="text-[10px] text-muted-foreground">ಟ್ರೆಂಡಿಂಗ್</p>
              </div>
            </div>
            <Switch
              data-ocid="admin.upload.single.trending.switch"
              checked={form.isTrending}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, isTrending: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between bg-pink-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              <div>
                <p className="text-sm font-medium text-vew-navy">Bridal</p>
                <p className="text-[10px] text-muted-foreground">ಮದುವೆ ಡಿಸೈನ್</p>
              </div>
            </div>
            <Switch
              data-ocid="admin.upload.single.bridal.switch"
              checked={form.isBridal}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, isBridal: v }))
              }
            />
          </div>
        </div>

        {/* Save button */}
        <Button
          data-ocid="admin.upload.single.submit_button"
          onClick={handleSaveSingleDesign}
          disabled={createDesign.isPending || uploadingIndex !== null}
          className="w-full h-11 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark font-semibold"
        >
          {createDesign.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Add Design / ಡಿಸೈನ್ ಸೇರಿಸಿ"
          )}
        </Button>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="mx-4 my-4 border-t border-border/60" />

      {/* ── Section 2: Bulk Upload ───────────────────────────────────────────── */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-vew-sky" />
          <h3 className="text-sm font-bold text-vew-navy">
            Bulk Upload / ಬಲ್ಕ್ ಅಪ್ಲೋಡ್
          </h3>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-4">
        <div className="bg-vew-sky-light/30 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground leading-snug">
            Upload up to 500 images at once. Design codes are auto-generated for
            each image based on the selected category.
          </p>
        </div>

        {/* Category selector */}
        <div>
          <Label className="text-xs mb-1.5 block">
            Category for all images / ಎಲ್ಲ ಚಿತ್ರಗಳಿಗೆ ವರ್ಗ
          </Label>
          <Select value={bulkCategory} onValueChange={setBulkCategory}>
            <SelectTrigger
              data-ocid="admin.upload.bulk.category.select"
              className="h-10 rounded-xl text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drop zone */}
        {bulkFiles.length === 0 ? (
          <button
            type="button"
            data-ocid="admin.upload.bulk.dropzone"
            onClick={() => bulkFileInputRef.current?.click()}
            className="w-full h-36 rounded-xl border-2 border-dashed border-vew-sky/40 bg-vew-sky-light/20 flex flex-col items-center justify-center hover:bg-vew-sky-light/40 transition-colors gap-2"
          >
            <Upload className="w-8 h-8 text-vew-sky" />
            <p className="text-sm font-semibold text-vew-sky">
              Select up to 500 images
            </p>
            <p className="text-[10px] text-muted-foreground">
              Tap to browse files / ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ
            </p>
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-vew-navy">
                {bulkFiles.length} file{bulkFiles.length !== 1 ? "s" : ""}{" "}
                selected
              </p>
              <button
                type="button"
                onClick={handleBulkClear}
                disabled={isUploading}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            </div>

            {isUploading && (
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>
                    Uploading {uploadedCount}/{bulkFiles.length}...
                  </span>
                  <span>{Math.round(bulkProgress)}%</span>
                </div>
                <Progress
                  data-ocid="admin.upload.bulk.loading_state"
                  value={bulkProgress}
                  className="h-2 rounded-full"
                />
              </div>
            )}

            {isDone && (
              <div
                data-ocid="admin.upload.bulk.success_state"
                className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-700">
                    Upload complete!
                  </p>
                  <p className="text-[10px] text-green-600">
                    {bulkFiles.filter((f) => f.status === "done").length}{" "}
                    designs added successfully
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                data-ocid="admin.upload.bulk.error_state"
                className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-3"
              >
                <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700">{errorMsg}</p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-1.5 max-h-60 overflow-y-auto mb-3">
              {bulkFiles.map((item, idx) => (
                <div
                  key={`bulk-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional
                    idx
                  }`}
                  className="relative aspect-square rounded-lg overflow-hidden bg-vew-sky-light/30"
                >
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                  {item.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                  {item.status === "done" && (
                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {item.status === "error" && (
                    <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!isDone && (
              <Button
                data-ocid="admin.upload.bulk.upload_button"
                onClick={handleUploadAll}
                disabled={isUploading || createDesignBulk.isPending}
                className="w-full h-12 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark font-semibold gap-2"
              >
                {isUploading || createDesignBulk.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {createDesignBulk.isPending
                      ? "Saving designs..."
                      : `Uploading ${uploadedCount}/${bulkFiles.length}...`}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload All {bulkFiles.length} Images
                  </>
                )}
              </Button>
            )}

            {isDone && (
              <Button
                variant="outline"
                onClick={handleBulkClear}
                className="w-full rounded-xl border-vew-sky text-vew-sky mt-2"
              >
                Upload More Images / ಇನ್ನಷ್ಟು ಅಪ್ಲೋಡ್ ಮಾಡಿ
              </Button>
            )}
          </div>
        )}

        <input
          ref={bulkFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          multiple
          className="hidden"
          onChange={handleBulkFilesChange}
        />

        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/60">
          <p className="text-[10px] text-amber-700 leading-relaxed">
            <strong>Auto settings per image:</strong>
            <br />
            Category: {bulkCategory} · Work Type: auto-assigned
            <br />
            Trending: Off · Bridal: Off
            <br />
            Design Code: auto-generated (e.g. VEW-AE-001, VEW-AE-002...)
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Screen (main) ──────────────────────────────────────────────────────

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const { isLoggedIn, logout, loginMethod, adminEmail, adminName } =
    useAdminAuth();
  // Local flag so the component re-renders immediately on successful login
  // without waiting for a full sessionStorage round-trip.
  const [loggedInLocal, setLoggedInLocal] = useState(isLoggedIn);

  const [activeTab, setActiveTab] = useState<AdminTab>("designs");
  const [showForm, setShowForm] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [deleteDesignTarget, setDeleteDesignTarget] = useState<Design | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const allDesignsQuery = useAllDesigns();
  const customersQuery = useAllCustomers();
  const createDesign = useCreateDesign();
  const updateDesign = useUpdateDesign();
  const deleteDesign = useDeleteDesign();
  const setTrending = useSetTrending();
  const setBridal = useSetBridal();
  const deleteCustomerMutation = useDeleteCustomer();

  const designs = allDesignsQuery.data ?? [];

  const filteredDesigns = designs.filter(
    (d) =>
      d.designCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!loggedInLocal) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border/60">
          <button type="button" onClick={onBack} className="p-1">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="text-sm font-bold text-vew-navy">Admin Panel</h2>
        </div>
        <AdminLogin
          onBack={onBack}
          onLoginSuccess={() => setLoggedInLocal(true)}
        />
      </div>
    );
  }

  const handleSaveDesign = async (form: DesignFormData) => {
    if (!form.category) {
      toast.error("Category is required");
      return;
    }
    // For new designs (not editing), require at least one image
    if (!editingDesign && form.imageUrls.length === 0) {
      toast.error(
        "Please upload at least one design image / ಕನಿಷ್ಠ ಒಂದು ಚಿತ್ರ ಅಪ್ಲೋಡ್ ಮಾಡಿ",
      );
      return;
    }
    try {
      if (editingDesign) {
        await updateDesign.mutateAsync({
          id: editingDesign.id,
          designCode: editingDesign.designCode,
          category: form.category,
          workType: form.workType,
          imageUrls: form.imageUrls,
        });
        await Promise.all([
          setTrending.mutateAsync({
            id: editingDesign.id,
            flag: form.isTrending,
          }),
          setBridal.mutateAsync({ id: editingDesign.id, flag: form.isBridal }),
        ]);
        toast.success("Design updated / ಡಿಸೈನ್ ನವೀಕರಿಸಲಾಗಿದೆ");
      } else {
        const assignedCode = await createDesign.mutateAsync({
          category: form.category,
          workType: form.workType,
          imageUrls: form.imageUrls,
          isBridal: form.isBridal,
          isTrending: form.isTrending,
        });
        toast.success(`Design added: ${assignedCode} / ಡಿಸೈನ್ ಸೇರಿಸಲಾಗಿದೆ`);
        // Switch to the designs list so admin can immediately see the new entry
        setActiveTab("designs");
      }
      setShowForm(false);
      setEditingDesign(null);
    } catch (err) {
      console.error("Save design error:", err);
      const reason = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to save design: ${reason}`);
    }
  };

  const handleDeleteDesign = async () => {
    if (!deleteDesignTarget) return;
    try {
      await deleteDesign.mutateAsync(deleteDesignTarget.id);
      toast.success("Design deleted / ಡಿಸೈನ್ ತೆಗೆಯಲಾಗಿದೆ");
      setDeleteDesignTarget(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleTrending = async (design: Design) => {
    try {
      await setTrending.mutateAsync({
        id: design.id,
        flag: !design.isTrending,
      });
      toast.success(
        design.isTrending ? "Removed from trending" : "Marked as trending",
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleToggleBridal = async (design: Design) => {
    try {
      await setBridal.mutateAsync({ id: design.id, flag: !design.isBridal });
      toast.success(
        design.isBridal ? "Removed bridal tag" : "Marked as bridal",
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  // Show form panel when editing/adding
  if (showForm) {
    return (
      <div className="flex-1 flex flex-col">
        <DesignFormPanel
          editingDesign={editingDesign}
          onSave={handleSaveDesign}
          onCancel={() => {
            setShowForm(false);
            setEditingDesign(null);
          }}
          isPending={
            createDesign.isPending ||
            updateDesign.isPending ||
            setTrending.isPending ||
            setBridal.isPending
          }
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border/60 flex-shrink-0">
        <button type="button" onClick={onBack} className="p-1">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <Shield className="w-4 h-4 text-vew-sky" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-vew-navy">Admin Panel</h2>
          {loginMethod === "google" && adminEmail && (
            <p className="text-[10px] text-vew-sky truncate">
              {adminName || adminEmail}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            setLoggedInLocal(false);
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60 flex-shrink-0">
        {[
          { id: "designs" as AdminTab, label: "Designs", kannada: "ಡಿಸೈನ್ಸ್" },
          { id: "upload" as AdminTab, label: "Upload", kannada: "ಅಪ್ಲೋಡ್" },
          {
            id: "customers" as AdminTab,
            label: "Customers",
            kannada: "ಗ್ರಾಹಕರು",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-ocid={
              tab.id === "upload" ? "admin.upload.tab" : `admin.${tab.id}.tab`
            }
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2.5 text-center transition-colors ${
              activeTab === tab.id
                ? "text-vew-sky border-b-2 border-vew-sky"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="text-xs font-semibold whitespace-nowrap">
              {tab.label}
            </div>
            <div className="text-[9px] opacity-60">{tab.kannada}</div>
          </button>
        ))}
      </div>

      {/* Auth Status Banner — shows token health without needing DevTools */}
      <AuthStatusBanner />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Designs Tab */}
        {activeTab === "designs" && (
          <div>
            <div className="px-4 pt-3 pb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-ocid="admin.designs.search_input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search designs..."
                  className="pl-9 h-9 rounded-xl text-sm"
                />
              </div>
              <Button
                data-ocid="admin.designs.primary_button"
                onClick={() => {
                  setEditingDesign(null);
                  setShowForm(true);
                }}
                size="sm"
                className="h-9 rounded-xl bg-vew-sky text-white hover:bg-vew-sky-dark px-3 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {allDesignsQuery.isLoading ? (
              <div className="px-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="px-4 pb-6 space-y-2">
                {filteredDesigns.map((design, idx) => (
                  <div
                    key={design.id.toString()}
                    data-ocid={`admin.designs.item.${idx + 1}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-3 py-2.5"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-vew-sky-light/40 flex-shrink-0 relative">
                      {design.imageUrls?.[0] ? (
                        <img
                          src={design.imageUrls[0]}
                          alt={design.designCode}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            No img
                          </span>
                        </div>
                      )}
                      {/* Multi-image badge */}
                      {(design.imageUrls?.length ?? 0) > 1 && (
                        <div className="absolute bottom-0 right-0 bg-vew-sky text-white text-[8px] font-bold px-1 rounded-tl-md">
                          {design.imageUrls.length}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-vew-navy truncate">
                        {design.designCode}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {design.category}
                      </p>
                      <div className="flex gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTrending(design)}
                          className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full transition-colors ${
                            design.isTrending
                              ? "bg-orange-100 text-orange-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Flame className="w-2.5 h-2.5" />
                          {design.isTrending ? "Trending" : "Not Trending"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleBridal(design)}
                          className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full transition-colors ${
                            design.isBridal
                              ? "bg-pink-100 text-pink-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Heart className="w-2.5 h-2.5" />
                          {design.isBridal ? "Bridal" : "Not Bridal"}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        data-ocid={`admin.designs.edit_button.${idx + 1}`}
                        onClick={() => {
                          setEditingDesign(design);
                          setShowForm(true);
                        }}
                        className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center hover:bg-blue-100"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                      </button>
                      <button
                        type="button"
                        data-ocid={`admin.designs.delete_button.${idx + 1}`}
                        onClick={() => setDeleteDesignTarget(design)}
                        className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredDesigns.length === 0 && (
                  <div
                    data-ocid="admin.designs.empty_state"
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No designs found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upload Tab — unified Add Design + Bulk Upload */}
        {activeTab === "upload" && <UnifiedUploadPanel />}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <div>
            <div className="px-4 pt-3 pb-2">
              <p className="text-xs text-muted-foreground">
                {(customersQuery.data ?? []).length} customer
                {(customersQuery.data ?? []).length !== 1 ? "s" : ""} registered
              </p>
            </div>

            {customersQuery.isLoading ? (
              <div className="px-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="px-4 pb-6 space-y-2">
                {(customersQuery.data ?? []).map((c: Customer, idx) => (
                  <div
                    key={c.id.toString()}
                    data-ocid={`admin.customers.item.${idx + 1}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-3.5 py-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-vew-sky-light flex items-center justify-center flex-shrink-0">
                      <span className="text-vew-sky font-bold text-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-vew-navy truncate">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.phone}
                      </p>
                      {c.address && (
                        <p className="text-[10px] text-muted-foreground/70 truncate">
                          {c.address}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right mr-1">
                      <p className="text-[9px] text-muted-foreground">Added</p>
                      <p className="text-[9px] text-vew-navy font-medium">
                        {new Date(
                          Number(c.createdAt) / 1_000_000,
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid={`admin.customers.delete_button.${idx + 1}`}
                      onClick={async () => {
                        try {
                          await deleteCustomerMutation.mutateAsync(c.id);
                          toast.success("Customer deleted");
                        } catch {
                          toast.error("Failed to delete");
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}

                {(customersQuery.data ?? []).length === 0 && (
                  <div
                    data-ocid="admin.customers.empty_state"
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    No customers yet
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Customers added via the Customers tab will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteDesignTarget}
        onOpenChange={(o) => !o && setDeleteDesignTarget(null)}
      >
        <AlertDialogContent
          data-ocid="admin.delete_design.dialog"
          className="max-w-[90vw] rounded-2xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Design?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteDesignTarget?.designCode}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.delete_design.cancel_button"
              className="rounded-xl"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.delete_design.confirm_button"
              onClick={handleDeleteDesign}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
