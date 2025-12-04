import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  X,
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "text-orange-600",
      assigned: "text-blue-600",
      "in-transit": "text-purple-600",
      delivered: "text-green-600",
      returned: "text-red-600",
    };
    return colors[status] || "text-gray-600";
  };

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
              <Separator />
              <div className="flex items-start gap-3">
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