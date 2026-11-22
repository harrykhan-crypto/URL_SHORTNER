import { useEffect, useState } from "react";

const readSaved = () => {
  try {
    const t = localStorage.getItem("theme");
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
};

const systemPrefersDark = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

/** Light/dark toggle that follows the system until the user picks one. */
const useTheme = () => {
  const [theme, setTheme] = useState(
    () => readSaved() ?? (systemPrefersDark() ? "dark" : "light"),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode: theme just won't be remembered */
    }
  };

  return { theme, toggle };
};

export default useTheme;
