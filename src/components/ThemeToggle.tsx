import { useEffect, useState } from "react";
import { account, databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
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
      try {
        const user = await account.get().catch(() => null);
        if (!user) {
          // Check localStorage for non-logged in users
          const savedTheme = localStorage.getItem("theme");
          if (savedTheme === "dark") {
            setDarkMode(true);
            document.documentElement.classList.add("dark");
          }
          return;
        }

        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const { documents } = await databases.listDocuments(
          dbId,
          "user_settings",
          [Query.equal("user_id", user.$id), Query.limit(1)]
        );

        if (documents.length > 0 && documents[0].dark_mode) {
          setDarkMode(true);
          applyTheme(true);
          dispatchThemeChange(true);
        }
<<<<<<< HEAD
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
=======
      } catch (error) {
        console.error("Error loading theme", error);
      }
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
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

<<<<<<< HEAD
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
=======
    try {
      const user = await account.get().catch(() => null);
      if (user) {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        // Check if settings exist
        const { documents } = await databases.listDocuments(
          dbId,
          "user_settings",
          [Query.equal("user_id", user.$id), Query.limit(1)]
        );

        if (documents.length > 0) {
          await databases.updateDocument(
            dbId,
            "user_settings",
            documents[0].$id,
            { dark_mode: newDarkMode }
          );
        } else {
          await databases.createDocument(
            dbId,
            "user_settings",
            ID.unique(),
            {
              user_id: user.$id,
              dark_mode: newDarkMode
            }
          );
        }
      } else {
        // Save to localStorage for non-logged in users
        localStorage.setItem("theme", newDarkMode ? "dark" : "light");
      }
    } catch (error) {
      console.error("Error saving theme preference", error);
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
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
