import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
// Note: We don't need supabase client for auth anymore if using custom edge function
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Truck, ArrowRight } from "lucide-react";
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner"; // Removed version number for import

interface LoginPageWithAuthProps {
  // Updated signature: The custom flow might not return a JWT token unless you generate one manually
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
      // CHANGED: Call your Custom Edge Function instead of supabase.auth.signInWithPassword
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

      // data contains: { message, user, driver, employee } based on your Edge Function
      const userRole = data.user.role;
      const userId = data.user.id;
      
      // Note: Your custom login does not return a Supabase JWT Session Token.
      // If your app relies on RLS, this will be an issue. 
      // For now, we pass the user ID as a placeholder token or handle state management differently.
      const fakeToken = "custom-auth-session"; 

      // CHECK ROLE VS TAB
      if (activeTab === "admin" && userRole !== "admin") {
        toast.error("This account is not an admin account");
        setLoading(false);
        return;
      }

      if (activeTab === "driver" && userRole !== "driver") {
        toast.error("This account is not a driver account");
        setLoading(false);
        return;
      }

      // SUCCESS
      toast.success(`Welcome back, ${data.employee.first_name}`);
      
      if (userRole === "driver" && data.driver) {
        onLogin(fakeToken, "driver", data.driver.id);
      } else {
        onLogin(fakeToken, "admin", userId);
      }

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

              {/* ADMIN */}
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

              {/* DRIVER */}
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

        {/* Public Tracking */}
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