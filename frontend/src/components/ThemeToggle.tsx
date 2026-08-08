import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Premium theme toggle — sits in the top nav.
 * Persists preference via next-themes (localStorage + class on <html>).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={`p-2 rounded-full text-ebs-text-secondary ${className}`}
      >
        <Sun className="h-5 w-5 opacity-40" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`relative p-2 rounded-full text-ebs-text-secondary hover:text-ebs-gold hover:bg-ebs-gold/10 transition-all duration-300 ${className}`}
    >
      <Sun
        className={`h-5 w-5 transition-all duration-300 ${
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0 absolute"
        }`}
      />
      <Moon
        className={`h-5 w-5 transition-all duration-300 ${
          !isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0 absolute"
        }`}
      />
    </button>
  );
}

export default ThemeToggle;
