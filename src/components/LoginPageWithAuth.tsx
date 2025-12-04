import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Truck, ArrowRight } from "lucide-react";
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";

interface LoginPageWithAuthProps {
  onLogin: (token: string, role: "admin" | "driver", id: string) => void;
  onShowTracking: () => void;
}

export function LoginPageWithAuth({ onLogin, onShowTracking }: LoginPageWithAuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "driver">("admin");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // CUSTOM AUTH: Call your Edge Function directly
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/login/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // 1. Validate Roles against the Selected Tab
      if (activeTab === "admin" && data.user.role !== "admin") {
        toast.error("This account is not an admin account");
        setLoading(false);
        return;
      }

      if (activeTab === "driver" && data.user.role !== "driver") {
        toast.error("This account is not a driver account");
        setLoading(false);
        return;
      }

      // 2. Success Message
      toast.success(`Welcome back, ${data.employee.first_name}`);

      // 3. Complete Login
      // Since Custom Auth doesn't return a session token, we use a placeholder or the ID.
      // We pass the User ID (auth.users.id) to App.tsx to handle the rest.
      const sessionToken = "custom-auth-token"; 
      onLogin(sessionToken, data.user.role, data.user.user_id);

    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F7F8] p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#27AE60] flex items-center justify-center">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-[#222B2D]">SmartStock Logistics</h1>
              <p className="text-sm text-[#222B2D]/60">RMT Marketing Solutions Inc.</p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Choose your role to continue</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              defaultValue="admin"
              className="w-full"
              onValueChange={(val) => setActiveTab(val as "admin" | "driver")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="driver">Driver</TabsTrigger>
              </TabsList>

              {/* ADMIN FORM */}
              <TabsContent value="admin">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="admin@smartstock.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button className="w-full bg-[#27AE60] text-white" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In as Admin"}
                  </Button>
                </form>
              </TabsContent>

              {/* DRIVER FORM */}
              <TabsContent value="driver">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="driver@smartstock.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button className="w-full bg-[#27AE60] text-white" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In as Driver"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Public Tracking Link */}
        <div className="text-center">
          <button
            onClick={onShowTracking}
            className="inline-flex items-center gap-2 text-[#27AE60] hover:text-[#229954]"
            disabled={loading}
          >
            Track a Delivery
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}