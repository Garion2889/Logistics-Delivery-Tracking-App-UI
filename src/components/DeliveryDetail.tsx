import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Package,
  User,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";
import { Separator } from "./ui/separator";

// 1. Updated Interface to include the missing date fields
interface Delivery {
  id: string;
  refNo: string;
  customer: string;
  address: string;
  paymentType: "COD" | "Paid";
  status: "pending" | "assigned" | "in-transit" | "delivered" | "returned";
  driver?: string;
  createdAt: string;
  assignedAt?: string;    // New field
  inTransitAt?: string;   // New field
  deliveredAt?: string;   // New field
  phone?: string;
  amount?: number;
}

interface DeliveryDetailProps {
  delivery: Delivery;
  onClose: () => void;
}

export function DeliveryDetail({ delivery, onClose }: DeliveryDetailProps) {

  // 2. Helper function to format dates nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return undefined;
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'Asia/Manila', // Force PH Time
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const timelineSteps = [
    {
      status: "pending",
      label: "Order Created",
      icon: Package,
      completed: true,
      date: formatDate(delivery.createdAt),
    },
    {
      status: "assigned",
      label: "Driver Assigned",
      icon: User,
      // Logic: It's done if status is NOT pending
      completed: delivery.status !== "pending", 
      // Logic: Show date only if we have it
      date: delivery.status !== "pending" ? formatDate(delivery.assignedAt) : undefined,
    },
    {
      status: "in-transit",
      label: "In Transit",
      icon: Truck,
      completed: delivery.status === "in-transit" || delivery.status === "delivered",
      date:
        (delivery.status === "in-transit" || delivery.status === "delivered")
          ? formatDate(delivery.inTransitAt)
          : undefined,
    },
    {
      status: "delivered",
      label: "Delivered",
      icon: CheckCircle2,
      completed: delivery.status === "delivered",
      date: delivery.status === "delivered" ? formatDate(delivery.deliveredAt) : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-[#222B2D] dark:text-white">Delivery Details</h1>
          <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
            {delivery.refNo}
          </p>
        </div>
        <Badge
          className={`${
            delivery.status === "delivered"
              ? "bg-green-100 text-green-700"
              : delivery.status === "in-transit"
              ? "bg-purple-100 text-purple-700"
              : delivery.status === "assigned"
              ? "bg-blue-100 text-blue-700"
              : "bg-orange-100 text-orange-700"
          }`}
          variant="outline"
        >
          {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                    Customer Name
                  </p>
                  <p className="text-[#222B2D] dark:text-white">
                    {delivery.customer}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                    Delivery Address
                  </p>
                  <p className="text-[#222B2D] dark:text-white">
                    {delivery.address}
                  </p>
                </div>
              </div>
              
              {delivery.driver && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                        Assigned Driver
                      </p>
                      <p className="text-[#222B2D] dark:text-white">
                        {delivery.driver}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Delivery Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Delivery Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === timelineSteps.length - 1;
                  return (
                    <div key={step.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            step.completed
                              ? "bg-[#27AE60] text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-12 ${
                              step.completed
                                ? "bg-[#27AE60]"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          ></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="text-[#222B2D] dark:text-white">
                          {step.label}
                        </p>
                        {step.date && (
                          <p className="text-sm text-[#222B2D]/60 dark:text-white/60 flex items-center gap-1 mt-1">
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

          {/* Proof of Delivery */}
          {delivery.status === "delivered" && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Proof of Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60 mt-4">
                  Images uploaded by driver upon delivery
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Map */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-[#27AE60] mx-auto mb-2" />
                  <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                    Google Maps
                  </p>
                  <p className="text-xs text-[#222B2D]/40 dark:text-white/40">
                    Route visualization
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}