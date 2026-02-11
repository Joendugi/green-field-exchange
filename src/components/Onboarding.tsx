<<<<<<< HEAD
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
=======
import { useState } from "react";
import { account, databases } from "@/lib/appwrite";
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Users, MessageSquare, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
  onDismiss?: () => void;
}

const STEP_STORAGE_KEY = "onboarding:step";

const Onboarding = ({ open, onComplete, onDismiss }: OnboardingProps) => {
  const [step, setStep] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = window.localStorage.getItem(STEP_STORAGE_KEY);
    return stored ? Math.min(parseInt(stored, 10) || 0, 4) : 0;
  });

  const steps = [
    {
      title: "Welcome to AgriConnect!",
      description: "Your one-stop platform for agricultural trade and community",
      icon: <Sparkles className="h-16 w-16 text-primary" />,
      content: "Connect with farmers, buyers, and the agricultural community. Let's get you started!",
    },
    {
      title: "Browse the Marketplace",
      description: "Find fresh products from verified farmers",
      icon: <ShoppingCart className="h-16 w-16 text-primary" />,
      content: "Explore a wide variety of agricultural products, compare prices, and place orders directly from farmers.",
    },
    {
      title: "Join the Community",
      description: "Share your experience and connect with others",
      icon: <Users className="h-16 w-16 text-primary" />,
      content: "Follow farmers, share posts, like and comment on community updates. Build your agricultural network!",
    },
    {
      title: "AI-Powered Features",
      description: "Get smart recommendations and price predictions",
      icon: <Sparkles className="h-16 w-16 text-primary" />,
      content: "Use our AI assistant for product recommendations, price predictions, and personalized farming advice.",
    },
    {
      title: "Stay Connected",
      description: "Message buyers and sellers directly",
      icon: <MessageSquare className="h-16 w-16 text-primary" />,
      content: "Communicate with other users through our messaging system. Negotiate deals and build relationships.",
    },
  ];

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STEP_STORAGE_KEY);
    if (stored) {
      setStep(Math.min(parseInt(stored, 10) || 0, steps.length - 1));
    }
  }, [open, steps.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STEP_STORAGE_KEY, step.toString());
  }, [step]);

  const handleComplete = async () => {
    try {
      const user = await account.get().catch(() => null);
      if (!user) return;

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      await databases.updateDocument(
        dbId,
        "profiles",
        user.$id,
        { onboarding_completed: true }
      ).catch(e => console.warn("Failed to sync onboarding to DB", e));

      // Mark in local storage as well for instant feedback
      localStorage.setItem(`onboarding_completed_${user.$id}`, "true");

      onComplete();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STEP_STORAGE_KEY);
      }
      toast.success("Welcome aboard! Enjoy exploring AgriConnect!");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      onComplete();
    }
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  const progress = ((step + 1) / steps.length) * 100;

  const currentStep = steps[step];

  return (
<<<<<<< HEAD
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && open) {
        handleDismiss();
      }
    }}>
=======
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleComplete(); }}>
>>>>>>> f82e77df9b7fe97c8b63fccece12444e06b1f760
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentStep.title}</DialogTitle>
          <DialogDescription>{currentStep.description}</DialogDescription>
        </DialogHeader>
        <div className="mb-4">
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            Step {step + 1} of {steps.length}
          </p>
        </div>
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Skip for now
          </Button>
        </div>
        <div className="flex flex-col items-center space-y-6 py-6">
          {currentStep.icon}
          <p className="text-center text-muted-foreground">{currentStep.content}</p>

          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${idx === step ? "bg-primary w-8" : "bg-muted"
                  }`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleComplete} className="text-muted-foreground">
              Skip Tutorial
            </Button>
          )}
          <div className="flex-1" />
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>Get Started</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Onboarding;
