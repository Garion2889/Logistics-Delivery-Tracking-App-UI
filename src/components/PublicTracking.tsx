import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Truck,
  Search,
  ArrowLeft,
  Package,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Separator } from "./ui/separator";

interface Delivery {
  refNo: string;
  customer: string;
  address: string;
  status: "pending" | "assigned" | "in-transit" | "delivered" | "returned";
  driver?: string;
  timeline: {
    status: string;
    label: string;
    date?: string;
    completed: boolean;
  }[];
}

interface PublicTrackingProps {
  onNavigateToLogin: () => void;
  onTrackDelivery: (refNo: string) => Delivery | null;
}

export function PublicTracking({
  onNavigateToLogin,
  onTrackDelivery,
}: PublicTrackingProps) {
  const [refNo, setRefNo] = useState("");
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onTrackDelivery(refNo);
    if (result) {
      setDelivery(result);
      setNotFound(false);
    } else {
      setDelivery(null);
      setNotFound(true);
    }
  };

  const handleReset = () => {
    setRefNo("");
    setDelivery(null);
    setNotFound(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-orange-100 text-orange-700",
      assigned: "bg-blue-100 text-blue-700",
      "in-transit": "bg-purple-100 text-purple-700",
      delivered: "bg-green-100 text-green-700",
      returned: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-[#F6F7F8] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-[#27AE60] flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-[#222B2D]">SmartStock Logistics</h1>
              <p className="text-sm text-[#222B2D]/60">
                Track Your Delivery
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        {!delivery && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">Track a Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrack} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      placeholder="Enter Reference Number (e.g., REF-001)"
                      className="pl-11 h-12"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#27AE60] hover:bg-[#229954] text-white"
                >
                  Track Delivery
                </Button>

                {notFound && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800">
                        No record found for this reference number.
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Please check your reference number and try again.
                      </p>
                    </div>
                  </div>
                )}
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={onNavigateToLogin}
                  className="inline-flex items-center gap-2 text-sm text-[#27AE60] hover:text-[#229954] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Details */}
        {delivery && (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Delivery Details</CardTitle>
                    <p className="text-sm text-[#222B2D]/60 mt-1">
                      {delivery.refNo}
                    </p>
                  </div>
                  <Badge
                    className={getStatusColor(delivery.status)}
                    variant="outline"
                  >
                    {delivery.status.charAt(0).toUpperCase() +
                      delivery.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-[#222B2D]/60">Customer</p>
                    <p className="text-[#222B2D]">{delivery.customer}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-[#222B2D]/60">
                      Delivery Address
                    </p>
                    <p className="text-[#222B2D]">{delivery.address}</p>
                  </div>
                </div>

                {delivery.driver && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-[#222B2D]/60">Driver</p>
                        <p className="text-[#222B2D]">{delivery.driver}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Delivery Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {delivery.timeline.map((step, index) => {
                    const isLast = index === delivery.timeline.length - 1;
                    return (
                      <div key={step.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              step.completed
                                ? "bg-[#27AE60] text-white"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {step.completed ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Clock className="w-5 h-5" />
                            )}
                          </div>
                          {!isLast && (
                            <div
                              className={`w-0.5 h-12 ${
                                step.completed ? "bg-[#27AE60]" : "bg-gray-200"
                              }`}
                            ></div>
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <p className="text-[#222B2D]">{step.label}</p>
                          {step.date && (
                            <p className="text-sm text-[#222B2D]/60 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {step.date}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Delivery Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-[#27AE60] mx-auto mb-2" />
                    <p className="text-sm text-[#222B2D]/60">Google Maps</p>
                    <p className="text-xs text-[#222B2D]/40">
                      Live tracking map
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Track Another Delivery
              </Button>
              <Button
                variant="outline"
                onClick={onNavigateToLogin}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
