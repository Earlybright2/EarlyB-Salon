import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-full border border-ebs-gold/20 bg-ebs-bg-card hover:bg-ebs-bg-elevated"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="relative h-5 w-5">
        <Sun
          className={`absolute h-5 w-5 transition-all duration-300 ${
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          }`}
        />
        <Moon
          className={`absolute h-5 w-5 transition-all duration-300 ${
            theme === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
