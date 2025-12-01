import { useState, useEffect, useMemo } from "react"
import { autoAssignRoutes } from "../lib/supabase";
import { toast } from "sonner";
;
import { supabase } from "../utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
import { Calendar as ReactCalendar } from "react-calendar";
export { ReactCalendar as Calendar };
import "react-calendar/dist/Calendar.css";
import { Calendar } from "react-calendar";

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
  driver?: string;
  stops: number;
  distance: number;
  estimatedTime: string;
  status: "planned" | "assigned" | "active" | "completed";
  priority: "high" | "medium" | "low";
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
  customer_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

// ------------------ Component ------------------

export function RouteOptimizationPage() {
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);

  // real drivers for availability/map
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // performance tab data
  const [performanceRows, setPerformanceRows] = useState<PerfRow[]>([]);
  const [loadingPerf, setLoadingPerf] = useState(false);

  // real data states
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [scheduledDeliveries, setScheduledDeliveries] = useState<ScheduledDelivery[]>([]);

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const refreshDeliveries = async () => {
  try {
    const { data, error } = await supabase
      .from("deliveries")
      .select(`
        id,
        ref_no,
        customer_name,
        address,
        latitude,
        longitude,
        status,
        assigned_driver
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    setDeliveries(data || []);
  } catch (err) {
    console.error("Failed to refresh deliveries:", err);
  }
};

// ------------------ Auto Assign Handler ------------------
const handleAutoAssign = async () => {
  try {
    console.log("Calling auto-assign...");
    const { ok, data } = await autoAssignRoutes();

    if (!ok) {
      toast.error(data.error || "Auto-assign failed");
      return;
    }

    toast.success("Auto Assignment Completed");
    console.log("Assignments:", data.assignments);

    await refreshDeliveries();
  } catch (err: any) {
    console.error("Auto assign error:", err);
    toast.error("Auto assign failed");
  }
};


  useEffect(() => {
  handleAutoAssign();
}, []);


   // ------------------ Fetch and geocode deliveries ------------------
  const geocodeDelivery = async (delivery: Delivery) => {
  if (delivery.latitude && delivery.longitude) return; // already has geolocation

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(delivery.address)}&limit=1`
    );
    const geo = await res.json();
    if (geo.length > 0) {
      const lat = parseFloat(geo[0].lat);
      const lng = parseFloat(geo[0].lon);

      // update in Supabase
      const { data: updated, error: updateError } = await supabase
        .from("deliveries")
        .update({ latitude: lat, longitude: lng })
        .eq("id", delivery.id);

      if (updateError) console.error("Supabase update failed:", updateError);

      // update local state
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === delivery.id ? { ...d, latitude: lat, longitude: lng } : d
        )
      );
    } else {
      console.warn("No geocode result for", delivery.address);
    }
  } catch (err) {
    console.error("Failed to geocode delivery:", delivery.address, err);
  }
};
  
useEffect(() => {
  const fetchAndGeocodeDeliveries = async () => {
    const { data, error } = await supabase
      .from("deliveries")
      .select("*")
      .eq("status", "created"); // or your desired filter

    if (error) {
      console.error("Error fetching deliveries:", error);
      return;
    }

    setDeliveries(data || []);

    // geocode each delivery
    for (const d of data || []) {
      await geocodeDelivery(d as Delivery);
      // Optional: add a small delay to respect rate limits
      await new Promise((r) => setTimeout(r, 1200));
    }
  };

  fetchAndGeocodeDeliveries();
}, []);


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
        body: {
          from: "2025-11-01",
          to: "2025-11-30",
        },
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

  const getStatusColor = (status: Driver["status"]) => {
    switch (status) {
      case "online":
        return "bg-[#27AE60] text-white";
      case "in-transit":
        return "bg-blue-600 text-white";
      case "idle":
        return "bg-yellow-600 text-white";
      case "offline":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getRouteStatusColor = (status: OptimizedRoute["status"]) => {
    switch (status) {
      case "active":
        return "bg-blue-600 text-white";
      case "assigned":
        return "bg-[#27AE60] text-white";
      case "planned":
        return "bg-gray-600 text-white";
      case "completed":
        return "bg-green-700 text-white";
      default:
        return "bg-gray-600 text-white";
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

      {/*  Both buttons wrapped properly */}
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
      <Tabs defaultValue="availability" className="w-full">
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
                    <TableHead>Current Route</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          {driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                        {driver.currentRoute || "No route assigned"}
                      </TableCell>
                      <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                        {driver.lastUpdate}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDriver(driver)}
                        >
                          View Details
                        </Button>
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

        {/* Routes */}
        <TabsContent value="routes">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Optimized Routes</span>
                    <Badge variant="outline">
                    
                    </Badge>
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
                              {route.driver || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRouteStatusColor(route.status)}>
                            {route.status}
                          </Badge>
                          <AlertCircle className={`w-4 h-4 ${getPriorityColor(route.priority)}`} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-[#222B2D]/60 dark:text-white/60">Stops</p>
                          <p className="text-[#222B2D] dark:text-white">{route.stops}</p>
                        </div>
                        <div>
                          <p className="text-[#222B2D]/60 dark:text-white/60">Distance</p>
                          <p className="text-[#222B2D] dark:text-white">{route.distance} km</p>
                        </div>
                        <div>
                          <p className="text-[#222B2D]/60 dark:text-white/60">Est. Time</p>
                          <p className="text-[#222B2D] dark:text-white">{route.estimatedTime}</p>
                        </div>
                      </div>

                      {route.status === "planned" && (
                        <Button size="sm" className="w-full mt-3">
                          Assign Driver
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>
                    {selectedRoute ? "Route Preview" : "Select a Route"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedRoute ? (
                    <div className="space-y-4">
                      <div className="h-64 rounded-lg overflow-hidden">
                        <MapContainer
                          center={[14.5547, 121.0244]}
                          zoom={12}
                          className="h-full w-full"
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                          />

                          {drivers
                            .filter(
                              (d) =>
                                d.currentRoute === selectedRoute.name && d.location
                            )
                            .map((d) => (
                              <Marker
                                key={d.id}
                                position={[d.location!.lat, d.location!.lng]}
                                icon={L.divIcon({
                                  className:
                                    "bg-[#27AE60] rounded-full w-6 h-6 flex items-center justify-center text-white",
                                  html: `<span class="text-xs">${d.name.charAt(0)}</span>`,
                                })}
                              >
                                <Popup>
                                  <div className="text-sm">
                                    <p className="font-semibold">{d.name}</p>
                                    <p>{d.vehicle}</p>
                                    <p>Status: {d.status}</p>
                                  </div>
                                </Popup>
                              </Marker>
                            ))}
                        </MapContainer>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Route Name</Label>
                          <p className="text-[#222B2D] dark:text-white">
                            {selectedRoute.name}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs">Assigned Driver</Label>
                          <p className="text-[#222B2D] dark:text-white">
                            {selectedRoute.driver || "Unassigned"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-center">
                      <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                        Select a route to view details.
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
          // mode="single" is default in react-calendar
        />
      </CardContent>
    </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Scheduled Deliveries</span>
                  <Button size="sm">Schedule New</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Deliveries</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledDeliveries.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>{schedule.date}</TableCell>
                        <TableCell>{schedule.driver}</TableCell>
                        <TableCell>{schedule.deliveries} deliveries</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              schedule.status === "completed"
                                ? "bg-green-700 text-white"
                                : schedule.status === "in-progress"
                                ? "bg-blue-600 text-white"
                                : "bg-[#27AE60] text-white"
                            }
                          >
                            {schedule.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit Schedule
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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

