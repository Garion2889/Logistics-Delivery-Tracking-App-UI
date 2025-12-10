import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet marker icons in React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 1. Updated Interface to match the SQL VIEW (admin_deliveries_view)
interface TimelineEvent {
  label: string;
  date: string;
  completed: boolean;
}

export interface Delivery {
  id: string;
  ref_no: string;           
  customer_name: string;    
  delivery_address: string; 
  status: string;
  assigned_driver?: string;
  latitude?: number;        // Added: Coordinates from View
  longitude?: number;       // Added: Coordinates from View
  pod_images?: string[];    // Added: Array of public URLs from View
  timeline_events?: TimelineEvent[];
}

interface DeliveryDetailProps {
  delivery: Delivery;
  onClose: () => void;
}

export function DeliveryDetail({ delivery, onClose }: DeliveryDetailProps) {

  // 2. Helper to map Database Labels to Icons
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
    if (s === 'returned') return "bg-red-100 text-red-700";
    return "bg-orange-100 text-orange-700";
  };

  const hasLocation = delivery.latitude && delivery.longitude;

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

          {/* Delivery Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Delivery Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Fallback Check */}
                {(!delivery.timeline_events || delivery.timeline_events.length === 0) && (
                   <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        Timeline data missing. Ensure you are fetching from 'admin_deliveries_view'.
                      </span>
                   </div>
                )}

                {/* Iterate over timeline */}
                {delivery.timeline_events?.map((step, index) => {
                  const Icon = getIconForLabel(step.label);
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

          {/* Proof of Delivery / Return */}
          {(delivery.status?.toLowerCase() === "delivered" || delivery.status?.toLowerCase() === "returned") && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Proof of {delivery.status === 'returned' ? 'Return' : 'Delivery'}</CardTitle>
              </CardHeader>
              <CardContent>
                {delivery.pod_images && delivery.pod_images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {delivery.pod_images.map((url, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity overflow-hidden border border-gray-200 dark:border-gray-700"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <img 
                          src={url} 
                          alt={`Proof ${i + 1}`} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Image+Error";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                    <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No images uploaded.</p>
                  </div>
                )}
                
                {delivery.pod_images && delivery.pod_images.length > 0 && (
                  <p className="text-xs text-[#222B2D]/40 dark:text-white/40 mt-4 text-center">
                    Click images to view full size.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Map */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm sticky top-24 overflow-hidden">
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {hasLocation ? (
                <div className="h-64 w-full z-0 relative">
                  <MapContainer
                    center={[delivery.latitude!, delivery.longitude!]}
                    zoom={15}
                    scrollWheelZoom={false}
                    className="h-full w-full rounded-b-lg sm:rounded-lg"
                    style={{ zIndex: 0 }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[delivery.latitude!, delivery.longitude!]}>
                      <Popup>{delivery.delivery_address}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center mx-6 mb-6 border border-gray-200 dark:border-gray-700">
                  <div className="text-center p-4">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                      No coordinates available
                    </p>
                    <p className="text-xs text-[#222B2D]/40 dark:text-white/40 mt-1">
                      {delivery.delivery_address}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}