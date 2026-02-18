import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Sprout, AlertCircle, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { signIn } = useAuthActions();
  const updateProfile = useMutation(api.users.updateProfile);
  const requestPasswordReset = useMutation(api.passwordReset.requestPasswordReset);

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer">("buyer");
  const [passwordError, setPasswordError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const finalizeSignUp = async () => {
      if (isAuthenticated && !authLoading) {
        const pendingData = localStorage.getItem("pending_signup_profile");
        if (pendingData) {
          try {
            const { fullName, role, email } = JSON.parse(pendingData);
            await updateProfile({
              full_name: fullName,
              role: role,
              username: email.split("@")[0],
            });
            localStorage.removeItem("pending_signup_profile");
            toast.success("Profile created successfully!");
          } catch (error) {
            console.error("Failed to finalize profile:", error);
            // We don't remove the item so we can retry or the user can try later
          }
        }
        navigate("/");
      }
    };

    finalizeSignUp();
  }, [isAuthenticated, authLoading, navigate, updateProfile]);

  const validatePassword = (pwd: string): boolean => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasLowercase = /[a-z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    const hasSpecialChar = /[-_]/.test(pwd);

    if (pwd.length < minLength) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    if (!hasUppercase) {
      setPasswordError("Password must contain at least one uppercase letter");
      return false;
    }
    if (!hasLowercase) {
      setPasswordError("Password must contain at least one lowercase letter");
      return false;
    }
    if (!hasDigit) {
      setPasswordError("Password must contain at least one digit");
      return false;
    }
    if (!hasSpecialChar) {
      setPasswordError("Password must contain at least one special character (- or _)");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      return;
    }

    setIsLoading(true);

    try {
      // Store pending profile data locally to be processed once authenticated
      localStorage.setItem("pending_signup_profile", JSON.stringify({
        fullName,
        role,
        email
      }));

      await signIn("password", { email, password, flow: "signUp" });

      toast.success("Account created! Finalizing your profile...");
      // navigate is handled by the useEffect which also calls updateProfile
    } catch (error: any) {
      console.error(error);
      localStorage.removeItem("pending_signup_profile");
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResetLoading(true);
    try {
      const result = await requestPasswordReset({ email: resetEmail });
      
      if (result.success) {
        toast.success("Password reset link sent! Check your email.");
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      toast.error("Too many failed attempts. Please try again in 15 minutes.");
      return;
    }

    setIsLoading(true);

    try {
      await signIn("password", { email, password, flow: "signIn" });

      // Ban check is handled in individual components or a higher level component.
      // If we want it here, we'd need to check profile AFTER sign in.

      setLoginAttempts(0);
      toast.success("Welcome back!");
    } catch (error: any) {
      console.error(error);
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= 5) {
        setIsLocked(true);
        setTimeout(() => {
          setIsLocked(false);
          setLoginAttempts(0);
        }, 15 * 60 * 1000);
        toast.error("Account temporarily locked due to multiple failed attempts.");
      } else {
        toast.error(`Invalid credentials. ${5 - newAttempts} attempts remaining.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Sprout className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">AgriLink</CardTitle>
          <CardDescription>
            Connect farmers directly with buyers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              {!showForgotPassword ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>

                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-muted-foreground"
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isResetLoading}>
                    {isResetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>

                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmail("");
                      }}
                      className="text-sm text-muted-foreground"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (e.target.value) validatePassword(e.target.value);
                    }}
                    required
                    minLength={8}
                  />
                  {passwordError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must contain uppercase, lowercase, digit, and special character (- or _)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <RadioGroup value={role} onValueChange={(value: any) => setRole(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="buyer" id="buyer" />
                      <Label htmlFor="buyer" className="font-normal cursor-pointer">
                        Buyer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="farmer" id="farmer" />
                      <Label htmlFor="farmer" className="font-normal cursor-pointer">
                        Farmer
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
