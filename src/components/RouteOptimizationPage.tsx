import { useState, useEffect, useMemo } from "react"
import { autoAssignRoutes } from "../lib/supabase";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Calendar as CalendarIcon,
  Navigation,
  Users,
  TrendingUp,
  Clock,
  Route,
  Zap,
  CheckCircle2,
  Activity,
  Truck,
  Package,
  Map,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

// ✅ FIXED calendar import (ONLY ONE)
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";


// ------------------ Types ------------------

interface Driver {
  id: string;
  name: string;
  vehicle: string;
  status: "online" | "in-transit" | "idle" | "offline";
  location?: { lat: number; lng: number };
  currentRoute?: string;
  lastUpdate?: string;
}

interface OptimizedRoute {
  id: string;
  name: string;
  driverId?: string; // Changed from 'driver' to 'driverId' to store the driver's ID
  driverName?: string; // New field to store driver's name for display
  stops: number;
  distance: number;
  estimatedTime: string;
  status: "planned" | "assigned" | "active" | "completed";
  priority: "high" | "medium" | "low";
  polyline?: [number, number][]; // Added polyline field
}

interface ScheduledDelivery {
  id: string;
  date: string;
  driver: string;
  deliveries: number;
  status: "scheduled" | "in-progress" | "completed";
}

type PerfRow = {
  driver_id: string;
  name: string | null;
  vehicle_type: string | null;
  deliveries_per_day: number;
  success_rate: number;
  distance_traveled_km: number;
  avg_rating: number | null;
};

interface Delivery {
  id: string;
  ref_no: string; 
  customer_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  assigned_driver: string | null;
  priority?: string;
}

/** ✅ schedule row type */
type ScheduleRow = {
  id: string;
  driver_id: string;
  schedule_date: string;
  deliveries_count: number;
  status: "scheduled" | "in_progress" | "in-progress" | "completed";
  driver_name: string | null;
  vehicle_type: string | null;
};

// Helper: Fixes map rendering in tabs and auto-zooms
function MapController({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();

  useEffect(() => {
    // 1. Force map to recalculate size (fixes grey box in tabs)
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // 2. Zoom to fit markers
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    return () => clearTimeout(timer);
  }, [bounds, map]);

  return null;
}

// ------------------ Component ------------------

export function RouteOptimizationPage() {
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  
  // ✅ NEW: State for OSRM Route Shape
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  // ✅ NEW: track active tab so we fetch schedules only when schedule is opened
  const [activeTab, setActiveTab] = useState("availability");

  // real drivers for availability/map
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // performance tab data
  const [performanceRows, setPerformanceRows] = useState<PerfRow[]>([]);
  const [loadingPerf, setLoadingPerf] = useState(false);

  // real data states
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [scheduledDeliveries, setScheduledDeliveries] = useState<ScheduledDelivery[]>([]);

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  
  // ------------------ 1. Fetch Deliveries ------------------
  const refreshDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDeliveries(data as Delivery[] || []);
    } catch (err) {
      console.error("Failed to refresh deliveries:", err);
    }
  };

  // ------------------ 2. Geocoding Logic ------------------
  const geocodeDelivery = async (delivery: Delivery) => {
    // If we already have coords, skip
    if (delivery.latitude && delivery.longitude) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(delivery.address)}&limit=1`
      );
      const geo = await res.json();
      
      if (geo.length > 0) {
        const lat = parseFloat(geo[0].lat);
        const lng = parseFloat(geo[0].lon);

        // Update Supabase
        const { error: updateError } = await supabase
          .from("deliveries")
          .update({ latitude: lat, longitude: lng })
          .eq("id", delivery.id);

        if (!updateError) {
            // Update Local State immediately
            setDeliveries((prev) =>
                prev.map((d) =>
                d.id === delivery.id ? { ...d, latitude: lat, longitude: lng } : d
                )
            );
        }
      }
    } catch (err) {
      console.error("Failed to geocode delivery:", delivery.address, err);
    }
  };

  // ------------------ 3. Effect to Geocode ALL missing addresses on load ------------------
  useEffect(() => {
    const fetchAndGeocodeDeliveries = async () => {
      // Fetch ANY delivery where latitude is missing
      const { data } = await supabase
        .from("deliveries")
        .select("*")
        .is('latitude', null);

      if (data && data.length > 0) {
        // Process one by one with delay to respect rate limits
        for (const d of data) {
          await geocodeDelivery(d as Delivery);
          await new Promise((r) => setTimeout(r, 1200)); 
        }
        refreshDeliveries();
      }
    };
    fetchAndGeocodeDeliveries();
  }, []);

  // ------------------ 4. Fetch Active Routes (Populates list in "Optimized Routes" tab) ------------------
  const fetchAssignedRoutes = async () => {
    try {
      // Query deliveries that have an assigned driver and are active
      const { data: assignedData, error } = await supabase
        .from("deliveries")
        .select("*")
        .in('status', ['assigned', 'picked_up', 'in_transit']) 
        .not('assigned_driver', 'is', null) 
        .order("assigned_at", { ascending: false });

      if (error) throw error;

      if (!assignedData || assignedData.length === 0) {
        setOptimizedRoutes([]);
        return;
      }

      // Format for UI
      const formattedRoutes: OptimizedRoute[] = assignedData.map((d) => {
        const assignedDriver = drivers.find((dr) => dr.id === d.assigned_driver);
        return {
          id: d.id,
          name: d.ref_no || `Delivery ${d.id.slice(0, 4)}`,
          driverId: d.assigned_driver!,
          driverName: assignedDriver?.name || "Loading...",
          stops: 1,
          distance: 0, // Placeholder
          estimatedTime: "Calculating...",
          status: d.status as "assigned" | "active" | "planned" | "completed",
          priority: (d.priority as "high" | "medium" | "low") || "normal",
          polyline: [],
        };
      });

      setOptimizedRoutes(formattedRoutes);
    } catch (err) {
      console.error("Error fetching assigned routes:", err);
    }
  };

  // ------------------ 5. OSRM Route Shape Fetcher (Draws curved lines) ------------------
  useEffect(() => {
    if (!selectedRoute) {
      setRoutePath([]);
      return;
    }

    const fetchRouteShape = async () => {
      const activeDelivery = deliveries.find((d) => d.id === selectedRoute.id);
      const activeDriver = drivers.find((d) => d.id === selectedRoute.driverId || d.name === selectedRoute.driverName);

      if (!activeDelivery?.latitude || !activeDelivery?.longitude || !activeDriver?.location) {
        setRoutePath([]);
        return;
      }

      // OSRM Public API
      const url = `https://router.project-osrm.org/route/v1/driving/${activeDriver.location.lng},${activeDriver.location.lat};${activeDelivery.longitude},${activeDelivery.latitude}?overview=full&geometries=geojson`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          // Swap [lng, lat] to [lat, lng] for Leaflet
          const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          setRoutePath(coordinates);
        }
      } catch (err) {
        console.error("Failed to fetch route shape:", err);
        // Fallback to straight line
        setRoutePath([[activeDriver.location.lat, activeDriver.location.lng], [activeDelivery.latitude, activeDelivery.longitude]]);
      }
    };

    fetchRouteShape();
  }, [selectedRoute, deliveries, drivers]);

  // ------------------ Auto Assign Handler ------------------
  const handleAutoAssign = async () => {
    try {
      toast.loading("Assigning routes...");
      console.log("Calling auto-assign...");
      
      const { ok, data } = await autoAssignRoutes();

      if (!ok) {
        toast.dismiss();
        toast.error(data.error || "Auto-assign failed");
        return;
      }

      toast.dismiss();
      toast.success(`Assignments Completed`);
      console.log("Assignments:", data.assignments);

      // ✅ REFRESH DATA IMMEDIATELY
      await refreshDeliveries(); // Updates coordinates for map
      await fetchAssignedRoutes(); // Updates list on left side
      setActiveTab("routes"); // Switch tab so user sees the result

    } catch (err: any) {
      toast.dismiss();
      console.error("Auto assign error:", err);
      toast.error("Auto assign failed");
    }
  };

  // Initial Load
  useEffect(() => {
    refreshDeliveries();
  }, []);

  // ✅ ADDED: schedule state (REQUIRED)
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // ------------------ Tab Switching Logic ------------------
  useEffect(() => {
    if (activeTab === "routes") {
        fetchAssignedRoutes();
    }
    else if (activeTab === "schedule") {
      console.log("✅ Schedule tab opened — fetching schedules...");
      const loadSchedules = async () => {
        setLoadingSchedule(true);
        const { data, error } = await supabase
          .from("driver_schedules_view") // IMPORTANT: view has RLS off
          .select("*")
          .order("schedule_date", { ascending: false });

        console.log("📦 SCHEDULE VIEW data:", data);
        console.log("❌ SCHEDULE VIEW error:", error);
        
        if (!error && data) {
           setScheduleRows(data.map((s: any) => ({
             id: s.id,
             driver_id: s.driver_id,
             schedule_date: s.schedule_date,
             deliveries_count: s.deliveries_count ?? 0,
             status: s.status,
             driver_name: s.driver_name ?? s.name ?? null,
             vehicle_type: s.vehicle_type ?? null,
           })));
        } else {
           setScheduleRows([]);
        }
        setLoadingSchedule(false);
      };
      loadSchedules();
    }
  }, [activeTab]); 

  // ------------------ Fetch drivers ------------------
  useEffect(() => {
    const fetchDrivers = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select(
          "user_id, name, vehicle_type, status, last_lat, last_lng, last_location_update"
        );

      if (error) {
        console.error("Error fetching drivers:", error);
        return;
      }

      const formatted: Driver[] =
        data?.map((d: any) => ({
          id: d.user_id,
          name: d.name || "Unnamed",
          vehicle: d.vehicle_type || "",
          status: d.status as Driver["status"],
          location:
            d.last_lat != null && d.last_lng != null
              ? { lat: d.last_lat, lng: d.last_lng }
              : undefined,
          currentRoute: "",
          lastUpdate: d.last_location_update
            ? new Date(d.last_location_update).toLocaleTimeString()
            : "Just now",
        })) ?? [];

      setDrivers(formatted);
    };

    fetchDrivers();

    const sub = supabase
      .channel("public:drivers")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "drivers" },
        (payload) => {
          const u = payload.new as any;
          setDrivers((prev) =>
            prev.map((d) =>
              d.id === u.user_id
                ? {
                    ...d,
                    status: u.status,
                    vehicle: u.vehicle_type,
                    location:
                      u.last_lat != null && u.last_lng != null
                        ? { lat: u.last_lat, lng: u.last_lng }
                        : d.location,
                    lastUpdate: u.last_location_update
                      ? new Date(u.last_location_update).toLocaleTimeString()
                      : "Just now",
                  }
                : d
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  // ------------------ Fetch performance rows ------------------
  useEffect(() => {
    const loadPerformance = async () => {
      setLoadingPerf(true);

      const { data, error } = await supabase.functions.invoke(
        "get-driver-performance",
        {
          method: "POST",
          body: {}, // ✅ no from/to = get all rows
        }
      );

      console.log("performance raw data:", data);
      console.log("performance error:", error);

      if (error) {
        setPerformanceRows([]);
      } else {
        setPerformanceRows((data as PerfRow[]) || []);
      }

      setLoadingPerf(false);
    };

    loadPerformance();
  }, []);

  // ------------------ Derived KPI values ------------------
  const activeDriversCount = useMemo(
    () => drivers.filter((d) => d.status !== "offline").length,
    [drivers]
  );

  const avgSuccessRate = useMemo(() => {
    if (performanceRows.length === 0) return null;
    const sum = performanceRows.reduce((s, r) => s + (r.success_rate || 0), 0);
    return sum / performanceRows.length;
  }, [performanceRows]);

  const totalDistance = useMemo(() => {
    if (performanceRows.length === 0) return null;
    return performanceRows.reduce(
      (s, r) => s + Number(r.distance_traveled_km || 0),
      0
    );
  }, [performanceRows]);

  // ------------------ Helpers ------------------
const formatStatus = (status: string) => {
  if (!status) return "Unknown";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
  const getStatusColor = (status: Driver["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-700";
      case "in-transit":
        return "bg-purple-100 text-purple-700";
      case "idle":
        return "bg-yellow-100 text-yellow-700";
      case "offline":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const getRouteStatusColor = (status: OptimizedRoute["status"]) => {
    switch (status) {
      case "active":
        return "bg-blue-600 text-white";
      case "assigned":
        return "bg-blue-100 text-blue-700";
      case "planned":
        return "bg-gray-600 text-white";
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-purple-100 text-purple-700";
    }
  };

  const getPriorityColor = (priority: OptimizedRoute["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  // ------------------ Render ------------------

  return (
  <div className="space-y-6">
    {/* Page Header */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-[#222B2D] dark:text-white mb-2">
          Driver Management & Route Optimization
        </h1>
        <p className="text-[#222B2D]/60 dark:text-white/60">
          Optimize routes and manage driver assignments efficiently
        </p>
      </div>

      {/* Both buttons wrapped properly */}
      <div className="flex gap-3">
        <Button onClick={() => setShowOptimizeModal(true)} className="gap-2">
          <Zap className="w-4 h-4" />
          Optimize Routes
        </Button>

        <Button
          onClick={handleAutoAssign}
          className="gap-2 bg-[#27AE60] text-white"
        >
          <Truck className="w-4 h-4" />
          Auto Assign
        </Button>
      </div>
    </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Total Drivers
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {drivers.length}
                </h3>
                <p className="text-xs text-[#27AE60] mt-1">
                  {activeDriversCount} active
                </p>
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
                  Active Routes
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {optimizedRoutes.filter((r) => r.status === "active").length}
                </h3>
                <p className="text-xs text-blue-600 mt-1">
                  {optimizedRoutes.filter((r) => r.status === "planned").length} planned
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Route className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Avg Success Rate
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {avgSuccessRate == null ? "—" : avgSuccessRate.toFixed(1)}%
                </h3>
                <p className="text-xs text-[#27AE60] mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Based on selected range
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#27AE60]" />
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
                  {totalDistance == null ? "—" : totalDistance.toFixed(1)} km
                </h3>
                <p className="text-xs text-[#222B2D]/60 dark:text-white/60 mt-1">
                  Range Selected
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {/* ✅ FIXED: Controlled tabs so activeTab updates */}
      <Tabs
        defaultValue="availability"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="routes">Optimized Routes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Availability */}
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Driver Availability</span>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drivers</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#27AE60] flex items-center justify-center">
                            <span className="text-white text-sm">
                              {driver.name.charAt(0)}
                            </span>
                          </div>
                          <p className="text-[#222B2D] dark:text-white">
                            {driver.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#222B2D] dark:text-white">
                        {driver.vehicle}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(driver.status)}>
                          {formatStatus(driver.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                        {driver.lastUpdate}
                      </TableCell>
                      <TableCell className="text-right">
                      </TableCell>
                    </TableRow>
                  ))}
                  {drivers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No drivers yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Optimized Routes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {optimizedRoutes.map((route) => (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedRoute?.id === route.id
                          ? "border-[#27AE60] bg-[#27AE60]/5"
                          : "border-gray-200 dark:border-gray-700 hover:border-[#27AE60]/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Map className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-[#222B2D] dark:text-white">
                              {route.name}
                            </h4>
                            <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                              {route.driverName || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRouteStatusColor(route.status)}>
                            {formatStatus(route.status)}
                          </Badge>
                          <AlertCircle
                            className={`w-4 h-4 ${getPriorityColor(route.priority)}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-[#222B2D]/60 dark:text-white/60">
                            Stops
                          </p>
                          <p className="text-[#222B2D] dark:text-white">
                            {route.stops}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#222B2D]/60 dark:text-white/60">
                            Distance
                          </p>
                          <p className="text-[#222B2D] dark:text-white">
                            {route.distance.toFixed(2)} km
                          </p>
                        </div>
                        <div>
                          <p className="text-[#222B2D]/60 dark:text-white/60">
                            Est. Time
                          </p>
                          <p className="text-[#222B2D] dark:text-white">
                            {route.estimatedTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {optimizedRoutes.length === 0 && (
                     <div className="text-center p-4 text-gray-500">No optimized routes found. Try Auto Assign.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Map Column */}
            <div className="lg:col-span-2">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>
                    {selectedRoute ? "Route Preview" : "Select a Route"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedRoute ? (
                    <div className="space-y-4">
                      {/* MAP CONTAINER */}
                      <div className="h-64 rounded-lg overflow-hidden relative z-0 border border-gray-200">
                        {(() => {
                          // --- DATA LOOKUP LOGIC ---
                          const activeDelivery = deliveries.find((d) => d.id === selectedRoute.id);
                          const activeDriver = drivers.find((d) => d.id === selectedRoute.driverId || d.name === selectedRoute.driverName);

                          const driverLoc = activeDriver?.location;
                          const deliveryLoc = activeDelivery?.latitude && activeDelivery?.longitude 
                            ? { lat: activeDelivery.latitude, lng: activeDelivery.longitude } 
                            : null;

                          if (!driverLoc && !deliveryLoc) {
                            return (
                              <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 text-sm p-4 text-center">
                                <AlertCircle className="w-8 h-8 mb-2 text-yellow-500" />
                                <p>Missing location data.</p>
                                <p className="text-xs mt-1">Check if Driver is Online or Delivery has been Geocoded.</p>
                              </div>
                            );
                          }

                          let bounds: L.LatLngBoundsExpression | null = null;
                          let center: [number, number] = [14.5995, 120.9842]; // Default Manila

                          if (driverLoc && deliveryLoc) {
                            bounds = [
                              [driverLoc.lat, driverLoc.lng],
                              [deliveryLoc.lat, deliveryLoc.lng]
                            ];
                          } else if (driverLoc) {
                            center = [driverLoc.lat, driverLoc.lng];
                          } else if (deliveryLoc) {
                            center = [deliveryLoc.lat, deliveryLoc.lng];
                          }

                          return (
                            <MapContainer
                              key={selectedRoute.id} 
                              center={center}
                              zoom={13}
                              className="h-full w-full"
                              scrollWheelZoom={false}
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap'
                              />

                              <MapController bounds={bounds} />


                              {deliveryLoc && (
                                <Marker
                                  position={[deliveryLoc.lat, deliveryLoc.lng]}
                                  icon={L.divIcon({
                                    className: "bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-white border-2 border-white shadow-lg",
                                    html: `<span class="text-xs font-bold">Dest</span>`,
                                    iconSize: [32, 32]
                                  })}
                                >
                                  <Popup>
                                    <div className="text-sm">
                                      <strong>Delivery</strong><br/>
                                      {activeDelivery?.address}
                                    </div>
                                  </Popup>
                                </Marker>
                              )}

                              {/* OSRM Route Shape OR Straight Line Fallback */}
                              {routePath.length > 0 ? (
                                <Polyline 
                                  positions={routePath} 
                                  color="#3B82F6" 
                                  weight={4} 
                                  opacity={0.8} 
                                />
                              ) : (
                                driverLoc && deliveryLoc && (
                                  <Polyline
                                    positions={[
                                      [driverLoc.lat, driverLoc.lng],
                                      [deliveryLoc.lat, deliveryLoc.lng]
                                    ]}
                                    color="#3B82F6"
                                    weight={4}
                                    dashArray="10, 10"
                                    opacity={0.5}
                                  />
                                )
                              )}
                            </MapContainer>
                          );
                        })()}
                      </div>

                      {/* Route Info Details */}
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">Driver</Label>
                            <p className="font-medium text-sm">
                              {selectedRoute.driverName || "Unassigned"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Status</Label>
                            <Badge className={`mt-1 ${getRouteStatusColor(selectedRoute.status)}`}>
                               {formatStatus(selectedRoute.status)}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Delivery Address</Label>
                          {(() => {
                             const d = deliveries.find(del => del.id === selectedRoute.id);
                             return (
                               <p className="text-sm truncate" title={d?.address}>
                                 {d?.address || "Loading address..."}
                               </p>
                             );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <Map className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">
                        Select a route from the list to view the map.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Driver Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Deliveries/Day</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Distance Traveled</TableHead>
                    <TableHead>Avg Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPerf ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading performance...
                      </TableCell>
                    </TableRow>
                  ) : performanceRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No performance data yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    performanceRows.map((row) => (
                      <TableRow key={row.driver_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#27AE60] flex items-center justify-center">
                              <span className="text-white text-sm">
                                {(row.name ?? "D").charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-[#222B2D] dark:text-white">
                                {row.name ?? row.driver_id}
                              </p>
                              <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
                                {row.vehicle_type ?? ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {Number(row.deliveries_per_day).toFixed(1)}
                        </TableCell>
                        <TableCell>
                          {Number(row.success_rate).toFixed(0)}%
                        </TableCell>
                        <TableCell>
                          {Number(row.distance_traveled_km).toFixed(1)} km
                        </TableCell>
                        <TableCell>
                          {row.avg_rating != null
                            ? Number(row.avg_rating).toFixed(1)
                            : "—"}{" "}
                          ★
                        </TableCell>

                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View Report
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

         {/* Schedule */}
        <TabsContent value="schedule">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Schedule Calendar</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Calendar
                  onChange={(value) => setDate(value as Date)}
                  value={date}
                  className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Scheduled Deliveries</span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Date</TableHead>
                      <TableHead className="text-center">Driver</TableHead>
                      <TableHead className="text-center">Deliveries</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loadingSchedule ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Loading schedules...
                        </TableCell>
                      </TableRow>
                    ) : scheduleRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No schedules yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      scheduleRows.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-center text-middle">
                            {new Date(s.schedule_date).toLocaleDateString()}
                          </TableCell>

                          <TableCell className="text-center text-middle">
                            <div className="flex flex-col">
                              <span className="text-[#222B2D] dark:text-white">
                                {s.driver_name ?? s.driver_id}
                              </span>
                              <span className="text-xs text-[#222B2D]/60 dark:text-white/60">
                                {s.vehicle_type ?? ""}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center text-middle">
                            {s.deliveries_count}
                          </TableCell>

                          <TableCell className="text-center text-middle"> 
                            <Badge
                              className={(
                                s.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : s.status === "in_progress" ||
                                    s.status === "in-progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-200 text-gray-700")
                              }
                            >
                              {formatStatus(s.status)}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center text-middle">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Optimize Routes Modal */}
      {showOptimizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Optimize Routes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Optimization UI placeholder.
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowOptimizeModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowOptimizeModal(false)}
                  className="flex-1"
                >
                  Apply Optimization
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}