"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-md bg-secondary/50 animate-pulse" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md hover:bg-secondary border border-border/40 transition-colors flex items-center justify-center text-foreground/80 hover:text-foreground"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-amber-400 transition-all scale-100 rotate-0" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-900 transition-all scale-100 rotate-0" />
      )}
    </button>
  );
}
