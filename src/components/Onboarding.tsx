import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const Onboarding = ({ open, onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(0);

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

  const handleComplete = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", session.user.id);

      if (error) throw error;
      onComplete();
      toast.success("Welcome aboard! Enjoy exploring AgriConnect!");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      onComplete();
    }
  };

  const currentStep = steps[step];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentStep.title}</DialogTitle>
          <DialogDescription>{currentStep.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-6">
          {currentStep.icon}
          <p className="text-center text-muted-foreground">{currentStep.content}</p>
          
          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === step ? "bg-primary w-8" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
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
