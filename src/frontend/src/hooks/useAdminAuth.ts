import { useState } from "react";

// Admin PIN — only stored here, never exposed to normal users
const ADMIN_PIN = "7391";
const SESSION_KEY = "vew_admin_logged_in";

export type LoginMethod = "pin" | null;

export function useAdminAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [loginMethod, setLoginMethod] = useState<LoginMethod>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "true" ? "pin" : null;
    } catch {
      return null;
    }
  });

  const loginWithPin = (pin: string): boolean => {
    if (pin === ADMIN_PIN) {
      try {
        sessionStorage.setItem(SESSION_KEY, "true");
      } catch {
        // sessionStorage unavailable — allow login anyway
      }
      setIsLoggedIn(true);
      setLoginMethod("pin");
      return true;
    }
    return false;
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setIsLoggedIn(false);
    setLoginMethod(null);
  };

  return { isLoggedIn, loginWithPin, logout, loginMethod };
}
