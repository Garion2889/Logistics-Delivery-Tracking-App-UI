import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DriverDeliveryDetail } from "./DriverDeliveryDetail";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useGPSUploader } from "../drivermaptracker/gpsTracker";
import {
  Package,
  MapPin,
  Truck,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";
import { PanToSelectedDriver } from "./PanToSelectedDriver";

// Fix default Leaflet icon
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

/** ✅ Shared status union to avoid mismatch */
type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in-transit"
  | "delivered"
  | "returned";

/** ✅ renamed local type to avoid collision with other Delivery types */
interface DriverDelivery {
  id: string;
  driver_id: string;
  refNo: string;
  customer: string;
  address: string;
  status: DeliveryStatus;
  paymentType: "COD" | "Paid";
  amount?: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface DriverDashboardProps {
  onUpdateStatus: (deliveryId: string, status: DeliveryStatus) => void; // parent callback
  onUploadPOD: (deliveryId: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

// Helper to pan map to driver's location
function PanToDriver({ location }: { location: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo(location, 15, { animate: true, duration: 1.5 });
    }
  }, [location, map]);
  return null;
}

export function DriverDashboard({
  onUpdateStatus: onUpdateStatusProp, // keep prop but we won't call DB from it
  onUploadPOD,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
}: DriverDashboardProps) {
  const [deliveries, setDeliveries] = useState<DriverDelivery[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null
  );
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(
    null
  );
  const [driverId, setDriverId] = useState<string>("");
  const [driverName, setDriverName] = useState<string>("");

  const mapRef = useRef<L.Map | null>(null);

  // ✅ NEW: State for OSRM Route Shape & Active Destination
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [activeDestination, setActiveDestination] = useState<{lat: number, lng: number} | null>(null);

  // Map DB status -> dashboard status
  const mapStatus = (dbStatus: string): DeliveryStatus => {
    switch (dbStatus) {
      case "pending":
        return "pending";
      case "assigned":
        return "assigned";
      case "picked_up":
        return "picked_up";
      case "in-transit":
      case "in_transit":
        return "in-transit";
      case "delivered":
        return "delivered";
      case "returned":
        return "returned";
      default:
        return "pending";
    }
  };

  /** ✅ UI status -> DB status */
  const toDbStatus = (status: DeliveryStatus) => {
    if (status === "in-transit") return "in_transit";
    return status;
  };

  // Fetch driver ID + name
  useEffect(() => {
    const fetchDriverData = async () => {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (authErr || !userId) {
        console.error("No auth user:", authErr);
        return;
      }

      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (driverError || !driver?.id) {
        console.error("Failed fetching driver row:", driverError);
        return;
      }

      setDriverId(driver.id);

      const { data: user, error: userError } = await supabase
        .from("logistics_users")
        .select("full_name")
        .eq("id", userId)
        .single();

      if (!userError && user?.full_name) setDriverName(user.full_name);
    };

    fetchDriverData();
  }, []);

  // Fetch driver-specific deliveries
  const fetchDriverDeliveries = async (internalDriverId: string) => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("assigned_driver", internalDriverId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformed: DriverDelivery[] = (data || []).map((d: any) => ({
        id: d.id,
        refNo: d.ref_no,
        customer: d.customer_name,
        address: d.address,
        status: mapStatus(d.status),
        driver_id: d.driver_id,
        paymentType: d.payment_type,
        amount: d.total_amount,
        latitude: d.latitude,
        longitude: d.longitude,
      }));

      setDeliveries(transformed);
    } catch (err: any) {
      console.error("fetchDriverDeliveries failed:", err);
      toast.error(`Failed to fetch deliveries: ${err.message}`);
    }
  };

  /**
   * ✅ LOCAL status updater
   * uses RPC update_order_status()
   *
   * IMPORTANT FIX:
   * - use already-known driverId state
   * - do NOT re-query drivers on every click (RLS can block it)
   */
  const updateStatusInDb = async (
    deliveryId: string,
    nextStatus: DeliveryStatus
  ) => {
    try {
      if (!driverId) {
        throw new Error("Driver not loaded yet. Please try again.");
      }

      const payload = {
        p_delivery_id: deliveryId,
        p_new_status: toDbStatus(nextStatus),
      };

      const { data, error: updErr } = await supabase.rpc(
        "update_order_status",
        payload
      );

      console.log("update_order_status payload:", payload);
      console.log("update_order_status result:", data);
      console.log("update_order_status error:", updErr);

      if (updErr) throw updErr;

      // optimistic UI
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId ? { ...d, status: nextStatus } : d
        )
      );

      // ✅ no parent DB double-update
      // onUpdateStatusProp(deliveryId, nextStatus);

      toast.success(`Status updated to ${nextStatus}`);
    } catch (e: any) {
      console.error("update status failed:", e);
      toast.error(e.message ?? "Failed to update status");
    }
  };

  // ✅ Subscribe to driver deliveries updates
  useEffect(() => {
    if (!driverId) return;

    // initial fetch
    fetchDriverDeliveries(driverId);

    const channel = supabase
      .channel(`driver-deliveries-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `assigned_driver=eq.${driverId}`,
        },
        () => fetchDriverDeliveries(driverId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  // 4. Start GPS uploader
  useGPSUploader();

  // 5. Subscribe to driver location updates
  useEffect(() => {
    if (!driverId) return;

    const fetchInitialLocation = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("last_lat, last_lng")
        .eq("id", driverId)
        .single();

      if (!error && data?.last_lat && data?.last_lng) {
        setDriverLocation([data.last_lat, data.last_lng]);
      }
    };

    fetchInitialLocation();

    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drivers",
          filter: `id=eq.${driverId}`,
        },
        (payload) => {
          const { last_lat, last_lng } = payload.new as any;
          if (last_lat && last_lng) setDriverLocation([last_lat, last_lng]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  const selectedDelivery = deliveries.find((d) => d.id === selectedDeliveryId);

  const defaultIcon = new L.Icon({
    iconUrl: markerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
  });

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "picked_up":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "in-transit":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "returned":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#F6F7F8] dark:bg-[#222B2D]">

        {/* HEADER */}
        <header className="sticky top-0 z-10 bg-white dark:bg-[#1a2123] border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-[#27AE60]" />
              <h1 className="text-[#222B2D] dark:text-white">
                Driver Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{driverName}</p>
                </TooltipContent>
              </Tooltip>

              <Button variant="ghost" size="icon" onClick={onToggleDarkMode}>
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="text-red-600"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="p-4 space-y-4">
          {selectedDelivery ? (
            <DriverDeliveryDetail
              delivery={selectedDelivery as any}
              onBack={() => setSelectedDeliveryId(null)}
              onUpdateStatus={(s: DeliveryStatus) => {
                updateStatusInDb(selectedDelivery.id, s);
                setSelectedDeliveryId(null);
              }}
              onUploadPOD={() => onUploadPOD(selectedDelivery.id)}
            />
          ) : (
            <>
              {/* MAP CARD */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <MapContainer
                    center={driverLocation || [14.5995, 120.9842]}
                    zoom={13}
                    style={{ height: "400px", width: "100%" }}
                    ref={mapRef}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="© OpenStreetMap contributors"
                    />

                    <PanToSelectedDriver
                      selectedDriver={
                        driverLocation
                          ? {
                              location: {
                                lat: driverLocation[0],
                                lng: driverLocation[1],
                              },
                            }
                          : null
                      }
                      role="driver"
                    />

                    {driverLocation && (
                      <Marker position={driverLocation} icon={defaultIcon}>
                        <Popup>Your current location</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </CardContent>
              </Card>

              {/* DELIVERIES */}
              <h3 className="text-[#222B2D] dark:text-white mb-3">
                Assigned Deliveries
              </h3>

              {deliveries.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No deliveries assigned yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                deliveries.map((delivery) => (
                  <Card
                    key={delivery.id}
                    className="border-0 shadow-sm hover:shadow-md transition"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[#222B2D] dark:text-white">
                            {delivery.refNo}
                          </p>
                          <p className="text-sm text-gray-500">
                            {delivery.customer}
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

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <p className="text-sm text-gray-500">
                          {delivery.address}
                        </p>
                      </div>

                      {delivery.paymentType === "COD" && delivery.amount && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-100 dark:border-yellow-800">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            💰 Collect COD: ₱{delivery.amount.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* ACTION BUTTONS */}
                      <div className="flex gap-2 pt-2">
                        {delivery.status === "assigned" && (
                          <Button
                            size="sm"
                            className="flex-1 bg-[#27AE60] hover:bg-[#229954] text-white"
                            onClick={() =>
                              updateStatusInDb(delivery.id, "picked_up")
                            }
                          >
                            Accept Assignment
                          </Button>
                        )}

                        {delivery.status === "picked_up" && (
                          <Button
                            size="sm"
                            className="flex-1 bg-[#27AE60] hover:bg-[#229954] text-white"
                            onClick={() =>
                              updateStatusInDb(delivery.id, "in-transit")
                            }
                          >
                            Start Delivery
                          </Button>
                        )}

                        {delivery.status === "in-transit" && (
                          <Button
                            size="sm"
                            className="flex-1 bg-[#27AE60] hover:bg-[#229954] text-white"
                            onClick={() =>
                              updateStatusInDb(delivery.id, "delivered")
                            }
                          >
                            Confirm Delivery
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setSelectedDeliveryId(delivery.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
