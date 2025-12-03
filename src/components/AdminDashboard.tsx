import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Package, Truck, CheckCircle2, RotateCcw, UserPlus, MapPin } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../utils/supabase/client";
import { PanToSelectedDriver } from "./PanToSelectedDriver";


// --- Interfaces ---

interface DashboardStats {
  pendingOrders: number;
  activeDeliveries: number;
  completedDeliveries: number;
  returns: number;
  successRate: number;
}

interface AdminDashboardProps {
  stats: DashboardStats;
}

interface LiveDriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

interface Driver {
  id?: string;
  name?: string;
}

interface PendingDelivery {
  id: string;
  ref_no: string;
  customer_name: string;
  address: string;
  payment_type: "COD" | "Paid";
  status: string;
  assigned_driver: string | null;
  created_at: string;
  // Added for geocoding support
  latitude?: number | null;
  longitude?: number | null;
}

interface DriverOption {
  id: string;
  name: string;
  email: string;
  vehicle: string;
  status: "online" | "offline";
  activeDeliveries: number;
}

// --- Helpers ---

const stringToColor = (str?: string) => {
  if (!str) return "#888"; // fallback color for missing names
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 50%)`;
};

const getDriverIcon = (driver: { name?: string }) => {
  const firstLetter = driver.name?.charAt(0).toUpperCase() ?? "?";
  const color = stringToColor(driver.name);

  return L.divIcon({
    className: "driver-icon",
    html: `<div class="driver-icon-wrapper" style="background-color: ${color}; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 50%; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
             ${firstLetter}
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
  });
};

// --- Components ---

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const [driverLocations, setDriverLocations] = useState<LiveDriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<LiveDriverLocation | null>(null);
  const [drivers, setDrivers] = useState<Record<string, Driver>>({});
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<DriverOption[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<PendingDelivery | null>(null);

  // ✅ NEW: State for OSRM Route Shape and Destination
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [activeDestination, setActiveDestination] = useState<{lat: number, lng: number, address: string} | null>(null);

  // 1. Fetch driver info
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("drivers").select("id, name");
      if (error) {
        console.error("Failed to fetch drivers:", error);
        return;
      }

      const driverMap: Record<string, Driver> = {};
      data.forEach((driver: any) => {
        driverMap[driver.id] = { id: driver.id, name: driver.name };
      });

      setDrivers(driverMap);
    })();
  }, []);

  // 2. Fetch pending deliveries and available drivers
  useEffect(() => {
    const fetchPendingDeliveries = async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, ref_no, customer_name, address, payment_type, status, assigned_driver, created_at, latitude, longitude')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error("Failed to fetch pending deliveries:", error);
        return;
      }

      setPendingDeliveries(data || []);
    };

    const fetchAvailableDrivers = async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, name, email, vehicle_type, plate_number, status')
        .in('status', ['online', 'on_delivery']);

      if (error) {
        console.error("Failed to fetch available drivers:", error);
        return;
      }

      const formattedDrivers: DriverOption[] = (data || []).map(d => ({
        id: d.id,
        name: d.name || 'Unknown Driver',
        email: d.email || '',
        vehicle: `${d.vehicle_type} - ${d.plate_number || 'No plate'}`,
        status: d.status as "online" | "offline",
        activeDeliveries: 0,
      }));

      setAvailableDrivers(formattedDrivers);
    };

    fetchPendingDeliveries();
    fetchAvailableDrivers();
  }, []);

  // 3. Subscribe to real-time driver GPS updates
  useEffect(() => {
    const channel = supabase
      .channel("live-driver-locations")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "driver_locations" },
        (payload) => {
          const updated = payload.new as LiveDriverLocation;

          setDriverLocations((prev) => {
            const exists = prev.find((d) => d.driver_id === updated.driver_id);
            if (exists) {
              return prev.map((d) =>
                d.driver_id === updated.driver_id ? updated : d
              );
            }
            return [...prev, updated];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-select latest updated driver (optional, kept from previous behavior)
  useEffect(() => {
    if (driverLocations.length > 0 && !selectedDriver) {
      const sortedDrivers = [...driverLocations].sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      );
      setSelectedDriver(sortedDrivers[0]);
    }
  }, [driverLocations, selectedDriver]);

  // =================================================================
  // ✅ 4. NEW: BATCH GEOCODING (Fix missing coords automatically)
  // =================================================================
  useEffect(() => {
    const runBatchGeocode = async () => {
      // Find pending or active deliveries with no coordinates
      const { data } = await supabase.from("deliveries").select("id, address").is('latitude', null).limit(5);
      
      if (data && data.length > 0) {
        for (const d of data) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(d.address)}&limit=1`);
            const geo = await res.json();
            if (geo[0]) {
              await supabase.from("deliveries").update({ 
                latitude: parseFloat(geo[0].lat), 
                longitude: parseFloat(geo[0].lon) 
              }).eq("id", d.id);
            }
          } catch(e) { console.error("Batch geocode failed:", e); }
          
          await new Promise((r) => setTimeout(r, 1200)); // Rate limit
        }
      }
    };
    runBatchGeocode();
  }, []);

  // =================================================================
  // ✅ 5. NEW: ROUTING LOGIC (Calculates route for selected driver)
  // =================================================================
  useEffect(() => {
    // If no driver selected, clear map lines
    if (!selectedDriver) {
      setRoutePath([]);
      setActiveDestination(null);
      return;
    }

    const calculateRoute = async () => {
      // A. Find what this driver is currently working on (In Transit or Picked Up)
      const { data: activeJob } = await supabase
        .from('deliveries')
        .select('id, latitude, longitude, address')
        .eq('assigned_driver', selectedDriver.driver_id)
        .in('status', ['in_transit', 'picked_up'])
        .limit(1)
        .single();

      if (!activeJob) {
        setRoutePath([]);
        setActiveDestination(null);
        return;
      }

      // B. If missing coords, try to quick geocode
      let destLat = activeJob.latitude;
      let destLng = activeJob.longitude;

      if (!destLat || !destLng) {
         try {
           const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(activeJob.address)}&limit=1`);
           const geo = await res.json();
           if (geo[0]) {
             destLat = parseFloat(geo[0].lat);
             destLng = parseFloat(geo[0].lon);
           }
         } catch (e) { return; }
      }

      if (destLat && destLng) {
         setActiveDestination({ lat: destLat, lng: destLng, address: activeJob.address });

         // C. Call OSRM Routing API
         try {
           const url = `https://router.project-osrm.org/route/v1/driving/${selectedDriver.longitude},${selectedDriver.latitude};${destLng},${destLat}?overview=full&geometries=geojson`;
           const res = await fetch(url);
           const json = await res.json();

           if (json.routes && json.routes[0]) {
             // Flip coords for Leaflet [lat, lng]
             const path = json.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
             setRoutePath(path);
           } else {
             // Fallback straight line
             setRoutePath([[selectedDriver.latitude, selectedDriver.longitude], [destLat, destLng]]);
           }
         } catch (e) {
           console.error("Routing error:", e);
           // Fallback
           setRoutePath([[selectedDriver.latitude, selectedDriver.longitude], [destLat, destLng]]);
         }
      }
    };

    calculateRoute();
  }, [selectedDriver]); // Run when selectedDriver changes or updates location

  const deliveryStatusData = [
    { name: "Completed", value: stats.completedDeliveries, color: "#27AE60" },
    { name: "In Transit", value: stats.activeDeliveries, color: "#3498DB" },
    { name: "Pending", value: stats.pendingOrders, color: "#F39C12" },
    { name: "Returned", value: stats.returns, color: "#E74C3C" },
  ];

  const kpiCards = [
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Active Deliveries",
      value: stats.activeDeliveries,
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Completed",
      value: stats.completedDeliveries,
      icon: CheckCircle2,
      color: "text-[#27AE60]",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Returns",
      value: stats.returns,
      icon: RotateCcw,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  ];

  // Handler for opening assign modal
  const handleAssignDriver = (delivery: PendingDelivery) => {
    setSelectedDelivery(delivery);
    setAssignModalOpen(true);
    // Clear route when selecting a new delivery to avoid confusion
    setRoutePath([]);
    setActiveDestination(null);
  };

  // Handler for assigning driver
  const handleDriverAssigned = async (driverId: string) => {
    if (!selectedDelivery) return;

    try {
      const { error } = await supabase
        .from('deliveries')
        .update({
          assigned_driver: driverId,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', selectedDelivery.id);

      if (error) {
        console.error("Failed to assign driver:", error);
        alert("Failed to assign driver. Please try again.");
        return;
      }

      // Update local state
      setPendingDeliveries(prev => prev.filter(d => d.id !== selectedDelivery.id));
      setAssignModalOpen(false);
      setSelectedDelivery(null);

      alert("Driver assigned successfully!");
    } catch (err) {
      console.error("Error assigning driver:", err);
      alert("An error occurred while assigning the driver.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[#222B2D] dark:text-white mb-2">Dashboard</h1>
        <p className="text-[#222B2D]/60 dark:text-white/60">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#222B2D]/60 dark:text-white/60 mb-1">
                      {card.title}
                    </p>
                    <p className="text-3xl text-[#222B2D] dark:text-white">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Area: Charts & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts & Tables */}
        <div className="lg:col-span-1 space-y-6">
           {/* Delivery Status Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Delivery Status</CardTitle>
                <div className="flex items-center gap-1 text-[#27AE60]">
                  <span className="text-sm">{stats.successRate}% Success</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deliveryStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deliveryStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {deliveryStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs text-[#222B2D]/60 dark:text-white/60">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

       {/* Right Column: Map & Live Tracking */}
<div className="lg:col-span-2 space-y-6">
  <Card className="border-0 shadow-sm">
    <CardHeader>
      <CardTitle>Live Driver Tracking</CardTitle>
    </CardHeader>

    <CardContent className="p-0">
      <div className="w-full relative" style={{ height: "365px" }}>
        <MapContainer
          center={
            selectedDriver?.latitude && selectedDriver?.longitude
              ? [selectedDriver.latitude, selectedDriver.longitude]
              : [14.5995, 120.9842] // Manila fallback
          }
          zoom={13}
          style={{ height: "100%", width: "100%" }}   // <- guaranteed height
        >
          {/* Tile Layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Auto-Pan */}
          <PanToSelectedDriver
            selectedDriver={
              selectedDriver &&
              selectedDriver.latitude &&
              selectedDriver.longitude
                ? { location: { lat: selectedDriver.latitude, lng: selectedDriver.longitude } }
                : null
            }
            role="driver"
          />

          {/* Route Path */}
          {Array.isArray(routePath) &&
            routePath.length > 0 &&
            routePath.every((p) => Array.isArray(p) && p.length === 2) && (
              <Polyline
                positions={routePath}
                color="#3B82F6"
                weight={6}
                opacity={0.7}
              />
            )}

          {/* Destination Marker */}
          {activeDestination?.lat && activeDestination?.lng && (
            <Marker
              position={[activeDestination.lat, activeDestination.lng]}
              icon={L.divIcon({
                className:
                  "bg-red-600 w-4 h-4 rounded-full border-2 border-white shadow-lg",
                iconSize: [16, 16],
              })}
            >
              <Popup>
                <strong className="text-xs">Destination</strong>
                <br />
                <span className="text-xs">{activeDestination.address}</span>
              </Popup>
            </Marker>
          )}

          {/* Driver Markers */}
          {driverLocations
            .filter(
              (d) =>
                d.latitude &&
                d.longitude &&
                !isNaN(d.latitude) &&
                !isNaN(d.longitude)
            )
            .map((driver) => (
              <Marker
                key={driver.driver_id}
                position={[driver.latitude, driver.longitude]}
                icon={getDriverIcon(drivers[driver.driver_id] || {})}
                eventHandlers={{
                  click: () => setSelectedDriver(driver),
                }}
              >
                <Popup>
                  <b>Driver:</b>{" "}
                  {drivers[driver.driver_id]?.name ?? "Unknown"} <br />
                  <b>Last update:</b>{" "}
                  {new Date(driver.recorded_at).toLocaleTimeString()}
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Destination Overlay */}
        {activeDestination && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 p-3 rounded-lg shadow-lg z-[1000] border text-xs flex justify-between items-center">
            <div>
              <strong className="block text-gray-500 uppercase text-[10px]">
                Heading To
              </strong>
              <span className="font-medium truncate max-w-[200px] block">
                {activeDestination.address}
              </span>
            </div>
            <Badge className="bg-blue-600">En Route</Badge>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
</div>


      </div>

      {/* Pending Orders List */}
      <Card className="border-0 shadow-sm mt-6">
         <CardHeader><CardTitle>Pending Orders</CardTitle></CardHeader>
         <CardContent>
             {/* Add your pending orders table here if needed, using pendingDeliveries state */}
             <div className="space-y-2">
                {pendingDeliveries.map(order => (
                    <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                            <p className="font-medium">{order.ref_no} - {order.customer_name}</p>
                            <p className="text-xs text-gray-500">{order.address}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAssignDriver(order)}>
                            <UserPlus className="w-4 h-4 mr-2" /> Assign Driver
                        </Button>
                    </div>
                ))}
                {pendingDeliveries.length === 0 && <p className="text-center text-gray-500 py-4">No pending orders.</p>}
             </div>
         </CardContent>
      </Card>
    </div>
  );
}