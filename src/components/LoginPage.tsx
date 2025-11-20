import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Truck, ArrowRight } from "lucide-react";

interface LoginPageWithAuthProps {
  onLogin: (role: "admin" | "driver", email: string, password: string) => void;
  onNavigateToTracking: () => void;
  loading?: boolean;
}

export function LoginPageWithAuth({ onLogin, onNavigateToTracking, loading }: LoginPageWithAuthProps) {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPassword, setDriverPassword] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin("admin", adminEmail, adminPassword);
  };

  const handleDriverLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin("driver", driverEmail, driverPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F7F8] p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Branding */}
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
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="driver">Driver</TabsTrigger>
              </TabsList>

              {/* Admin Login */}
              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@smartstock.ph"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#27AE60] hover:bg-[#229954] text-white"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In as Admin"}
                  </Button>
                  <p className="text-xs text-center text-[#222B2D]/60 mt-2">
                    Test: admin@smartstock.ph / admin123
                  </p>
                </form>
              </TabsContent>

              {/* Driver Login */}
              <TabsContent value="driver">
                <form onSubmit={handleDriverLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="driver-email">Email</Label>
                    <Input
                      id="driver-email"
                      type="email"
                      placeholder="driver@smartstock.ph"
                      value={driverEmail}
                      onChange={(e) => setDriverEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver-password">Password</Label>
                    <Input
                      id="driver-password"
                      type="password"
                      placeholder="••••••••"
                      value={driverPassword}
                      onChange={(e) => setDriverPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#27AE60] hover:bg-[#229954] text-white"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In as Driver"}
                  </Button>
                  <p className="text-xs text-center text-[#222B2D]/60 mt-2">
                    Test: pedro@smartstock.ph / driver123
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Public Tracking Link */}
        <div className="text-center">
          <button
            onClick={onNavigateToTracking}
            className="inline-flex items-center gap-2 text-[#27AE60] hover:text-[#229954] transition-colors"
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
