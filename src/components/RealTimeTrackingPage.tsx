import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
import { PanToSelectedDriver } from "./PanToSelectedDriver";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
  speed: number;
  lastUpdate: string;
}

interface LocationHistory {
  location_history_id: string;
  driver_id: string;
  lat?: number;
  lng?: number;
  recorded_at: string;
}

  const defaultIcon = new L.Icon({
    iconUrl: markerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
  });

export function RealTimeTrackingPage() {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locationHistory, setLocationHistory] = useState<{
  location: { lat: number; lng: number };
  recorded_at: string;
}[]>([]);
  const [autoLoggingEnabled, setAutoLoggingEnabled] = useState(true);

const [filterStartDate, setFilterStartDate] = useState<string>("");
const [filterEndDate, setFilterEndDate] = useState<string>("");
const [playbackIndex, setPlaybackIndex] = useState(0);

// Automatically advance playback when isPlaying changes
useEffect(() => {
if (!isPlaying || locationHistory.length === 0) return;

const interval = setInterval(() => {
setPlaybackIndex((prev) => {
if (prev >= locationHistory.length - 1) {
clearInterval(interval);
return prev;
}
return prev + 1;
});
}, 1000 / playbackSpeed[0]); // 1 second / speed factor

return () => clearInterval(interval);
}, [isPlaying, playbackSpeed, locationHistory]);

// Reset playbackIndex when driver changes
useEffect(() => {
setPlaybackIndex(0);
}, [selectedDriver]);

// Current location for map marker highlight
const currentPlaybackLocation = locationHistory[playbackIndex]?.location;
useEffect(() => {
  if (!isPlaying || locationHistory.length === 0) return;

  const speed = playbackSpeed[0];

  const interval = setInterval(() => {
    setPlaybackIndex((prev) => {
      if (prev >= locationHistory.length - 1) {
        setIsPlaying(false); // stop at end
        return prev;
      }
      return prev + 1;
    });
  }, 1000 / speed);

  return () => clearInterval(interval);
}, [isPlaying, playbackSpeed, locationHistory]);

// Handlers for skip buttons
const handleSkipBack = () => setPlaybackIndex((prev) => Math.max(prev - 1, 0));
const handleSkipForward = () =>
setPlaybackIndex((prev) => Math.min(prev + 1, locationHistory.length - 1));

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
    console.log("Edge function response:", data);

    if (data?.recorded) {
      setLocationHistory(prev => [
        {
          location: { lat: data.recorded.lat, lng: data.recorded.lng },
          recorded_at: data.recorded.recorded_at,
        },
        ...prev,
      ]);
    }
  } catch (err) {
    console.error("Error logging location history:", err);
  }
};
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      // Call your edge function that handles all active drivers
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/last_location_recorder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();
      console.log("Location history logged for active drivers:", data);
    } catch (err) {
      console.error("Error logging driver locations:", err);
    }
  }, 15 * 60 * 1000); // 15 minutes

  return () => clearInterval(interval); // cleanup
}, []); // empty dependency array → runs once and keeps interval

// Simple hash function to turn a string into a color
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 50%)`; // HSL gives nice distinct colors
  return color;
};
const getDriverIcon = (driver) => {
  const firstLetter = driver.name?.charAt(0)?.toUpperCase() ?? "?";
  const color = stringToColor(driver.name); // generate unique color

  return L.divIcon({
    className: "driver-icon",
    html: `
      <div class="driver-icon-wrapper" style="background-color: ${color}">
        ${firstLetter}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
  });
};


//To display location history
const fetchLocationHistory = async (driverId: string) => {
  try {
    let query = supabase
      .from('driver_location_history')
      .select('lat, lng, recorded_at')
      .eq('driver_id', driverId)
      .order('recorded_at', { ascending: false });

    if (filterStartDate) {
      query = query.gte('recorded_at', filterStartDate);
    }
    if (filterEndDate) {
      query = query.lte('recorded_at', filterEndDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching location history:', error);
      setLocationHistory([]);
      return;
    }

    if (!data || !Array.isArray(data)) {
      console.error("Unexpected response format:", data);
      setLocationHistory([]);
      return;
    }

    const formatted = data.map((row: any) => ({
      location: { lat: row.lat, lng: row.lng },
      recorded_at: row.recorded_at,
    }));

    console.log('Fetched location history data:', formatted);
    setLocationHistory(formatted);
  } catch (err) {
    console.error("Error fetching location history:", err);
    setLocationHistory([]);
  }
};

useEffect(() => {
  if (!selectedDriver) return;

  fetchLocationHistory(selectedDriver.id);
  const interval = setInterval(() => {
    fetchLocationHistory(selectedDriver.id);
  }, 5000);

  return () => clearInterval(interval);
}, [selectedDriver, filterStartDate, filterEndDate]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select(`
            id,
            user_id,
            name,
            vehicle_type,
            plate_number,
            license_number,
            status,
            last_lat,
            last_lng,
            last_location_update,
            is_active,
            created_at,
            updated_at
          `);

        if (error) {
          console.error('Error fetching drivers:', error);
          return;
        }

        if (data) {
          const formattedDrivers: Driver[] = data.map(d => {
            const location = d.last_lat && d.last_lng 
              ? { lat: d.last_lat, lng: d.last_lng }
              : null;
            
            return {
              id: d.id,
              user_id: d.user_id,
              name: d.name,
              vehicle_type: d.vehicle_type,
              plate_number: d.plate_number,
              license_number: d.license_number,
              status: d.status as Driver["status"],
              last_lat: d.last_lat,
              last_lng: d.last_lng,
              last_location_update: d.last_location_update,
              is_active: d.is_active,
              created_at: d.created_at,
              updated_at: d.updated_at,
              location,
              completedStops: 0,
              totalStops: 0,
              distance: 0,
              eta: "N/A",
              speed: 0,
              lastUpdate: d.last_location_update ? new Date(d.last_location_update).toLocaleTimeString() : "Unknown",
              currentRoute: "",
            };
          });
          
          setDrivers(formattedDrivers);
          
          // Set first driver with location as selected
          const driverWithLocation = formattedDrivers.find(d => d.last_location_update !== null);
          if (driverWithLocation && !selectedDriver) {
            setSelectedDriver(driverWithLocation);
          }
        }
      } catch (err) {
        console.error('Error in fetchDrivers:', err);
      }
    };

    fetchDrivers();

    // Subscribe to real-time driver updates
    const channel = supabase
      .channel('drivers-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers',
        },
        (payload) => {
          console.log('Driver update received:', payload);
          // Refetch drivers on any change
          fetchDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status: Driver["status"]) => {
    switch (status) {
      case "online":
        return "bg-[#27AE60] text-white";
      case "on_delivery":
        return "bg-blue-600 text-white";
      case "offline":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getStatusLabel = (status: Driver["status"]) => {
    switch (status) {
      case "online":
        return "Online";
      case "on_delivery":
        return "On Delivery";
      case "offline":
        return "Offline";
      default:
        return status;
    }
  };



  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = (driver.name ?? '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || driver.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Active Drivers
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {
                    drivers.filter((d) => d.status !== "offline")
                      .length
                  }
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
                  {
                    drivers.filter((d) => d.status === "on_delivery")
                      .length
                  }
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Total Distance
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {drivers
                    .reduce((sum, d) => sum + d.distance, 0)
                    .toFixed(1)}{" "}
                  km
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
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
    {/* Map with real driver locations */}
    <div className="relative h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-visible">
      <MapContainer
        center={
          selectedDriver?.location
            ? [selectedDriver.location.lat, selectedDriver.location.lng]
            : [14.5995, 120.9842]
        }
        zoom={13}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <PanToSelectedDriver selectedDriver={selectedDriver} role="driver" />
        {/* Render all drivers with locations */}
       {drivers.map((driver) => {
  if (!driver.location) return null;

  // Detect if we are watching this driver's playback
  const isSelected = selectedDriver?.id === driver.id;
  const isPlayingThisDriver = isPlaying && isSelected && locationHistory.length > 0;

  // Pick marker position
  const markerPos = isPlayingThisDriver
    ? [
        locationHistory[playbackIndex].location.lat,
        locationHistory[playbackIndex].location.lng,
      ]
    : [driver.location.lat, driver.location.lng];

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
              ? locationHistory[playbackIndex]?.speed ?? driver.speed
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
            <div className="w-3 h-3 rounded-full bg-[#27AE60]"></div>
            <span>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>On Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            <span>Offline</span>
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
                    <CardTitle>Driver Performance - {selectedDriver.name}</CardTitle>
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
                                  selectedDriver.totalStops) *
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
                          {selectedDriver.lastUpdate}
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
          <Button variant="outline" size="sm" onClick={() => {/* handle skip back */}}>
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => {/* handle skip forward */}}>
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
  max={locationHistory.length - 1}
  step={1}
  onValueChange={(val) => {
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
            Lat: {entry.location.lat.toFixed(4)}, Lng:{" "}
            {entry.location.lng.toFixed(4)}
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
