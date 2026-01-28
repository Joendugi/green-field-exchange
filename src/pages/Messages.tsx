import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import MessagesComponent from "@/components/Messages";
import ThemeToggle from "@/components/ThemeToggle";

const Messages = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await account.get();
                setLoading(false);
            } catch (error) {
                navigate("/auth");
            }
        };

        checkAuth();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="container mx-auto px-4 py-6">
                <MessagesComponent />
            </div>
            <div className="fixed bottom-4 right-4 z-50">
                <ThemeToggle />
            </div>
        </div>
    );
};

export default Messages;
