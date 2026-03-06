import { useState } from "react";

// Admin PIN — stored only in this file, never exposed to normal users
const ADMIN_PIN = "7391";
const SESSION_KEY = "vew_admin_logged_in";

export type LoginMethod = "pin" | null;

export function useAdminAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });

  const [loginMethod, setLoginMethod] = useState<LoginMethod>(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") return "pin";
    return null;
  });

  const loginWithPin = (pin: string): boolean => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsLoggedIn(true);
      setLoginMethod("pin");
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
    setLoginMethod(null);
  };

  return {
    isLoggedIn,
    loginWithPin,
    logout,
    loginMethod,
  };
}
