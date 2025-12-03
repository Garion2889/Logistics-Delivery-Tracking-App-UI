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
import { Package, MapPin, Truck, User, LogOut, Moon, Sun, Navigation } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";

// Fix default Leaflet icon
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Delivery {
  id: string;
  driver_id: string;
  refNo: string;
  customer: string;
  address: string;
  status: "pending" | "assigned" | "picked_up" | "in-transit" | "delivered" | "returned";
  paymentType: "COD" | "Paid";
  amount?: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface DriverDashboardProps {
  onUpdateStatus: (deliveryId: string, status: Delivery["status"]) => void;
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
  onUpdateStatus,
  onUploadPOD,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
}: DriverDashboardProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [driverId, setDriverId] = useState<string>("");
  const [driverName, setDriverName] = useState<string>("");
  const mapRef = useRef<L.Map | null>(null);

  // ✅ NEW: State for OSRM Route Shape & Active Destination
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [activeDestination, setActiveDestination] = useState<{lat: number, lng: number} | null>(null);

  // Map DB status -> dashboard status
  const mapStatus = (dbStatus: string): Delivery["status"] => {
    switch (dbStatus) {
      case "pending": return "pending";
      case "assigned": return "assigned";
      case "picked_up": return "picked_up";
      case "in_transit": return "in-transit";
      case "delivered": return "delivered";
      case "returned": return "returned";
      default: return "pending";
    }
  };

  // 1. Fetch driver ID and name
  useEffect(() => {
    const fetchDriverData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return;

      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", userId)
        .single();
      if (driverError || !driver?.id) return;
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

  // 2. Fetch driver-specific deliveries
  const fetchDriverDeliveries = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("assigned_driver", driverId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformed = (data || []).map((d: any) => ({
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
      toast.error(`Failed to fetch deliveries: ${err.message}`);
    }
  };

  // 3. Subscribe to driver deliveries updates
  useEffect(() => {
    if (!driverId) return;
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

    return () => { supabase.removeChannel(channel); };
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
          if (last_lat && last_lng) setDriverLocation([last_lat, last_lng]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [driverId]);

  // =================================================================
  // ✅ 6. ROUTING LOGIC (Calculates Route & Destination)
  // =================================================================
  useEffect(() => {
    if (!driverId || !driverLocation || deliveries.length === 0) {
      setRoutePath([]);
      setActiveDestination(null);
      return;
    }

    const fetchRouteToNextDelivery = async () => {
      try {
        // Find next delivery (prioritize in_transit -> picked_up -> assigned)
        const priorityOrder = ['in-transit', 'picked_up', 'assigned'];
        let nextDelivery: Delivery | undefined;
        
        for (const status of priorityOrder) {
          nextDelivery = deliveries.find(d => d.status === status);
          if (nextDelivery) break;
        }

        if (!nextDelivery) {
          setRoutePath([]);
          setActiveDestination(null);
          return;
        }

        // Check if delivery has coordinates, geocode if needed
        let deliveryLat = nextDelivery.latitude;
        let deliveryLng = nextDelivery.longitude;

        if (!deliveryLat || !deliveryLng) {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nextDelivery.address)}&limit=1`
            );
            const geo = await res.json();

            if (geo.length > 0) {
              deliveryLat = parseFloat(geo[0].lat);
              deliveryLng = parseFloat(geo[0].lon);

              // Update Supabase so we don't geocode again
              await supabase
                .from("deliveries")
                .update({ latitude: deliveryLat, longitude: deliveryLng })
                .eq("id", nextDelivery.id);
            }
          } catch (err) {
            console.error("Failed to geocode delivery:", nextDelivery.address, err);
          }
        }

        if (!deliveryLat || !deliveryLng) {
          setRoutePath([]);
          setActiveDestination(null);
          return;
        }

        // Set Active Destination for Marker
        setActiveDestination({ lat: deliveryLat, lng: deliveryLng });

        // Fetch route from OSRM
        const url = `https://router.project-osrm.org/route/v1/driving/${driverLocation[1]},${driverLocation[0]};${deliveryLng},${deliveryLat}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          // Swap [lng, lat] to [lat, lng] for Leaflet
          const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          setRoutePath(coordinates);
        } else {
          // Fallback to straight line
          setRoutePath([driverLocation, [deliveryLat, deliveryLng]]);
        }
      } catch (err) {
        console.error("Failed to fetch route:", err);
        setRoutePath([]);
      }
    };

    fetchRouteToNextDelivery();
  }, [driverId, driverLocation, deliveries]);

  const selectedDelivery = deliveries.find(d => d.id === selectedDeliveryId);

  // Helper to cycle status
  const getStatusColor = (status: Delivery["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-transit": return "bg-orange-100 text-orange-800 border-orange-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "returned": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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
              <h1 className="text-[#222B2D] dark:text-white">Driver Dashboard</h1>
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
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout} className="text-red-600">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
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
              {/* MAP CARD */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="h-[400px] w-full relative z-0 rounded-lg overflow-hidden">
                    <MapContainer
                      center={driverLocation || [14.5995, 120.9842]}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                      whenReady={(map) => (mapRef.current = map)}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="© OpenStreetMap contributors"
                      />
                      
                      <PanToDriver location={driverLocation} />

                      {/* 1. Driver Marker */}
                      {driverLocation && (
                        <Marker position={driverLocation} icon={defaultIcon}>
                          <Popup>You are here</Popup>
                        </Marker>
                      )}

                      {/* 2. Destination Marker */}
                      {activeDestination && (
                        <Marker 
                          position={[activeDestination.lat, activeDestination.lng]} 
                          icon={L.divIcon({
                            className: "bg-red-600 w-4 h-4 rounded-full border-2 border-white shadow-lg",
                            iconSize: [16, 16]
                          })}
                        >
                          <Popup>Destination</Popup>
                        </Marker>
                      )}

                      {/* 3. Route Line */}
                      {routePath.length > 0 && (
                        <Polyline
                          positions={routePath}
                          color="#3B82F6"
                          weight={5}
                          opacity={0.8}
                        />
                      )}
                    </MapContainer>
                    
                    {/* Overlay Info */}
                    {activeDestination && (
                       <div className="absolute bottom-4 left-4 right-4 bg-white/90 p-3 rounded-lg shadow-lg z-[1000] text-xs border">
                          <strong>Next Stop:</strong> Calculating route...
                       </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* DELIVERIES LIST */}
              <h3 className="text-[#222B2D] dark:text-white mb-3 font-semibold">Assigned Tasks</h3>
              {deliveries.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No deliveries assigned yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <Card key={delivery.id} className="border-0 shadow-sm hover:shadow-md transition">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[#222B2D] dark:text-white font-medium">{delivery.refNo}</p>
                          <p className="text-sm text-gray-500">{delivery.customer}</p>
                        </div>
                        <Badge className={getStatusColor(delivery.status)} variant="outline">
                          {delivery.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                        <p className="text-sm text-gray-500">{delivery.address}</p>
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
                            onClick={() => onUpdateStatus(delivery.id, "picked_up")}
                          >
                            Accept / Pick Up
                          </Button>
                        )}

                        {delivery.status === "picked_up" && (
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => onUpdateStatus(delivery.id, "in-transit")}
                          >
                            Start Delivery
                          </Button>
                        )}

                        {delivery.status === "in-transit" && (
                          <Button
                            size="sm"
                            className="flex-1 bg-[#27AE60] hover:bg-[#229954] text-white"
                            onClick={() => onUpdateStatus(delivery.id, "delivered")}
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
                ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}