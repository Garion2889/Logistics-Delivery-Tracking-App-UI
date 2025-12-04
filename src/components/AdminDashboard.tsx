import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Package, Truck, CheckCircle2, RotateCcw, UserPlus, MapPin, Users, Navigation } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { supabase } from "../utils/supabase/client";
import { AssignDriverModal } from "./AssignDriverModal";
import { toast } from "sonner";

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

interface Driver {
  id: string;
  name: string | null;
  status: "online" | "offline" | "on_delivery" | string;
  last_lat: number | null;
  last_lng: number | null;
  last_location_update: string | null;
  // Derived location object for easier map use
  location?: { lat: number; lng: number };
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

// Fix Leaflet Icons
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

const stringToColor = (str?: string | null) => {
  if (!str) return "#888";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 50%)`;
};

const getDriverIcon = (driver: Driver) => {
  const firstLetter = driver.name?.charAt(0).toUpperCase() ?? "?";
  const color = stringToColor(driver.name);

  return L.divIcon({
    className: "driver-icon",
    html: `<div class="driver-icon-wrapper" style="background-color: ${color}; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 50%; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3);">
             ${firstLetter}
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
  });
};

// ✅ Map Helper: Ensures map renders correctly and pans
function MapController({ selectedDriver }: { selectedDriver: Driver | null }) {
  const map = useMap();

  useEffect(() => {
    // Fix "Grey Box" issue by forcing a resize calculation
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    // Fly to driver if selected
    if (selectedDriver?.location) {
      map.flyTo([selectedDriver.location.lat, selectedDriver.location.lng], 14, {
        animate: true,
        duration: 1.5
      });
    }
    
    return () => clearTimeout(timer);
  }, [selectedDriver, map]);

  return null;
}

// --- Main Component ---

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<DriverOption[]>([]);
  
  // Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<PendingDelivery | null>(null);

  // Routing State
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [activeDestination, setActiveDestination] = useState<{lat: number, lng: number, address: string} | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  // Derived
  const selectedDriver = drivers.find(d => d.id === selectedDriverId) || null;

  // =================================================================
  // 1. FETCH DRIVERS & REALTIME UPDATES
  // =================================================================
  useEffect(() => {
    const fetchDrivers = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name, status, last_lat, last_lng, last_location_update");

      if (error) {
        console.error("Error fetching drivers:", error);
        return;
      }

      if (data) {
        const formatted: Driver[] = data.map((d: any) => ({
          ...d,
          // Create a clean location object if coords exist
          location: (d.last_lat && d.last_lng) ? { lat: d.last_lat, lng: d.last_lng } : undefined
        }));
        setDrivers(formatted);
      }
    };

    fetchDrivers();

    // Subscribe to 'drivers' table directly
    const channel = supabase.channel('admin-dashboard-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drivers' }, () => {
        fetchDrivers(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // =================================================================
  // 2. FETCH PENDING ORDERS & DRIVER OPTIONS
  // =================================================================
  useEffect(() => {
    const fetchPending = async () => {
      const { data } = await supabase
        .from('deliveries')
        .select('id, ref_no, customer_name, address, payment_type, status, assigned_driver, created_at, latitude, longitude')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setPendingDeliveries(data as unknown as PendingDelivery[] || []);
    };

    const fetchOptions = async () => {
      const { data } = await supabase
        .from('drivers')
        .select('id, name, status, vehicle_type, plate_number')
        .in('status', ['online', 'on_delivery']);

      if (data) {
        setAvailableDrivers(data.map((d: any) => ({
          id: d.id,
          name: d.name || 'Unknown',
          email: '',
          vehicle: `${d.vehicle_type || 'Vehicle'} - ${d.plate_number || ''}`,
          status: d.status,
          activeDeliveries: 0
        })));
      }
    };

    fetchPending();
    fetchOptions();
  }, []);

  // =================================================================
  // 3. AUTO-GEOCODING (Batch fix missing coords)
  // =================================================================
  useEffect(() => {
    const runBatchGeocode = async () => {
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
          } catch(e) { console.error("Geocode failed:", e); }
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    };
    runBatchGeocode();
  }, []);

  // =================================================================
  // 4. ROUTING LOGIC (Selected Driver -> Destination)
  // =================================================================
  useEffect(() => {
    setRoutePath([]);
    setActiveDestination(null);

    if (!selectedDriver?.location) return;

    const calculateRoute = async () => {
      // A. Find active job (Assigned, Picked Up, or In Transit)
      const { data: activeJob } = await supabase
        .from('deliveries')
        .select('id, latitude, longitude, address, status')
        .eq('assigned_driver', selectedDriver.id)
        .in('status', ['assigned', 'picked_up', 'in_transit'])
        .limit(1)
        .single();

      if (!activeJob) return;

      // Check Coords
      let destLat = activeJob.latitude;
      let destLng = activeJob.longitude;

      if (!destLat || !destLng) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(activeJob.address)}&limit=1`);
          const geo = await res.json();
          if (geo[0]) {
            destLat = parseFloat(geo[0].lat);
            destLng = parseFloat(geo[0].lon);
            // Save for future
            await supabase.from('deliveries').update({ latitude: destLat, longitude: destLng }).eq('id', activeJob.id);
          }
        } catch (e) { return; }
      }

      if (destLat && destLng) {
        setActiveDestination({ lat: destLat, lng: destLng, address: activeJob.address });
        
        // C. OSRM Routing
        try {
          // OSRM URL: startLng,startLat;endLng,endLat
          const url = `https://router.project-osrm.org/route/v1/driving/${selectedDriver.location!.lng},${selectedDriver.location!.lat};${destLng},${destLat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const json = await res.json();

          if (json.routes && json.routes[0]) {
            // Leaflet needs [lat, lng], OSRM gives [lng, lat]
            const path = json.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
            setRoutePath(path);
          } else {
            // Fallback: Straight line
            setRoutePath([[selectedDriver.location!.lat, selectedDriver.location!.lng], [destLat, destLng]]);
          }
        } catch (e) {
          console.error("Routing error:", e);
        }
      }
    };

    calculateRoute();
  }, [selectedDriverId, drivers]); // Re-run if selection changes or driver moves

  // --- Handlers ---
  const handleAssignDriver = (delivery: PendingDelivery) => {
    setSelectedDelivery(delivery);
    setAssignModalOpen(true);
  };

  const handleDriverAssigned = async (driverId: string) => {
    if (!selectedDelivery) return;
    
    const { error } = await supabase.from('deliveries').update({
      assigned_driver: driverId,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    }).eq('id', selectedDelivery.id);

    if (!error) {
      setPendingDeliveries(prev => prev.filter(d => d.id !== selectedDelivery.id));
      setAssignModalOpen(false);
      setSelectedDelivery(null);
      toast.success("Driver assigned successfully");
    } else {
      toast.error("Failed to assign driver");
    }
  };

  // --- Data for Charts & KPIs ---
  const deliveryStatusData = [
    { name: "Completed", value: stats.completedDeliveries, color: "#27AE60" },
    { name: "In Transit", value: stats.activeDeliveries, color: "#3498DB" },
    { name: "Pending", value: stats.pendingOrders, color: "#F39C12" },
    { name: "Returns", value: stats.returns, color: "#E74C3C" },
  ];

  const kpiCards = [
    { title: "Online Drivers", value: availableDrivers.length, icon: Users, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-900/20" },
    { title: "Pending Orders", value: stats.pendingOrders, icon: Package, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-900/20" },
    { title: "Active Deliveries", value: stats.activeDeliveries, icon: Truck, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "Completed", value: stats.completedDeliveries, icon: CheckCircle2, color: "text-[#27AE60]", bgColor: "bg-green-50 dark:bg-green-900/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[#222B2D] dark:text-white mb-2">Dashboard</h1>
        <p className="text-[#222B2D]/60 dark:text-white/60">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#222B2D]/60 dark:text-white/60 mb-1">{card.title}</p>
                    <p className="text-3xl text-[#222B2D] dark:text-white">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Delivery Status</CardTitle>
                <div className="flex items-center gap-1 text-[#27AE60]"><span className="text-sm">{stats.successRate}% Success</span></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={deliveryStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {deliveryStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {deliveryStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}: {item.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Live Operations Map</span>
                {selectedDriver && (
                  <Badge variant="secondary" className="animate-pulse border-blue-200 bg-blue-50 text-blue-700">
                    Tracking: {selectedDriver.name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {/* Wrapper with Fixed Height for Leaflet */}
               <div className="h-[500px] w-full relative z-0">
                  <MapContainer
                    center={selectedDriver?.location ? [selectedDriver.location.lat, selectedDriver.location.lng] : [14.5995, 120.9842]}
                    zoom={12}
                    style={{ height: "100%", width: "100%" }}
                    whenReady={(map) => (mapRef.current = map)}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap" />
                    
                    {/* Controller to handle map resizing and panning */}
                    <MapController selectedDriver={selectedDriver} />

                    {/* 1. Route Polyline */}
                    {routePath.length > 0 && (
                      <Polyline positions={routePath} color="#3B82F6" weight={5} opacity={0.7} />
                    )}

                    {/* 2. Destination Marker */}
                    {activeDestination && (
                      <Marker position={[activeDestination.lat, activeDestination.lng]} icon={L.divIcon({ className: "bg-red-600 w-4 h-4 rounded-full border-2 border-white shadow-md", iconSize: [16, 16] })}>
                        <Popup>Destination: {activeDestination.address}</Popup>
                      </Marker>
                    )}

                    {/* 3. Driver Markers */}
                    {drivers.map((driver) => {
                      if (!driver.location) return null;
                      return (
                        <Marker 
                          key={driver.id} 
                          position={[driver.location.lat, driver.location.lng]} 
                          icon={getDriverIcon(driver)}
                          eventHandlers={{ click: () => setSelectedDriverId(driver.id) }}
                        >
                          <Popup>
                            <strong>{driver.name || "Unknown"}</strong><br/>
                            Status: {driver.status}<br/>
                            Last Update: {new Date(driver.last_location_update || '').toLocaleTimeString()}
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                  
                  {/* Route Overlay Info */}
                  {activeDestination && (
                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 p-3 rounded-lg shadow-lg z-[1000] border text-xs flex justify-between items-center max-w-md">
                       <div>
                         <strong className="block text-gray-500 uppercase text-[10px]">Heading To</strong>
                         <span className="font-medium truncate max-w-[200px] block">{activeDestination.address}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-blue-600" />
                          <Badge className="bg-blue-600">En Route</Badge>
                       </div>
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

      {/* Assign Driver Modal */}
      <AssignDriverModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        drivers={availableDrivers}
        onAssign={handleDriverAssigned}
        deliveryDetails={selectedDelivery ? { refNo: selectedDelivery.ref_no, address: selectedDelivery.address } : undefined}
      />
    </div>
  );
}