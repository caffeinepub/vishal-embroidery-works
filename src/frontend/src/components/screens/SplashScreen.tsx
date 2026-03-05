import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 400);
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
            className="mb-6 relative"
          >
            {/* VEW Logo Image */}
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-lg shadow-vew-sky/20 flex items-center justify-center bg-gradient-to-br from-white to-vew-sky-light border border-vew-sky/20">
              <img
                src="/assets/generated/vew-logo.dim_200x200.png"
                alt="VEW Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>
          </motion.div>

          {/* Shop Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="text-center px-8"
          >
            <h1 className="text-2xl font-bold text-vew-navy tracking-tight mb-1">
              Vishal Embroidery Works
            </h1>
            <p className="text-sm text-vew-sky font-medium">
              ವಿಶಾಲ್ ಎಂಬ್ರಾಯ್ಡರಿ ವರ್ಕ್ಸ್
            </p>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="text-xs text-muted-foreground mt-3"
          >
            Design Catalog / ಡಿಸೈನ್ ಕ್ಯಾಟಲಾಗ್
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute bottom-16 flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-vew-sky animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
