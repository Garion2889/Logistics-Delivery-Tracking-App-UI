import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
Truck,
Search,
ArrowLeft,
User,
MapPin,
Clock,
CheckCircle2,
AlertCircle,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { supabase } from "../utils/supabase/client";

interface Delivery {
refNo: string;
customer: string;
address: string;
status: string;
driver?: {
name: string;
vehicle_type: string;
status: string;
last_lat?: number;
last_lng?: number;
};
timeline: {
status: string;
label: string;
date?: string;
completed: boolean;
}[];
}

const defaultIcon = new L.Icon({
iconUrl: markerIcon,
iconSize: [25, 41],
iconAnchor: [12, 41],
popupAnchor: [1, -34],
shadowUrl: markerShadow,
shadowSize: [41, 41],
});

interface PublicTrackingProps {
onNavigateToLogin: () => void;
}

export function PublicTracking({ onNavigateToLogin }: PublicTrackingProps) {
const [refNo, setRefNo] = useState("");
const [delivery, setDelivery] = useState<Delivery | null>(null);
const [notFound, setNotFound] = useState(false);
const [loading, setLoading] = useState(false);
const intervalRef = useRef<NodeJS.Timer | null>(null);

const getStatusColor = (status: string) => {
const colors: Record<string, string> = {
created: "bg-gray-100 text-gray-700",
assigned: "bg-blue-100 text-blue-700",
picked_up: "bg-purple-100 text-purple-700",
in_transit: "bg-purple-100 text-purple-700",
delivered: "bg-green-100 text-green-700",
returned: "bg-red-100 text-red-700",
cancelled: "bg-gray-200 text-gray-500",
};
return colors[status] || "bg-gray-100 text-gray-700";
};

const fetchDelivery = async () => {
if (!refNo) return;
try {
const { data, error } = await supabase.rpc("track_delivery", { ref_no_input: refNo });

  if (error || !data) {
    setDelivery(null);
    setNotFound(true);
  } else {
    setDelivery((prev) => ({
      ...prev,
      refNo: data.ref_no,
      customer: data.customer_name,
      address: data.address,
      status: data.status,
      driver: data.driver
        ? {
            name: data.driver.name,
            vehicle_type: data.driver.vehicle_type,
            status: data.driver.status,
            last_lat: Number(data.driver.last_lat),
            last_lng: Number(data.driver.last_lng),
          }
        : undefined,
      timeline:
        data.history?.map((h: any) => ({
          status: h.new_status,
          label: `${h.old_status} → ${h.new_status}`,
          date: h.changed_at,
          completed: h.new_status === "delivered",
        })) || [],
    }));
  }
} catch (err) {
  console.error(err);
  setDelivery(null);
  setNotFound(true);
}

};

const handleTrack = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);
setNotFound(false);

await fetchDelivery();

// start interval to update driver location every 5s
if (intervalRef.current) clearInterval(intervalRef.current);
intervalRef.current = setInterval(fetchDelivery, 5000);

setLoading(false);

};

const handleReset = () => {
setRefNo("");
setDelivery(null);
setNotFound(false);
if (intervalRef.current) clearInterval(intervalRef.current);
};

useEffect(() => {
return () => {
if (intervalRef.current) clearInterval(intervalRef.current);
};
}, []);

return ( <div className="min-h-screen bg-[#F6F7F8] flex items-center justify-center p-4"> <div className="w-full max-w-2xl space-y-6">
{/* Header */} <div className="text-center space-y-3"> <div className="flex items-center justify-center gap-3 mb-4"> <div className="w-14 h-14 rounded-xl bg-[#27AE60] flex items-center justify-center"> <Truck className="w-8 h-8 text-white" /> </div> <div className="text-left"> <h1 className="text-[#222B2D]">SmartStock Logistics</h1> <p className="text-sm text-[#222B2D]/60">Track Your Delivery</p> </div> </div> </div>

```
    {/* Search Form */}
    {!delivery && (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Track a Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="Enter Reference Number"
                className="pl-11 h-12"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-[#27AE60] hover:bg-[#229954] text-white"
            >
              {loading ? "Tracking..." : "Track Delivery"}
            </Button>
            {notFound && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800">
                    No record found for this reference number.
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
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Delivery Details */}
    {delivery && (
      <>
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
                {delivery.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <p>{delivery.customer}</p>
            </div>
            <div className="flex items-start gap-3 mt-2">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <p>{delivery.address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {delivery.timeline.map((step, idx) => {
              const isLast = idx === delivery.timeline.length - 1;
              return (
                <div key={idx} className="flex gap-4">
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
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Delivery Location</CardTitle>
          </CardHeader>
          <CardContent>
            <MapContainer
              center={
                delivery.driver?.last_lat && delivery.driver?.last_lng
                  ? [delivery.driver.last_lat, delivery.driver.last_lng]
                  : [14.5995, 120.9842]
              }
              zoom={13}
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {delivery.driver?.last_lat && delivery.driver?.last_lng && (
                <Marker
                  position={[delivery.driver.last_lat, delivery.driver.last_lng]}
                  icon={defaultIcon}
                >
                  <Popup>
                    Driver: {delivery.driver.name}
                    <br />
                    Status: {delivery.driver.status}
                    <br />
                    Vehicle: {delivery.driver.vehicle_type}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Track Another Delivery
          </Button>
          <Button variant="outline" onClick={onNavigateToLogin} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Button>
        </div>
      </>
    )}
  </div>
</div>


);
}
