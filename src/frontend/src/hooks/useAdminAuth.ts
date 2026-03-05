import { useState } from "react";

const ADMIN_USERNAME = "akhilesh18";
const ADMIN_PASSWORD = "Theakhilesh18";
const SESSION_KEY = "vew_admin_logged_in";

export function useAdminAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });

  const login = (username: string, password: string): boolean => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  };

  return { isLoggedIn, login, logout };
}
