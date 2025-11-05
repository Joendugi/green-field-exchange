import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Check localStorage for non-logged in users
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
          setDarkMode(true);
          document.documentElement.classList.add("dark");
        }
        return;
      }

      const { data } = await supabase
        .from("user_settings")
        .select("dark_mode")
        .eq("user_id", session.user.id)
        .single();

      if (data?.dark_mode) {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase
        .from("user_settings")
        .upsert({
          user_id: session.user.id,
          dark_mode: newDarkMode,
        });
    } else {
      // Save to localStorage for non-logged in users
      localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {darkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
};

export default ThemeToggle;
