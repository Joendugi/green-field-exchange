import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  const dispatchThemeChange = (value: boolean) => {
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { darkMode: value } }));
  };

  const applyTheme = (value: boolean) => {
    if (value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", value ? "dark" : "light");
  };

  useEffect(() => {
    const loadTheme = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Check localStorage for non-logged in users
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
          setDarkMode(true);
          applyTheme(true);
          dispatchThemeChange(true);
        }
        return;
      }

      const { data } = await supabase
        .from("user_settings")
        .select("dark_mode")
        .eq("user_id", session.user.id)
        .single();

      const darkPreference = !!data?.dark_mode;
      setDarkMode(darkPreference);
      applyTheme(darkPreference);
      dispatchThemeChange(darkPreference);
    };

    loadTheme();

    const handleThemeEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ darkMode: boolean }>;
      setDarkMode(customEvent.detail.darkMode);
    };

    window.addEventListener("theme-change", handleThemeEvent as EventListener);
    return () => window.removeEventListener("theme-change", handleThemeEvent as EventListener);
  }, []);

  const toggleTheme = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    applyTheme(newDarkMode);
    dispatchThemeChange(newDarkMode);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { error } = await supabase
        .from("user_settings")
        .update({ dark_mode: newDarkMode })
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Failed to persist theme preference", error);
      }
    } else {
      // Save to localStorage for non-logged in users
      localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    }
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{darkMode ? "Light mode" : "Dark mode"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ThemeToggle;
