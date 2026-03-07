import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Users, MessageSquare, Sparkles, ChevronRight, ChevronLeft, Bot, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
  onDismiss?: () => void;
}

const STEP_STORAGE_KEY = "onboarding:step";

const Onboarding = ({ open, onComplete, onDismiss }: OnboardingProps) => {
  const { user: currentUser, role } = useAuth();
  const updateProfile = useMutation(api.users.updateProfile);

  const commonStart = [
    {
      title: "Welcome to Wakulima!",
      description: "The future of sustainable agricultural trade",
      icon: <Sparkles className="h-16 w-16 text-primary" />,
      content: "Wakulima connects the entire supply chain. Let's show you how to make the most of your new account!",
    }
  ];

  const farmerSteps = [
    {
      title: "List Your Harvest",
      description: "Showcase your high-quality produce",
      icon: <ShoppingCart className="h-16 w-16 text-primary" />,
      content: "Easily add products, set competitive prices, and manage your inventory in real-time. Reach thousands of buyers instantly.",
    },
    {
      title: "Secure Sales & Tracking",
      description: "Manage your orders with confidence",
      icon: <CheckCircle2 className="h-16 w-16 text-primary" />,
      content: "Receive notifications for new orders, track payments, and manage your delivery schedule through your unified dashboard.",
    },
    {
      title: "AI Farming Insights",
      description: "Optimize your yield and pricing",
      icon: <Bot className="h-16 w-16 text-primary" />,
      content: "Use our AI assistant to get localized price predictions, crop advice, and market demand insights tailored to your region.",
    }
  ];


  const commonEnd = [
    {
      title: "Stay Connected",
      description: "Direct community and messaging",
      icon: <MessageSquare className="h-16 w-16 text-primary" />,
      content: "Message farmers or buyers directly to negotiate deals, share agricultural updates on the Social feed, and build your network.",
    }
  ];

  const steps = [
    ...commonStart,
    ...farmerSteps,
    ...commonEnd
  ];

  const [step, setStep] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = window.localStorage.getItem(STEP_STORAGE_KEY);
    return stored ? Math.min(parseInt(stored, 10) || 0, steps.length - 1) : 0;
  });

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
      if (currentUser) {
        await updateProfile({ onboarding_completed: true });
        // Mark in local storage as well for instant feedback
        localStorage.setItem(`onboarding_completed_${currentUser._id}`, "true");
      }

      onComplete();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STEP_STORAGE_KEY);
      }
      toast.success("Welcome aboard! Enjoy exploring Wakulima!");
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
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && open) {
        handleDismiss();
      }
    }}>
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
        <div className="flex flex-col items-center space-y-4 py-4 md:py-6">
          <div className="p-4 rounded-full bg-primary/5 mb-2">
            {currentStep.icon}
          </div>
          <p className="text-center text-sm md:text-base text-muted-foreground leading-relaxed px-2">
            {currentStep.content}
          </p>

          <div className="flex gap-1.5 pt-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? "bg-primary w-6 md:w-8" : "bg-muted w-1.5"
                  }`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="px-2">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="px-2 text-muted-foreground">
              Skip for now
            </Button>
          )}
          <div className="flex-1" />
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="min-w-[100px]">
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="min-w-[120px] bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Onboarding;
