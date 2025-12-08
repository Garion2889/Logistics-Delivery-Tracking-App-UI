import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DriverDeliveryDetail, Delivery, DeliveryStatus } from "@/components/DriverDeliveryDetail"; 
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useGPSUploader } from "../drivermaptracker/gpsTracker"; 
import { Truck, MapPin, User, LogOut, Moon, Sun, Navigation } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client"; 

// --- Map Icons ---
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// --- Helper: Pan Map ---
function PanToDriver({ location }: { location: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo(location, 15, { animate: true, duration: 1.5 });
  }, [location, map]);
  return null;
}

// --- Types ---
interface DriverRoute {
  id: string;
  name: string;
  stops: number;
  distance: number;
  estimatedTime: string;
  status: "active" | "planned" | "completed";
  deliveries: Delivery[];
  polyline: [number, number][];
}

interface DriverDashboardProps {
  driverId: string;
  driverName: string;
  onUpdateStatus?: (id: string, status: DeliveryStatus) => void;
  onUploadPOD: (id: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function DriverDashboard({
  driverId,
  driverName,
  onUploadPOD,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
}: DriverDashboardProps) {
  // --- State ---
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  
  // Routing State
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [activeDestination, setActiveDestination] = useState<{lat: number, lng: number} | null>(null);
  const [driverRoutes, setDriverRoutes] = useState<DriverRoute[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  // --- Helpers ---
  const mapStatus = (dbStatus: string): DeliveryStatus => {
    switch (dbStatus) {
      case "pending": return "pending";
      case "assigned": return "assigned";
      case "picked_up": return "picked_up";
      case "in-transit": case "in_transit": return "in-transit";
      case "delivered": return "delivered";
      case "returned": return "returned";
      case "rescheduled": return "rescheduled";
      default: return "pending";
    }
  };

  const toDbStatus = (status: DeliveryStatus) => {
    if (status === "in-transit") return "in_transit";
    return status;
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned": return "bg-blue-100 text-blue-800 border-blue-200";
      case "picked_up": return "bg-purple-100 text-purple-800 border-purple-200";
      case "in-transit": return "bg-orange-100 text-orange-800 border-orange-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "returned": return "bg-red-100 text-red-800 border-red-200";
      case "rescheduled": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // --- 1. Fetch Deliveries ---
  const fetchDriverDeliveries = useCallback(async (internalDriverId: string) => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("assigned_driver", internalDriverId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformed: Delivery[] = (data || []).map((d: any) => ({
        id: d.id,
        refNo: d.ref_no,
        customer: d.customer_name,
        address: d.address,
        status: mapStatus(d.status),
        paymentType: d.payment_type,
        amount: d.total_amount,
        phone: d.contact_number,
        latitude: d.latitude,
        longitude: d.longitude,
        type: d.type || "outbound",
      }));
      setDeliveries(transformed);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load deliveries");
    }
  }, []);

  // --- 2. Update Status (Clean RPC Version) ---
  const updateStatusInDb = async (deliveryId: string, nextStatus: DeliveryStatus, reason?: string) => {
    try {
      if (!driverId) throw new Error("Driver ID missing");

      // We send everything to the database function.
      // It handles timestamps, notes, and inventory logic automatically.
      const payload = {
        p_delivery_id: deliveryId,
        p_new_status: toDbStatus(nextStatus),
        p_reason: reason || null, // Send reason (e.g. "Damaged") or null
      };

      const { error } = await supabase.rpc("update_order_status", payload);

      if (error) throw error;

      // Optimistic Update (Update UI instantly)
      setDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? { ...d, status: nextStatus } : d))
      );
      
      toast.success(`Updated: ${nextStatus.replace('_', ' ').toUpperCase()}`);

    } catch (e: any) {
      console.error("Update failed:", e);
      toast.error(e.message || "Failed to update status");
    }
  };

  // --- 3. Subscriptions ---
  useEffect(() => {
    if (!driverId) return;
    fetchDriverDeliveries(driverId);

    const channel = supabase
      .channel(`driver-deliveries-${driverId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "deliveries", filter: `assigned_driver=eq.${driverId}` }, 
        () => fetchDriverDeliveries(driverId)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [driverId, fetchDriverDeliveries]);

  // --- 4. GPS Tracking ---
  useGPSUploader(driverId);

  useEffect(() => {
    if (!driverId) return;
    const fetchLoc = async () => {
      const { data } = await supabase.from("drivers").select("last_lat, last_lng").eq("id", driverId).single();
      if (data?.last_lat && data?.last_lng) setDriverLocation([data.last_lat, data.last_lng]);
    };
    fetchLoc();
    
    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "drivers", filter: `id=eq.${driverId}` }, 
        (payload: any) => {
          if (payload.new.last_lat) setDriverLocation([payload.new.last_lat, payload.new.last_lng]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [driverId]);

  // --- 5. Full Route Optimization ---
  const createDriverRoutes = useCallback(async () => {
    if (!driverId || !driverLocation || deliveries.length === 0) {
      setDriverRoutes([]);
      return;
    }

    try {
      const activeDeliveries = deliveries.filter(d => ['assigned', 'picked_up', 'in-transit'].includes(d.status));
      const completedDeliveries = deliveries.filter(d => d.status === 'delivered');

      const routes: DriverRoute[] = [];

      if (activeDeliveries.length > 0) {
        const coords = [
          [driverLocation[1], driverLocation[0]], 
          ...activeDeliveries
            .filter(d => d.longitude && d.latitude)
            .map(d => [d.longitude!, d.latitude!])
        ];

        if (coords.length > 1) {
          try {
            const url = `https://router.project-osrm.org/trip/v1/driving/${coords.join(';')}?source=first&roundtrip=false&overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.code === 'Ok' && data.trips && data.trips.length > 0) {
              const trip = data.trips[0];
              routes.push({
                id: 'active-route',
                name: 'Active Deliveries Route',
                stops: activeDeliveries.length,
                distance: trip.distance / 1000,
                estimatedTime: `${Math.round(trip.duration / 60)} min`,
                status: 'active',
                deliveries: activeDeliveries,
                polyline: trip.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])
              });
            }
          } catch (e) {
            console.error("Error creating active route:", e);
          }
        }
      }
      setDriverRoutes(routes);
    } catch (err) {
      console.error("Error creating driver routes:", err);
    }
  }, [driverId, driverLocation, deliveries]);

  // --- 6. Active Point-to-Point Routing ---
  useEffect(() => {
    createDriverRoutes();

    if (!driverId || !driverLocation || deliveries.length === 0) {
      setRoutePath([]);
      setActiveDestination(null);
      return;
    }

    const calculateRoute = async () => {
      const priorityOrder: DeliveryStatus[] = ["in-transit", "picked_up", "assigned"];
      let nextDelivery: Delivery | undefined;

      for (const s of priorityOrder) {
        nextDelivery = deliveries.find((d) => d.status === s);
        if (nextDelivery) break;
      }

      if (!nextDelivery) {
        setRoutePath([]); 
        setActiveDestination(null);
        return;
      }

      let { latitude: lat, longitude: lng } = nextDelivery;

      if (!lat || !lng) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nextDelivery.address)}&limit=1`);
          const geo = await res.json();
          if (geo[0]) {
            lat = parseFloat(geo[0].lat);
            lng = parseFloat(geo[0].lon);
            await supabase.from("deliveries").update({ latitude: lat, longitude: lng }).eq("id", nextDelivery.id);
          }
        } catch (e) { console.error("Geocode error", e); }
      }

      if (lat && lng) {
        setActiveDestination({ lat, lng });
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${driverLocation[1]},${driverLocation[0]};${lng},${lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.routes?.[0]) {
            setRoutePath(json.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]));
          } else {
            setRoutePath([driverLocation, [lat, lng]]);
          }
        } catch (e) { console.error("Routing error", e); }
      }
    };

    calculateRoute();
  }, [driverId, driverLocation, deliveries, createDriverRoutes]);

  const selectedDelivery = deliveries.find((d) => d.id === selectedDeliveryId);

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#F6F7F8] dark:bg-[#222B2D]">
        
        <header className="sticky top-0 z-10 bg-white dark:bg-[#1a2123] border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-[#27AE60]" />
            <h1 className="text-[#222B2D] dark:text-white font-bold">Driver Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Tooltip>
               <TooltipTrigger asChild><Button variant="ghost" size="icon"><User className="w-5 h-5" /></Button></TooltipTrigger>
               <TooltipContent><p>{driverName || "Driver"}</p></TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" onClick={onToggleDarkMode}>
               {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout} className="text-red-600">
               <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <main className="p-4 space-y-4">
          {selectedDelivery ? (
            <DriverDeliveryDetail
              delivery={selectedDelivery}
              onBack={() => setSelectedDeliveryId(null)}
              onUpdateStatus={(s, reason) => {
                updateStatusInDb(selectedDelivery.id, s, reason);
                setSelectedDeliveryId(null);
              }}
              onUploadPOD={() => onUploadPOD(selectedDelivery.id)}
            />
          ) : (
            <>
              {/* Map View */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="h-[400px] w-full relative rounded-lg overflow-hidden z-0">
                    <MapContainer center={driverLocation || [14.5995, 120.9842]} zoom={13} style={{ height: "100%", width: "100%" }} whenReady={(map) => (mapRef.current = map)}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap" />
                      <PanToDriver location={driverLocation} />
                      
                      {driverLocation && <Marker position={driverLocation} icon={defaultIcon}><Popup>You</Popup></Marker>}
                      
                      {activeDestination && (
                         <Marker position={[activeDestination.lat, activeDestination.lng]} icon={L.divIcon({ className: "bg-red-600 w-4 h-4 rounded-full border-2 border-white shadow", iconSize: [16, 16] })}>
                           <Popup>Next Stop</Popup>
                         </Marker>
                      )}

                      {routePath.length > 0 && <Polyline positions={routePath} color="#3B82F6" weight={5} opacity={0.8} />}
                    </MapContainer>

                    {activeDestination && (
                       <div className="absolute bottom-4 left-4 right-4 bg-white/90 p-3 rounded shadow z-[1000] text-xs border flex justify-between">
                         <span><strong>Next Stop:</strong> Routing Active</span>
                         <Navigation className="w-4 h-4 text-blue-600"/>
                       </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery List */}
              <h3 className="text-[#222B2D] dark:text-white font-semibold mb-2">Assigned Deliveries</h3>
              {deliveries.length === 0 ? (
                <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center text-gray-500">No deliveries assigned.</CardContent></Card>
              ) : (
                deliveries.map((delivery) => (
                  <Card key={delivery.id} className="border-0 shadow-sm hover:shadow-md transition">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-[#222B2D] dark:text-white">{delivery.refNo}</p>
                          <p className="text-sm text-gray-500">{delivery.customer}</p>
                        </div>
                        <Badge className={getStatusColor(delivery.status)} variant="outline">{delivery.status.replace('_', ' ').toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <p className="text-sm text-gray-500">{delivery.address}</p>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {delivery.status === "assigned" && (
                          <Button size="sm" className="flex-1 bg-[#27AE60] text-white hover:bg-[#219150]" onClick={() => updateStatusInDb(delivery.id, "picked_up")}>Accept</Button>
                        )}
                        {delivery.status === "picked_up" && (
                          <Button size="sm" className="flex-1 bg-blue-600 text-white hover:bg-blue-700" onClick={() => updateStatusInDb(delivery.id, "in-transit")}>Start</Button>
                        )}
                        {delivery.status === "in-transit" && (
                          <Button size="sm" className="flex-1 bg-[#27AE60] text-white hover:bg-[#219150]" onClick={() => updateStatusInDb(delivery.id, "delivered")}>Confirm</Button>
                        )}
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedDeliveryId(delivery.id)}>Details</Button>
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