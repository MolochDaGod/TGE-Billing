import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Cloud, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePuterAuth } from "@/hooks/usePuterAuth";
import tgeLogo from "@assets/tgelogo_1763888346781.webp";

export default function Auth() {
  const { toast } = useToast();
  const { signIn: puterSignIn, isLoading: puterLoading } = usePuterAuth();
  const [adminOpen, setAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const handlePuterSignIn = async () => {
    try {
      await puterSignIn();
      toast({
        title: "Welcome!",
        description: "Signed in with Puter successfully.",
      });
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Puter sign-in failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      if (response.ok) {
        toast({ title: "Welcome back!", description: "Logged in successfully." });
        window.location.href = "/";
      } else {
        const data = await response.json();
        toast({
          title: "Login failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src={tgeLogo}
              alt="T.G.E. PROS Logo"
              className="h-16 w-auto drop-shadow-lg"
              data-testid="img-logo"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">ElectraPro</h1>
          <p className="text-muted-foreground">Professional electrical services management</p>
        </div>

        <Card className="border-border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Use your Puter account to access ElectraPro
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Primary: Puter sign-in */}
            <Button
              size="lg"
              className="w-full text-base"
              onClick={handlePuterSignIn}
              disabled={puterLoading}
              data-testid="button-puter-signin"
            >
              {puterLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Cloud className="mr-2 h-5 w-5" />
              )}
              Continue with Puter
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Don't have a Puter account?{" "}
              <a
                href="https://puter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Create one free
              </a>
            </p>

            {/* Admin fallback — collapsed by default */}
            <div>
              <button
                type="button"
                onClick={() => setAdminOpen((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                {adminOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Admin / Staff login
              </button>

              {adminOpen && (
                <div className="mt-4 space-y-4">
                  <Separator />
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="Enter your username"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        required
                        disabled={isLoading}
                        data-testid="input-login-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        disabled={isLoading}
                        data-testid="input-login-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-login-submit"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Log In"
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Texas Master Class Electrician License #750779</p>
              <p className="mt-1 text-xs">We make power easy • T.G.E. Billing</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
