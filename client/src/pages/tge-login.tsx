import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Zap, MapPin, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function TGELogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Welcome to TGE!", description: "Redirecting to your portal…" });
        navigate("/tge-portal");
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Login failed", description: data.message || "Invalid credentials.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #052e16 0%, #14532d 60%, #052e16 100%)" }}>
      {/* Top accent stripe */}
      <div style={{ height: 5, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }} />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(22,163,74,0.15)", border: "3px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={52} color="#4ade80" strokeWidth={1.5} />
            </div>
          </div>
          <h1 style={{ color: "#ffffff", fontSize: 32, fontWeight: 800, letterSpacing: 1, textAlign: "center", lineHeight: 1.1 }}>
            T.G.E. Electrical
          </h1>
          <div className="flex items-center gap-1 mt-2" style={{ color: "#86efac", fontSize: 14 }}>
            <MapPin size={14} />
            <span>Texas City, TX</span>
          </div>
          <p style={{ color: "#4ade80", fontSize: 13, marginTop: 6, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase" }}>
            Vendor Portal
          </p>
        </div>

        {/* Login Card */}
        <div style={{ width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 16, padding: "36px 32px", backdropFilter: "blur(12px)" }}>
          <h2 style={{ color: "#ffffff", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: "#86efac", fontSize: 14, marginBottom: 28 }}>Access your invoice portal</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tge-username" style={{ color: "#e2e8f0" }}>Username</Label>
              <div className="relative">
                <User size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4ade80" }} />
                <Input
                  id="tge-username"
                  type="text"
                  placeholder="tge-vendor"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  disabled={isLoading}
                  style={{ paddingLeft: 36, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(74,222,128,0.3)", color: "#fff" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tge-password" style={{ color: "#e2e8f0" }}>Password</Label>
              <div className="relative">
                <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4ade80" }} />
                <Input
                  id="tge-password"
                  type="password"
                  placeholder="••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  disabled={isLoading}
                  style={{ paddingLeft: 36, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(74,222,128,0.3)", color: "#fff" }}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", height: 46, fontSize: 16, fontWeight: 700, borderRadius: 8, marginTop: 8 }}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
              {isLoading ? "Signing In…" : "Enter Portal"}
            </Button>
          </form>

          <div style={{ marginTop: 20, padding: "12px 14px", background: "rgba(74,222,128,0.08)", borderRadius: 8, border: "1px solid rgba(74,222,128,0.2)" }}>
            <p style={{ color: "#4ade80", fontSize: 12, textAlign: "center" }}>
              Admin login: tgebilling@gmail.com via main auth
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: "#166534", fontSize: 12, marginTop: 28, textAlign: "center" }}>
          <span style={{ color: "#4ade80" }}>T.G.E. Electrical</span> &bull; Powered by TGE Billing
        </p>
      </div>

      {/* Bottom accent stripe */}
      <div style={{ height: 5, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }} />
    </div>
  );
}
