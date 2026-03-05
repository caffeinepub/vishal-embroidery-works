import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

interface ContactScreenProps {
  onAdminClick: () => void;
}

export function ContactScreen({ onAdminClick }: ContactScreenProps) {
  const handleWhatsApp = () => {
    window.open("https://wa.me/917353315706", "_blank");
  };

  const handleCall = () => {
    window.open("tel:+917353315706");
  };

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      {/* Shop Header */}
      <div className="relative mx-4 mt-4 mb-5 rounded-2xl overflow-hidden bg-gradient-to-br from-vew-sky to-vew-sky-dark p-5">
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
            <img
              src="/assets/generated/vew-logo.dim_200x200.png"
              alt="VEW"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-white text-lg font-bold mb-0.5">
            Vishal Embroidery Works
          </h1>
          <p className="text-white/80 text-sm">ವಿಶಾಲ್ ಎಂಬ್ರಾಯ್ಡರಿ ವರ್ಕ್ಸ್</p>
        </div>
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute right-4 bottom-4 w-16 h-16 rounded-full bg-white/5" />
      </div>

      {/* Contact Info Cards */}
      <div className="px-4 space-y-3 mb-5">
        {/* Address */}
        <div className="flex items-start gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-4 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-vew-sky-light flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-4.5 h-4.5 text-vew-sky" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              Address / ವಿಳಾಸ
            </p>
            <p className="text-sm font-medium text-vew-navy leading-snug">
              Nehru Chowk Road, opposite
            </p>
            <p className="text-sm font-medium text-vew-navy leading-snug">
              Brijesh Medical, Ainapur
            </p>
          </div>
        </div>

        {/* Phone */}
        <button
          type="button"
          onClick={handleCall}
          className="w-full flex items-start gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-4 py-3.5 text-left hover:bg-vew-sky-light/30 transition-colors active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Phone className="w-4.5 h-4.5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">Phone / ಫೋನ್</p>
            <p className="text-sm font-semibold text-vew-navy">
              +91 73533 15706
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
        </button>

        {/* Hours */}
        <div className="flex items-start gap-3 bg-white rounded-xl border border-border/60 shadow-xs px-4 py-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Clock className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Working Hours / ಕೆಲಸದ ಸಮಯ
            </p>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-8">
                <p className="text-xs text-vew-navy">Mon – Sat</p>
                <p className="text-xs font-semibold text-vew-navy">
                  9:00 AM – 8:00 PM
                </p>
              </div>
              <div className="flex items-center justify-between gap-8">
                <p className="text-xs text-vew-navy">Sunday</p>
                <p className="text-xs font-semibold text-vew-navy">
                  10:00 AM – 6:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <div className="px-4 mb-5">
        <Button
          data-ocid="contact.whatsapp_button"
          onClick={handleWhatsApp}
          className="w-full h-13 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm gap-2.5 shadow-md shadow-green-500/20"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Chat on WhatsApp / ವಾಟ್ಸ್ಆಪ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ</span>
        </Button>
      </div>

      {/* Services */}
      <div className="px-4 mb-5">
        <p className="text-xs font-semibold text-vew-navy mb-3 uppercase tracking-wider">
          Our Services / ನಮ್ಮ ಸೇವೆಗಳು
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: "🧵", label: "Custom Stitching", kannada: "ಕಸ್ಟಮ್ ಹೊಲಿಗೆ" },
            {
              icon: "✨",
              label: "Embroidery Work",
              kannada: "ಎಂಬ್ರಾಯ್ಡರಿ",
            },
            {
              icon: "👰",
              label: "Bridal Blouse",
              kannada: "ಮದುವೆ ಬ್ಲೌಸ್",
            },
            { icon: "👗", label: "All Designs", kannada: "ಎಲ್ಲಾ ಡಿಸೈನ್ಸ್" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-border/60 shadow-xs p-3 flex items-center gap-2.5"
            >
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-xs font-semibold text-vew-navy">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.kannada}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Link (hidden at bottom) */}
      <div className="px-4">
        <button
          type="button"
          data-ocid="contact.admin_link"
          onClick={onAdminClick}
          className="w-full text-center text-xs text-muted-foreground/40 py-2 hover:text-vew-sky transition-colors"
        >
          Admin Panel
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 mt-2 text-center">
        <p className="text-[10px] text-muted-foreground/60">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-vew-sky hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
