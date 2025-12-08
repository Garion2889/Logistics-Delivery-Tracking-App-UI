import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Phone, Package, CheckCircle2, XCircle, Camera,
  ArrowLeft, DollarSign, Navigation, ArrowUpFromLine,
  ArrowDownToLine, CalendarClock, Ban
} from "lucide-react";
import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Shared Types ---
export type DeliveryStatus =
  | "pending" | "assigned" | "picked_up" | "in-transit"
  | "delivered" | "returned" | "rescheduled";

export interface Delivery {
  id: string;
  refNo: string;
  customer: string;
  address: string;
  status: DeliveryStatus;
  paymentType: "COD" | "Paid";
  amount?: number;
  phone?: string;
  latitude: number;
  longitude: number;
  type: "outbound" | "return_pickup";
}

interface DriverDeliveryDetailProps {
  delivery: Delivery;
  onBack: () => void;
  // This prop passes the data BACK to the dashboard
  onUpdateStatus: (status: DeliveryStatus, reason?: string) => void;
  onUploadPOD: () => void;
}

export function DriverDeliveryDetail({
  delivery,
  onBack,
  onUpdateStatus,
  onUploadPOD,
}: DriverDeliveryDetailProps) {
  const [viewState, setViewState] = useState<"normal" | "failed_menu" | "return_reasons">("normal");

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.latitude},${delivery.longitude}`;
    window.open(url, "_blank");
  };

  const getStatusColor = (status: DeliveryStatus) => {
    const colors: Record<DeliveryStatus, string> = {
      pending: "bg-orange-100 text-orange-700",
      assigned: "bg-blue-100 text-blue-700",
      picked_up: "bg-yellow-100 text-yellow-700",
      "in-transit": "bg-purple-100 text-purple-700",
      delivered: "bg-green-100 text-green-700",
      returned: "bg-red-100 text-red-700",
      rescheduled: "bg-indigo-100 text-indigo-700",
    };
    return colors[status];
  };

  const handleReschedule = () => {
    onUpdateStatus("rescheduled", "Customer Unavailable - Rescheduled");
    setViewState("normal");
  };

  const handleFinalReturn = (reason: string) => {
    onUpdateStatus("returned", reason);
    setViewState("normal");
  };

  const isReturnPickup = delivery.type === "return_pickup";

  return (
    <div className="space-y-4 pb-20">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* --- MAP CARD --- */}
      <Card className="border-0 shadow-sm overflow-hidden relative">
        <div className="h-64 w-full z-0">
          <MapContainer center={[delivery.latitude, delivery.longitude]} zoom={15} scrollWheelZoom={false} className="h-full w-full" style={{ zIndex: 0 }}>
            <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[delivery.latitude, delivery.longitude]}>
              <Popup>{delivery.customer}</Popup>
            </Marker>
          </MapContainer>
          <div className="absolute bottom-4 right-4 z-[400]">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-5 h-12" onClick={handleNavigate}>
              <Navigation className="w-5 h-5 mr-2" /> Navigate
            </Button>
          </div>
        </div>
      </Card>

      {/* --- HEADER --- */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg text-[#222B2D] dark:text-white flex items-center gap-2">
                {delivery.refNo}
                {isReturnPickup ? <ArrowUpFromLine className="w-4 h-4 text-orange-500" /> : <ArrowDownToLine className="w-4 h-4 text-blue-500" />}
              </p>
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">{delivery.customer}</p>
            </div>
            <Badge className={getStatusColor(delivery.status)} variant="outline">{delivery.status.toUpperCase()}</Badge>
          </div>
          {delivery.status === "rescheduled" && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 flex items-start gap-3">
              <CalendarClock className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-indigo-800">Delivery Rescheduled</p>
                <p className="text-xs text-indigo-700">Item stays with driver. Delivery will be re-attempted.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- DETAILS --- */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-sm text-[#222B2D]/60 dark:text-white/60 mb-1">Address</p>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-[#222B2D] dark:text-white">{delivery.address}</p>
            </div>
          </div>
          {delivery.phone && (
            <div>
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60 mb-1">Contact</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${delivery.phone}`} className="text-[#27AE60] hover:underline">{delivery.phone}</a>
              </div>
            </div>
          )}
          {!isReturnPickup && delivery.paymentType === "COD" && delivery.amount && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Collect COD</span>
              </div>
              <p className="text-lg font-bold text-yellow-800">₱{delivery.amount.toLocaleString()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- ACTIONS --- */}
      <div className="space-y-3">
        {delivery.status === "assigned" && (
          <Button className="w-full bg-[#27AE60] hover:bg-[#229954] text-white h-12" onClick={() => onUpdateStatus("picked_up")}>
            <Package className="w-5 h-5 mr-2" /> Accept Job
          </Button>
        )}

        {delivery.status === "picked_up" && (
          <Button className="w-full bg-[#27AE60] hover:bg-[#229954] text-white h-12" onClick={() => onUpdateStatus("in-transit")}>
            <Navigation className="w-5 h-5 mr-2" /> Start Route
          </Button>
        )}

        {delivery.status === "in-transit" && viewState === "normal" && (
          <div className="space-y-3">
            <Button className="w-full bg-[#27AE60] hover:bg-[#229954] text-white h-14 text-lg shadow-md" onClick={() => onUpdateStatus("delivered")}>
              <CheckCircle2 className="w-6 h-6 mr-2" /> {isReturnPickup ? "Collected Successfully" : "Delivery Success"}
            </Button>

            {!isReturnPickup && (
              <Button variant="outline" className="w-full text-red-600 border-red-200 h-12 hover:bg-red-50" onClick={() => setViewState("failed_menu")}>
                <XCircle className="w-5 h-5 mr-2" /> Delivery Failed
              </Button>
            )}
          </div>
        )}

        {/* --- FAILED MENU --- */}
        {viewState === "failed_menu" && (
          <Card className="bg-gray-50 border-gray-200 animate-in fade-in slide-in-from-bottom-2">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-bold text-gray-800">What happened?</p>
              
              <Button className="w-full justify-start h-auto py-3 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50" variant="outline" onClick={handleReschedule}>
                <div className="flex items-start gap-3">
                  <CalendarClock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-bold">Customer Unavailable</p>
                    <p className="text-xs text-indigo-600/80">Reschedule for next attempt</p>
                  </div>
                </div>
              </Button>

              <Button className="w-full justify-start h-auto py-3 bg-white text-red-700 border border-red-200 hover:bg-red-50" variant="outline" onClick={() => setViewState("return_reasons")}>
                 <div className="flex items-start gap-3">
                  <Ban className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-bold">Delivery Failed / Rejected</p>
                    <p className="text-xs text-red-600/80">Final return to warehouse</p>
                  </div>
                </div>
              </Button>

              <Button variant="ghost" className="w-full" onClick={() => setViewState("normal")}>Cancel</Button>
            </CardContent>
          </Card>
        )}

        {/* --- REASONS --- */}
        {viewState === "return_reasons" && (
          <Card className="bg-red-50 border-red-200 animate-in fade-in slide-in-from-bottom-2">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-bold text-red-800 mb-2">Select Reason for Final Return:</p>
              {["Customer Refused", "Wrong Address / Unlocatable", "Item Damaged", "3rd Failed Attempt"].map((reason) => (
                <Button key={reason} variant="outline" className="w-full justify-start text-red-700 bg-white hover:bg-red-100 border-red-200" onClick={() => handleFinalReturn(reason)}>
                  {reason}
                </Button>
              ))}
              <Button variant="ghost" className="w-full text-gray-500" onClick={() => setViewState("failed_menu")}>Back</Button>
            </CardContent>
          </Card>
        )}

        {(delivery.status === "delivered" || delivery.status === "returned") && (
          <Button variant="outline" className="w-full h-12" onClick={onUploadPOD}>
            <Camera className="w-5 h-5 mr-2" /> Upload Photo Proof
          </Button>
        )}
      </div>
    </div>
  );
}