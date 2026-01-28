import { useEffect, useState } from "react";
import { account, databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

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
          document.documentElement.classList.add("dark");
        }
      } catch (error) {
        console.error("Error loading theme", error);
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
