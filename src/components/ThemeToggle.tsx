import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

const ThemeToggle = () => {
  const { isAuthenticated } = useAuth();
  const settings = useQuery(api.users.getSettings);
  const updateSettings = useMutation(api.users.updateSettings);
  const [localDarkMode, setLocalDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  const isDarkMode = isAuthenticated && settings ? settings.dark_mode : localDarkMode;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = async () => {
    const newDarkMode = !isDarkMode;

    if (isAuthenticated) {
      try {
        await updateSettings({ dark_mode: newDarkMode });
      } catch (error) {
        console.error("Failed to update theme in Convex", error);
      }
    } else {
      setLocalDarkMode(newDarkMode);
      localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    }

    window.dispatchEvent(new CustomEvent("theme-change", { detail: { darkMode: newDarkMode } }));
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isDarkMode ? "Light mode" : "Dark mode"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ThemeToggle;
