
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DriverDeliveryDetail } from "./DriverDeliveryDetail";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useGPSUploader } from "../drivermaptracker/gpsTracker";
import { Package, MapPin, Truck, User, LogOut, Moon, Sun, Navigation } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";
import { PanToSelectedDriver } from "./PanToSelectedDriver";

interface Delivery {
  id: string;
  refNo: string;
  customer: string;
  address: string;
  status: "pending" | "assigned" | "in-transit" | "delivered" | "returned";
  paymentType: "COD" | "Paid";
  amount?: number;
}

interface DriverDashboardProps {
  deliveries: Delivery[];
  onUpdateStatus: (deliveryId: string, status: Delivery["status"]) => void;
  onUploadPOD: (deliveryId: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  driverName: string;
  stats: {
    total: number;
    completed: number;
    returned: number;
  };
}

export function DriverDashboard({
  deliveries,
  onUpdateStatus,
  onUploadPOD,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  driverName,
  stats,
}: DriverDashboardProps) {
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [driverId, setDriverId] = useState<string>("");
  const [fetchedDriverName, setFetchedDriverName] = useState<string>("");

  const mapRef = useRef<L.Map | null>(null);

  // Start GPS upload for this driver
  useGPSUploader();

  // Fetch driver ID and name
  useEffect(() => {
    const fetchDriverData = async () => {
      const { data: authUserData } = await supabase.auth.getUser();
      const userId = authUserData?.user?.id;
      if (!userId) {
        console.warn("No authenticated user found");
        return;
      }

      // First get the driver record
      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (driverError) {
        console.error("Failed to fetch driver UUID:", driverError);
        return;
      }

      if (!driver?.id) {
        console.error("Driver record not found for user:", userId);
        return;
      }

      setDriverId(driver.id);

      // Then get the user name
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Failed to fetch user name:", userError);
        return;
      }

      setFetchedDriverName(user?.full_name || "");
    };

    fetchDriverData();
  }, []);

  // Subscribe to driver's location updates
  useEffect(() => {
    if (!driverId) return;

    const fetchInitialLocation = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("last_lat, last_lng")
        .eq("id", driverId)
        .single();

      if (!error && data.last_lat && data.last_lng) {
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
          const { last_lat, last_lng } = payload.new;
          if (last_lat && last_lng) {
            setDriverLocation([last_lat, last_lng]);
          }
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

  // Auto-pan map when live GPS updates occur
  useEffect(() => {
    if (driverLocation && mapRef.current) {
      mapRef.current.setView(driverLocation, mapRef.current.getZoom());
    }
  }, [driverLocation]);

  // New effect to use PanToSelectedDriver for better panning management
  const selectedDriverForPan = driverLocation ? { location: { lat: driverLocation[0], lng: driverLocation[1] } } : null;

  const getStatusColor = (status: Delivery["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
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
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-[#1a2123] border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-[#27AE60]" />
              <h1 className="text-[#222B2D] dark:text-white">Driver Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Profile Icon with Tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{fetchedDriverName || driverName}</p>
                </TooltipContent>
              </Tooltip>
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleDarkMode}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              {/* Logout */}
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
        <main className="p-4 space-y-4">
          {selectedDelivery ? (
            <DriverDeliveryDetail
              delivery={selectedDelivery}
              onBack={() => setSelectedDeliveryId(null)}
              onUpdateStatus={(s) => {
                onUpdateStatus(selectedDelivery.id, s);
                setSelectedDeliveryId(null);
              }}
              onUploadPOD={() => onUploadPOD(selectedDelivery.id)}
            />
          ) : (
            <>
              {/* MAP VIEW */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <MapContainer
                    center={driverLocation || [14.5995, 120.9842]}
                    zoom={13}
                    style={{ height: "400px", width: "100%" }}
                    whenCreated={(map) => (mapRef.current = map)}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="© OpenStreetMap contributors"
                    />

                    <PanToSelectedDriver selectedDriver={selectedDriverForPan} role = "driver"/>

                    {driverLocation && (
                      <Marker position={driverLocation} icon={defaultIcon}>
                        <Popup>Your current location</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </CardContent>
              </Card>

              {/* DELIVERY LIST */}
              <h3 className="text-[#222B2D] dark:text-white mb-3">Assigned Deliveries</h3>

              {deliveries.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No deliveries assigned yet</p>
                  </CardContent>
                </Card>
              ) : (
                deliveries.map((delivery) => (
                  <Card
                    key={delivery.id}
                    className="border-0 shadow-sm hover:shadow-md transition cursor-pointer"
                    onClick={() => setSelectedDeliveryId(delivery.id)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[#222B2D] dark:text-white">{delivery.refNo}</p>
                          <p className="text-sm text-gray-500">{delivery.customer}</p>
                        </div>
                        <Badge className={getStatusColor(delivery.status)} variant="outline">
                          {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <p className="text-sm text-gray-500">{delivery.address}</p>
                      </div>

                      {delivery.paymentType === "COD" && delivery.amount && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            COD: ₱{delivery.amount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </main>

        {/* ROUTE BUTTON */}
        {!selectedDelivery && deliveries.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <Button
              size="icon"
              className="w-14 h-14 rounded-full bg-[#27AE60] hover:bg-[#229954] text-white shadow-lg"
              onClick={() => toast.info("Route map coming soon...")}
            >
              <Navigation className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
