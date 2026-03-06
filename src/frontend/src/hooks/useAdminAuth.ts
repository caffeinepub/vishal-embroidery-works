import { useState } from "react";

const ADMIN_USERNAME = "akhilesh18";
const ADMIN_PASSWORD = "Theakhilesh18";
const SESSION_KEY = "vew_admin_logged_in";
const GMAIL_EMAIL_KEY = "vew_admin_gmail_email";
const GMAIL_NAME_KEY = "vew_admin_gmail_name";

// Admin email whitelist — only these Gmail addresses can access the Admin Panel
export const ADMIN_EMAIL_WHITELIST: string[] = [
  "akhileshsworks@gmail.com",
  // Add more admin Gmail addresses here
];

export type LoginMethod = "password" | "google" | null;

export function useAdminAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return (
      sessionStorage.getItem(SESSION_KEY) === "true" ||
      !!sessionStorage.getItem(GMAIL_EMAIL_KEY)
    );
  });

  const [loginMethod, setLoginMethod] = useState<LoginMethod>(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") return "password";
    if (sessionStorage.getItem(GMAIL_EMAIL_KEY)) return "google";
    return null;
  });

  const [adminEmail, setAdminEmail] = useState<string>(
    () => sessionStorage.getItem(GMAIL_EMAIL_KEY) ?? "",
  );

  const [adminName, setAdminName] = useState<string>(
    () => sessionStorage.getItem(GMAIL_NAME_KEY) ?? "",
  );

  const login = (username: string, password: string): boolean => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsLoggedIn(true);
      setLoginMethod("password");
      return true;
    }
    return false;
  };

  const loginWithGoogle = (email: string, name: string): boolean => {
    const normalizedEmail = email.toLowerCase().trim();
    const isAuthorized = ADMIN_EMAIL_WHITELIST.some(
      (e) => e.toLowerCase().trim() === normalizedEmail,
    );
    if (isAuthorized) {
      sessionStorage.setItem(GMAIL_EMAIL_KEY, email);
      sessionStorage.setItem(GMAIL_NAME_KEY, name);
      setAdminEmail(email);
      setAdminName(name);
      setIsLoggedIn(true);
      setLoginMethod("google");
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(GMAIL_EMAIL_KEY);
    sessionStorage.removeItem(GMAIL_NAME_KEY);
    setIsLoggedIn(false);
    setLoginMethod(null);
    setAdminEmail("");
    setAdminName("");
  };

  return {
    isLoggedIn,
    login,
    loginWithGoogle,
    logout,
    loginMethod,
    adminEmail,
    adminName,
  };
}
