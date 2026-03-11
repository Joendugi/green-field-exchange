import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Mail, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { checkPasswordStrength } from "@/lib/validation";

const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState(emailParam || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(token || emailParam ? 2 : 1);
  const [isRequesting, setIsRequesting] = useState(false);

  const verifyTokenResult = useQuery(api.passwordReset.verifyResetToken, token ? { token } : "skip");
  const resetPassword = useMutation(api.passwordReset.resetPassword);
  const requestResetCode = useMutation(api.passwordReset.requestPasswordReset);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
      setStep(2);
    }
  }, [emailParam]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsRequesting(true);
    setError("");

    try {
      const result = await requestResetCode({ email });
      if (result.success) {
        toast.success(result.message);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const { score, feedback } = checkPasswordStrength(password);
    if (score < 4) {
      setError(feedback[0] || "Password is too weak");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword({
        token: token || undefined,
        email: email || undefined,
        otp: otp || undefined,
        newPassword: password
      });

      if (result.success) {
        setIsSuccess(true);
        toast.success("Password reset successfully!");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 text-forest-900">
        <Card className="w-full max-w-md border-forest-100 shadow-xl">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Success!</h1>
              <p className="text-gray-600 mb-8">
                Your password has been reset. You'll be redirected to login shortly.
              </p>
              <Button
                onClick={() => navigate("/auth")}
                className="w-full bg-forest-600 hover:bg-forest-700"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 to-white py-12 px-4">
      <Card className="w-full max-w-md border-forest-100 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-forest-900">Reset Password</CardTitle>
          <CardDescription>
            {token ? "Create a new secure password" : "Enter your code and new password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a 6-digit verification code to this email.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-forest-600 hover:bg-forest-700"
                disabled={isRequesting}
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : "Send Reset Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-forest-600 hover:underline"
                >
                  Change email
                </button>
              </div>

              {!token && (
                <div className="space-y-2">
                  <Label htmlFor="otp">6-Digit Reset Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").substring(0, 6))}
                    placeholder="123456"
                    className="text-center tracking-widest text-lg font-mono"
                    required
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Check your inbox for the code
                    </p>
                    <button
                      type="button"
                      onClick={handleRequestCode}
                      disabled={isRequesting}
                      className="text-xs text-forest-600 hover:underline disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-forest-600 hover:bg-forest-700 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : "Update Password"}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="text-sm text-forest-600 hover:text-forest-700 hover:bg-forest-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;
