import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { account, databases } from "@/lib/appwrite";
import { ID } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Sprout, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer">("buyer");
  const [passwordError, setPasswordError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // ... validatePassword ...

  const validatePassword = (pwd: string): boolean => {
    // ... existing validation logic ...
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

    // Validate password strength
    if (!validatePassword(password)) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create Account
      const newUser = await account.create(ID.unique(), email, password, fullName);

      // 2. Create Session (Login)
      await account.createEmailPasswordSession(email, password);

      // 3. Store User Role & Create Profile
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      await databases.createDocument(
        dbId,
        "user_roles",
        ID.unique(),
        {
          user_id: newUser.$id,
          role: role
        }
      );

      // Create initial profile
      await databases.createDocument(
        dbId,
        "profiles",
        newUser.$id,
        {
          id: newUser.$id,
          full_name: fullName,
          username: email.split("@")[0],
        }
      );

      await checkAuth(); // Update global auth context
      toast.success("Account created successfully!");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
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
      try {
        await account.deleteSession("current");
      } catch (err) {
        // Ignore "session not found" error
      }

      await account.createEmailPasswordSession(email, password);

      // Check if user is banned
      const currentUser = await account.get();
      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

      try {
        const profile = await databases.getDocument(dbId, "profiles", currentUser.$id);
        if (profile.is_banned) {
          await account.deleteSession("current");
          toast.error(profile.ban_reason
            ? `Your account has been suspended: ${profile.ban_reason}`
            : "Your account has been suspended. Please contact support.");
          setIsLoading(false);
          return;
        }
      } catch (profileError) {
        console.warn("Could not check ban status:", profileError);
      }

      setLoginAttempts(0);
      await checkAuth(); // Update global auth context
      toast.success("Welcome back!");
      navigate("/");
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
              </form>
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
