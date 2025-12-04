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
  AlertCircle
} from "lucide-react";
import { Separator } from "./ui/separator";

// 1. Updated Interface to match the SQL VIEW (admin_deliveries_view)
// The view sends snake_case keys (e.g., customer_name) instead of camelCase.
interface TimelineEvent {
  label: string;
  date: string;
  completed: boolean;
}

interface Delivery {
  id: string;
  ref_no: string;           // Matches View column
  customer_name: string;    // Matches View column
  delivery_address: string; // Matches View column
  status: string;
  assigned_driver?: string;
  
  // The View provides this pre-built array. No manual calculation needed.
  timeline_events?: TimelineEvent[];
}

interface DeliveryDetailProps {
  delivery: Delivery;
  onClose: () => void;
}

export function DeliveryDetail({ delivery, onClose }: DeliveryDetailProps) {

  // 2. Helper to map Database Labels to Icons
  // This matches the labels we wrote in the SQL View ("Order Created", "In Transit", etc.)
  const getIconForLabel = (label: string) => {
    switch (label) {
      case "Order Created": return Package;
      case "Driver Assigned": return User;
      case "Picked Up": return Package;
      case "In Transit": return Truck;
      case "Delivered": return CheckCircle2;
      default: return Clock;
    }
  };

  // 3. Helper for Badge Colors
  const getStatusColor = (status: string) => {
    const s = status ? status.toLowerCase() : "";
    if (s === 'delivered') return "bg-green-100 text-green-700";
    if (s === 'in_transit' || s === 'in-transit') return "bg-purple-100 text-purple-700";
    if (s === 'assigned') return "bg-blue-100 text-blue-700";
    return "bg-orange-100 text-orange-700";
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
            {delivery.ref_no}
          </p>
        </div>
        <Badge
          className={getStatusColor(delivery.status)}
          variant="outline"
        >
          {delivery.status ? delivery.status.replace('_', ' ').toUpperCase() : "UNKNOWN"}
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
                    {delivery.customer_name}
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
                    {delivery.delivery_address}
                  </p>
                </div>
              </div>
              
              {delivery.assigned_driver && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                        Assigned Driver
                      </p>
                      <p className="text-[#222B2D] dark:text-white">
                        {delivery.assigned_driver}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Delivery Timeline (Powered by SQL View) */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Delivery Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Fallback Check: If timeline_events is missing, user likely didn't update fetch code */}
                {(!delivery.timeline_events || delivery.timeline_events.length === 0) && (
                   <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        Timeline data missing. Ensure you are fetching from 'admin_deliveries_view'.
                      </span>
                   </div>
                )}

                {/* Iterate over the SQL-generated timeline */}
                {delivery.timeline_events?.map((step, index) => {
                  const Icon = getIconForLabel(step.label);
                  // We determine "isLast" based on the array length
                  const isLast = index === (delivery.timeline_events?.length || 0) - 1;
                  
                  return (
                    <div key={index} className="flex gap-4">
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
                        <p className="text-[#222B2D] dark:text-white font-medium">
                          {step.label}
                        </p>
                        {/* Render the pre-formatted date directly from DB */}
                        <p className="text-sm text-[#222B2D]/60 dark:text-white/60 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {step.date}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Proof of Delivery (Only show if delivered) */}
          {delivery.status?.toLowerCase() === "delivered" && (
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
                    {delivery.delivery_address}
                  </p>
                  <p className="text-xs text-[#222B2D]/40 dark:text-white/40 mt-2">
                    Google Maps Visualization
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