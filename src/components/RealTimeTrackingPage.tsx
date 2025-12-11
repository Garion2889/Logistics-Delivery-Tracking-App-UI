import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import {
  MapPin,
  Navigation,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Search,
  Users,
  TrendingUp,
  Navigation2,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// --- Interfaces ---

interface Driver {
  id: string; // uuid
  user_id: string; // uuid
  name: string | null;
  vehicle_type: 'motorcycle' | 'car' | 'van' | 'truck';
  plate_number: string | null;
  license_number?: string | null;
  status: 'online' | 'offline' | 'on_delivery' | 'maintenance';
  last_lat: number | null;
  last_lng: number | null;
  last_location_update: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  location: { lat: number; lng: number } | null;
  currentRoute?: string;
  completedStops: number;
  totalStops: number;
  distance: number;
  eta: string;
  lastUpdate: string;
  speed?: number; // Added optional speed field to match usage
  record_at?: string; // Added optional record_at to match usage
}

interface LocationHistory {
  location_history_id?: string;
  driver_id?: string;
  lat: number;
  lng: number;
  speed: number;
  recorded_at: string;
}

interface Delivery {
  id: string;
  ref_no: string;
  customer_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  assigned_driver: string | null;
}

// --- Icons ---

// Fix for default marker icon issues in React-Leaflet
const defaultIcon = new L.Icon({
  iconUrl: markerIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
});

// --- Helper: Pan Map ---
function PanToSelectedDriver({ selectedDriver }: { selectedDriver: Driver | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedDriver?.location) {
      map.flyTo([selectedDriver.location.lat, selectedDriver.location.lng], 14, {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedDriver, map]);
  return null;
}

// ------------------ Main Component ------------------

export function RealTimeTrackingPage() {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [playbackIndex, setPlaybackIndex] = useState(0);

  // State for Routing and Destination
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [activeDestination, setActiveDestination] = useState<Delivery | null>(null);

  // --- Playback Logic ---
  useEffect(() => {
    if (!isPlaying || locationHistory.length === 0) return;

    const interval = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= locationHistory.length - 1) {
          setIsPlaying(false); // Stop at end
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed[0]);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, locationHistory]);

  // Reset playbackIndex when driver changes
  useEffect(() => {
    setPlaybackIndex(0);
    setRoutePath([]);
    setActiveDestination(null);
  }, [selectedDriver?.id]); // Only reset if ID changes

  // Current location for map marker highlight
  const currentPlaybackLocation = locationHistory[playbackIndex];

  // Handlers for skip buttons
  const handleSkipBack = () => setPlaybackIndex((prev) => Math.max(prev - 1, 0));
  const handleSkipForward = () => setPlaybackIndex((prev) => Math.min(prev + 1, locationHistory.length - 1));

  // --- Manual Log Function ---
  const log_location_history = async (driverId: string, lat: number, lng: number) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/last_location_recorder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            id: driverId,
            last_lat: lat,
            last_lng: lng,
          }),
        }
      );

      const data = await res.json();

      if (data?.recorded) {
        setLocationHistory(prev => [
          {
            lat: data.recorded.lat, 
            lng: data.recorded.lng, 
            speed: 0,
            recorded_at: data.recorded.recorded_at,
          },
          ...prev,
        ]);
        toast.success("Location logged manually");
      }
    } catch (err) {
      console.error("Error logging location history:", err);
    }
  };

  // --- Auto Log Interval ---
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/last_location_recorder`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );
      } catch (err) {
        console.error("Error logging driver locations:", err);
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  // --- Helper: String to Color ---
  const stringToColor = (str: string | null) => {
    if(!str) return '#ccc';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 70%, 50%)`;
  };

  const getDriverIcon = (driver: Driver) => {
    const color = stringToColor(driver.name);
    return L.divIcon({
      className: "driver-icon",
      html: `
        <div class="driver-icon-wrapper" style="background-color: ${color}; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -35],
    });
  };
useEffect(() => {
  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase.from('deliveries').select('*');

      if (error) {
        console.error('Error fetching deliveries:', error);
        return;
      }

      if (data) {
        setDeliveries(data);
      }
    } catch (err) {
      console.error('Error in fetchDeliveries:', err);
    }
  };

  fetchDeliveries();
}, []);

  // --- 1. Fetch Drivers ---
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { data, error } = await supabase.from('drivers').select('*');
        if (error) {
          console.error('Error fetching drivers:', error);
          return;
        }

        if (data) {
          const driversWithLocation = await Promise.all(
            data.map(async (d) => {
              const { data: latestLoc } = await supabase
                .from("driver_locations")
                .select("*")
                .eq("driver_id", d.id)
                .order("recorded_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              return {
                ...d,
                location: latestLoc?.latitude && latestLoc?.longitude
                  ? { lat: latestLoc.latitude, lng: latestLoc.longitude }
                  : null,
                lastUpdate: latestLoc
                  ? new Date(latestLoc.recorded_at).toLocaleTimeString()
                  : "Unknown",
                speed: latestLoc?.speed != null 
                  ? parseFloat((latestLoc.speed / 1000).toFixed(3)) // Convert m/s to km/h usually, or keep if already km/h
                  : 0,
                record_at: latestLoc?.recorded_at,
                distance: 0,
                completedStops: 0,
                totalStops: 0,  
                eta: "N/A",
                currentRoute: "",
              };
            })
          );

          setDrivers(driversWithLocation);

          const driverWithLocation = driversWithLocation.find(
            d => d.last_location_update !== null || d.location !== null
          );

          // Only set initial driver if none selected
          setSelectedDriver(prev => prev ? prev : (driverWithLocation || null));
        }

      } catch (err) {
        console.error('Error in fetchDrivers:', err);
      }
    };

    fetchDrivers();

    const sub = supabase.channel('drivers-realtime-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => fetchDrivers())
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  // --- 2. Fetch Location History ---
  const fetchLocationHistory = async (driverId: string) => {
    try {
      let query = supabase
        .from('driver_location_history')
        .select('lat, lng, recorded_at')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: true });

      if (filterStartDate) query = query.gte('recorded_at', filterStartDate);
      if (filterEndDate) query = query.lte('recorded_at', filterEndDate);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching location history:', error);
        setLocationHistory([]);
        return;
      }

      if (data) {
        const formatted = data.map((row: any) => ({
          lat: row.lat,
          lng: row.lng,
          speed: 0, // Default if not in history
          recorded_at: row.recorded_at,
        }));
        setLocationHistory(formatted);
      }
    } catch (err) {
      console.error("Error fetching location history:", err);
      setLocationHistory([]);
    }
  };

  useEffect(() => {
    if (!selectedDriver) return;
    fetchLocationHistory(selectedDriver.id);
    
    const interval = setInterval(() => {
      if(!isPlaying) fetchLocationHistory(selectedDriver.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedDriver?.id, filterStartDate, filterEndDate, isPlaying]);


  // =================================================================
  // ✅ ROUTING & ETA CALCULATION LOGIC (FIXED)
  // =================================================================
  useEffect(() => {
    if (!selectedDriver) {
      setRoutePath([]);
      setActiveDestination(null);
      return;
    }

    const calculateRoute = async () => {
      // 1. Find active delivery for selected driver
      const { data: activeJob } = await supabase
        .from('deliveries')
        .select('*')
        .eq('assigned_driver', selectedDriver.id)
        .in('status', ['in_transit', 'picked_up', 'assigned'])
        .limit(1)
        .maybeSingle();

      if (!activeJob) {
        setRoutePath([]);
        setActiveDestination(null);
        // Reset info if no job
        setSelectedDriver(prev => prev ? ({ ...prev, eta: "N/A", currentRoute: "Idle", distance: 0 }) : null);
        return;
      }

      // 2. Geocode if missing
      let destLat = activeJob.latitude;
      let destLng = activeJob.longitude;
      let didGeocode = false;

      if (!destLat || !destLng) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(activeJob.address)}&limit=1`);
          const geo = await res.json();
          if (geo[0]) {
            destLat = parseFloat(geo[0].lat);
            destLng = parseFloat(geo[0].lon);
            didGeocode = true;
          }
        } catch (e) {
          console.error("Geocoding failed", e);
          return;
        }
      }

      // 3. Update State & Database (if geocoded)
      if (destLat && destLng) {
        setActiveDestination({ ...activeJob, latitude: destLat, longitude: destLng });

        if (didGeocode) {
          await supabase
            .from('deliveries')
            .update({ latitude: destLat, longitude: destLng })
            .eq('id', activeJob.id);
        }

        const startLng = selectedDriver.location?.lng;
        const startLat = selectedDriver.location?.lat;

        if (!startLng || !startLat) {
          console.warn("Driver location not available for routing");
          return;
        }

        // 4. Calculate Route (OSRM)
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          const json = await res.json();

          if (json.code === 'Ok' && json.routes && json.routes[0]) {
            const route = json.routes[0];
            
            // Draw Polyline
            const path = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
            setRoutePath(path);

            // --- 🟢 FIX: CALCULATE ETA & DISTANCE ---
            const durationSec = route.duration; // Seconds
            const distanceMeters = route.distance; // Meters

            // Format ETA Time
            const now = new Date();
            const arrivalTime = new Date(now.getTime() + durationSec * 1000);
            const arrivalString = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Format Duration (e.g., 25 min)
            const minutesTotal = Math.round(durationSec / 60);
            let durationLabel = `${minutesTotal} min`;
            if (minutesTotal >= 60) {
                const h = Math.floor(minutesTotal / 60);
                const m = minutesTotal % 60;
                durationLabel = `${h} hr ${m} min`;
            }

            // Update local driver state
            setSelectedDriver(prev => {
                if(!prev) return null;
                return {
                    ...prev,
                    currentRoute: `Delivery to: ${activeJob.address}`,
                    distance: parseFloat((distanceMeters / 1000).toFixed(1)), // meters -> km
                    eta: `${arrivalString} (${durationLabel})`
                };
            });

          } else {
            setRoutePath([[startLat, startLng], [destLat, destLng]]); // Fallback straight line
            setSelectedDriver(prev => prev ? ({ ...prev, eta: "Calc Error", currentRoute: activeJob.address }) : null);
          }
        } catch (e: any) {
          console.warn("Routing error:", e.name);
          setRoutePath([[startLat, startLng], [destLat, destLng]]);
        }
      }
    };

    calculateRoute();
  }, [selectedDriver?.location?.lat, selectedDriver?.location?.lng, selectedDriver?.id]); 

  // --- Filtering ---
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = (driver.name ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || driver.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Driver["status"]) => {
    switch (status) {
      case "online": return "bg-[#27AE60] text-white";
      case "on_delivery": return "bg-blue-600 text-white";
      case "offline": return "bg-gray-600 text-white";
      default: return "bg-gray-600 text-white";
    }
  };

  const getStatusLabel = (status: Driver["status"]) => {
    switch (status) {
      case "online": return "Online";
      case "on_delivery": return "On Delivery";
      case "offline": return "Offline";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#222B2D] dark:text-white mb-2">
            Real-time Location & Tracking
          </h1>
          <p className="text-[#222B2D]/60 dark:text-white/60">
            Monitor live GPS tracking and driver movements in real-time
          </p>
        </div>

        {/* Connection Indicator */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConnected(!isConnected)}
            className="gap-2"
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-[#27AE60]" />
                <span className="text-[#27AE60]">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </Button>
          <div className="flex items-center gap-2 text-sm text-[#222B2D]/60 dark:text-white/60">
            <Activity className="w-4 h-4" />
            <span>
              {isConnected ? "WebSocket Active" : "Reconnecting..."}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Active Drivers
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {drivers.filter((d) => d.status !== "offline").length}
                  /{drivers.length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#27AE60]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#27AE60]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  In Transit
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {deliveries.filter((d) => d.status === "in_transit").length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver List Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Drivers</span>
              <Badge variant="outline">{filteredDrivers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#222B2D]/40 dark:text-white/40" />
                <Input
                  placeholder="Search drivers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="on_delivery">On Delivery</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Driver List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredDrivers.map((driver) => (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedDriver?.id === driver.id
                      ? "border-[#27AE60] bg-[#27AE60]/5"
                      : "border-transparent bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedDriver(driver);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-[#222B2D] dark:text-white">
                        {driver.name}
                      </h4>
                      <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
                        {driver.vehicle_type}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs ${getStatusColor(driver.status)}`}
                    >
                      {getStatusLabel(driver.status)}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-[#222B2D]/60 dark:text-white/60">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Navigation2 className="w-3 h-3" />
                        {driver.speed} km/h
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {driver.lastUpdate}
                      </span>
                    </div>
                    {driver.currentRoute && (
                      <p className="text-[#27AE60] truncate">
                        {driver.currentRoute}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Map & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Card */}
          <Card>
            <CardContent className="p-0">
              <div className="relative h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden isolate z-0">
                <MapContainer
                  center={
                    selectedDriver?.location
                      ? [selectedDriver.location.lat, selectedDriver.location.lng]
                      : [14.5995, 120.9842]
                  }
                  zoom={13}
                  style={{ height: "400px", width: "100%", zIndex: 0 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  <PanToSelectedDriver selectedDriver={selectedDriver}  />
                  
                  {/* Route Path */}
                  {routePath.length > 0 && (
                    <Polyline 
                      positions={routePath} 
                      color="#2563EB" 
                      weight={5} 
                      opacity={0.8} 
                    />
                  )}

                  {/* Destination Marker */}
                  {activeDestination && activeDestination.latitude && (
                    <Marker position={[activeDestination.latitude, activeDestination.longitude!]} icon={L.divIcon({ className: "bg-red-600 rounded-full w-4 h-4 border-2 border-white", iconSize: [16, 16] })}>
                      <Popup>Destination: {activeDestination.address}</Popup>
                    </Marker>
                  )}

                  {/* Drivers Markers */}
                  {drivers.map((driver) => {
                    if (!driver.location) return null;

                    // Detect if we are watching this driver's playback
                    const isSelected = selectedDriver?.id === driver.id;
                    const isPlayingThisDriver = isPlaying && isSelected && locationHistory.length > 0;

                    // Pick marker position
                    const markerPos = isPlayingThisDriver && locationHistory[playbackIndex]
                      ? [
                          locationHistory[playbackIndex].lat,
                          locationHistory[playbackIndex].lng,
                        ] as [number, number]
                      : [driver.location.lat, driver.location.lng] as [number, number];

                    return (
                      <Marker key={driver.id} position={markerPos} icon={getDriverIcon(driver)}>
                        <Popup>
                          <div className="p-2">
                            <h4 className="font-semibold">{driver.name}</h4>
                            <p className="text-sm text-gray-600">Vehicle: {driver.vehicle_type}</p>
                            <p className="text-sm text-gray-600">Status: {getStatusLabel(driver.status)}</p>

                            {driver.plate_number && (
                              <p className="text-sm text-gray-600">Plate: {driver.plate_number}</p>
                            )}

                            <p className="text-sm text-gray-600">
                              Speed:{" "}
                              {isPlayingThisDriver
                                ? "Playback"
                                : driver.speed}{" "}
                              km/h
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>

                {/* Legend */}
                <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg text-xs z-[1000]">
                  <h4 className="font-semibold mb-2">Legend</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#27AE60] flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                        </svg>
                      </div>
                      <span>Driver</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4zm8 16H6v-3h2v1h2v-1h2v1h2v-1h2v3z"/>
                        </svg>
                      </div>
                      <span>Destination</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Performance & History */}
          {selectedDriver && (
            <Tabs defaultValue="performance" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="history">Location History</TabsTrigger>
              </TabsList>

              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Driver Statistics - {selectedDriver.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Route Progress */}
                    {selectedDriver.currentRoute && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Route Progress</Label>
                          <span className="text-sm text-[#222B2D]/60 dark:text-white/60">
                            {selectedDriver.completedStops}/{selectedDriver.totalStops}{" "}
                            stops
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[#27AE60] h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                (selectedDriver.completedStops /
                                  Math.max(selectedDriver.totalStops, 1)) * // Avoid /0
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-[#222B2D]/60 dark:text-white/60 mb-1">
                          Current Speed
                        </p>
                        <p className="text-[#222B2D] dark:text-white">
                          {selectedDriver.speed} km/h
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-[#222B2D]/60 dark:text-white/60 mb-1">
                          Distance
                        </p>
                        <p className="text-[#222B2D] dark:text-white">
                          {selectedDriver.distance} km
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-[#222B2D]/60 dark:text-white/60 mb-1">
                          ETA
                        </p>
                        <p className="text-[#222B2D] dark:text-white">
                          {selectedDriver.eta}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-[#222B2D]/60 dark:text-white/60 mb-1">
                          Last Update
                        </p>
                        <p className="text-[#222B2D] dark:text-white">
                          {selectedDriver.record_at
    ? new Date(selectedDriver.record_at).toLocaleString()
    : "Unknown"}
                        </p>
                      </div>
                    </div>

                    {/* Route Details */}
                    {selectedDriver.currentRoute && (
                      <div className="p-4 rounded-lg border-2 border-[#27AE60]/20 bg-[#27AE60]/5">
                        <h4 className="text-sm text-[#222B2D] dark:text-white mb-2">
                          Current Route
                        </h4>
                        <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                          {selectedDriver.currentRoute}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Location History</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedDriver?.location) {
                              log_location_history(selectedDriver.id, selectedDriver.location.lat, selectedDriver.location.lng);
                            }
                          }}
                        >
                          Log Current Location
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSkipBack}>
                          <SkipBack className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSkipForward}>
                          <SkipForward className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Playback Speed */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Playback Speed</Label>
                        <span className="text-sm text-[#222B2D]/60 dark:text-white/60">
                          {playbackSpeed[0]}x
                        </span>
                      </div>

                      <Slider
                        value={playbackSpeed}
                        onValueChange={setPlaybackSpeed}
                        min={0.5}
                        max={4}
                        step={0.5}
                        className="w-full"
                      />
                    </div>

                    {/* Playback Scrubber */}
                    <Slider
                      value={[playbackIndex]}
                      min={0}
                      max={Math.max(0, locationHistory.length - 1)}
                      step={1}
                      onValueChange={(val: number[]) => {
                        setPlaybackIndex(val[0]);
                      }}
                      className="w-full"
                    />

                    {/* Timeline */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {locationHistory.map((entry, index) => (
                        <div
                          key={index}
                          className="flex gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                        >
                          <div className="flex-shrink-0 w-28 text-sm text-[#222B2D]/60 dark:text-white/60">
                            {new Date(entry.recorded_at).toLocaleString()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-[#27AE60]" />
                              <span className="text-sm text-[#222B2D] dark:text-white">
                                Lat: {entry.lat.toFixed(4)}, Lng:{" "}
                                {entry.lng.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>


                    {/* Date Filter */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Label className="mb-2 block">Filter by Date Range</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          className="flex-1"
                          onChange={(e) => setFilterStartDate(e.target.value)}
                        />
                        <span className="flex items-center text-[#222B2D]/60 dark:text-white/60">
                          to
                        </span>
                        <Input
                          type="date"
                          className="flex-1"
                          onChange={(e) => setFilterEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}