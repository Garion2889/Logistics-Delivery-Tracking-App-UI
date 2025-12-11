import { useState, useEffect, useMemo } from "react";
import { autoAssignRoutes } from "../lib/supabase";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Users,
  TrendingUp,
  Truck,
  Map,
  AlertCircle,
  Route,
  CheckCircle2,
  Navigation,
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

// ✅ calendar import
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
  id: string; // driver's ID
  name: string; // e.g. "John Doe's Route"
  driverId: string;
  driverName: string;
  stops: number;
  distance: number; // in km
  estimatedTime: string; // formatted string
  status: "active" | "assigned" | "completed";
  deliveries: Delivery[]; // All deliveries in this route
  polyline: [number, number][]; // full polyline for the tour
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
function MapController({
  bounds,
}: {
  bounds: L.LatLngBoundsExpression | null;
}) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

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
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(
    null
  );

  // ✅ track active tab
  const [activeTab, setActiveTab] = useState("availability");

  // real drivers for availability/map
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // performance tab data
  const [performanceRows, setPerformanceRows] = useState<PerfRow[]>([]);
  const [loadingPerf, setLoadingPerf] = useState(false);

  // real data states
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [scheduledDeliveries, setScheduledDeliveries] = useState<
    ScheduledDelivery[]
  >([]);

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const filteredDrivers = drivers.filter((driver) => {
    if (availabilityFilter === "all") return true;
    if (availabilityFilter === "online") return driver.status === "online";
    if (availabilityFilter === "offline") return driver.status === "offline";
    return true;
  });

  // ------------------ 1. Fetch Deliveries ------------------
  const refreshDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDeliveries((data as Delivery[]) || []);
    } catch (err) {
      console.error("Failed to refresh deliveries:", err);
    }
  };

  // ------------------ 2. Geocoding Logic ------------------
  const geocodeDelivery = async (delivery: Delivery) => {
    if (delivery.latitude && delivery.longitude) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          delivery.address
        )}&limit=1`
      );
      const geo = await res.json();

      if (geo.length > 0) {
        const lat = parseFloat(geo[0].lat);
        const lng = parseFloat(geo[0].lon);

        const { error: updateError } = await supabase
          .from("deliveries")
          .update({ latitude: lat, longitude: lng })
          .eq("id", delivery.id);

        if (!updateError) {
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
      const { data } = await supabase
        .from("deliveries")
        .select("*")
        .is("latitude", null);

      if (data && data.length > 0) {
        for (const d of data) {
          await geocodeDelivery(d as Delivery);
          await new Promise((r) => setTimeout(r, 1200));
        }
        refreshDeliveries();
      }
    };
    fetchAndGeocodeDeliveries();
  }, []);

  // ------------------ 4. Fetch Active Routes ------------------
  const fetchAssignedRoutes = async () => {
    try {
      const { data: assignedDeliveries, error } = await supabase
        .from("deliveries")
        .select("*")
        .in("status", ["assigned", "picked_up", "in_transit"])
        .not("assigned_driver", "is", null)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      if (!assignedDeliveries || assignedDeliveries.length === 0) {
        setOptimizedRoutes([]);
        return;
      }

      const routesByDriver = assignedDeliveries.reduce((acc, delivery) => {
        const driverId = (delivery as any).assigned_driver as string | null;
        if (!driverId) return acc;
        if (!acc[driverId]) {
          acc[driverId] = [];
        }
        acc[driverId].push(delivery as Delivery);
        return acc;
      }, {} as Record<string, Delivery[]>);

      const newOptimizedRoutes: OptimizedRoute[] = [];

      for (const driverId in routesByDriver) {
        const driverDeliveries = routesByDriver[driverId];
        const driver = drivers.find((d) => d.id === driverId);

        if (!driver || !driver.location) continue;

        const coords = [
          [driver.location.lng, driver.location.lat],
          ...driverDeliveries
            .filter((d) => d.longitude && d.latitude)
            .map((d) => [d.longitude!, d.latitude!]),
        ];

        if (coords.length < 2) continue;

        const coordsString = coords
          .map((coord) => `${coord[0]},${coord[1]}`)
          .join(";");
        const url = `https://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&roundtrip=false&overview=full&geometries=geojson`;

        try {
          const res = await fetch(url);
          const data = await res.json();

          if (data.code === "Ok" && data.trips && data.trips.length > 0) {
            const trip = data.trips[0];
            const newRoute: OptimizedRoute = {
              id: driverId,
              driverId,
              driverName: driver.name,
              name: `${driver.name}'s Route`,
              stops: driverDeliveries.length,
              distance: trip.distance / 1000,
              estimatedTime: `${Math.round(trip.duration / 60)} min`,
              status: "active",
              deliveries: driverDeliveries,
              polyline: trip.geometry.coordinates.map(
                (c: number[]) => [c[1], c[0]] as [number, number]
              ),
            };
            newOptimizedRoutes.push(newRoute);
          } else {
            console.warn(
              `OSRM trip optimization failed for driver ${driverId}: ${data.message}`
            );

            const degradedRoute: OptimizedRoute = {
              id: driverId,
              driverId,
              driverName: driver.name,
              name: `${driver.name}'s Route (Unoptimized)`,
              stops: driverDeliveries.length,
              distance: 0,
              estimatedTime: "N/A",
              status: "active",
              deliveries: driverDeliveries,
              polyline: [],
            };
            newOptimizedRoutes.push(degradedRoute);
          }
        } catch (e) {
          console.error("OSRM API fetch failed for driver", driverId, e);
        }
      }

      setOptimizedRoutes(newOptimizedRoutes);
    } catch (err) {
      console.error("Error fetching assigned routes:", err);
    }
  };

  // ------------------ Auto Assign Handler ------------------
  const handleAutoAssign = async () => {
    try {
      toast.loading("Assigning routes...");
      console.log("Calling auto-assign...");

      const { ok, data } = await autoAssignRoutes();

      if (!ok) {
        toast.dismiss();
        toast.error(data?.error || "Auto-assign failed");
        return;
      }

      toast.dismiss();
      toast.success(`Assignments Completed`);
      console.log("Assignments:", data.assignments);

      await refreshDeliveries();
      await fetchAssignedRoutes();
      setActiveTab("routes");

      setTimeout(() => {
        window.location.reload();
      }, 300);
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

  // ✅ schedule state
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // ------------------ Tab Switching Logic ------------------
  useEffect(() => {
    if (activeTab === "routes") {
      fetchAssignedRoutes();
    } else if (activeTab === "schedule") {
      console.log("✅ Schedule tab opened — fetching schedules...");
      const loadSchedules = async () => {
        setLoadingSchedule(true);
        const { data, error } = await supabase
          .from("driver_schedules_view")
          .select("*")
          .order("schedule_date", { ascending: false });

        console.log("📦 SCHEDULE VIEW data:", data);
        console.log("❌ SCHEDULE VIEW error:", error);

        if (!error && data) {
          setScheduleRows(
            data.map((s: any) => ({
              id: s.id,
              driver_id: s.driver_id,
              schedule_date: s.schedule_date,
              deliveries_count: s.deliveries_count ?? 0,
              status: s.status,
              driver_name: s.driver_name ?? s.name ?? null,
              vehicle_type: s.vehicle_type ?? null,
            }))
          );
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
          "id, user_id, name, vehicle_type, status, last_lat, last_lng, last_location_update"
        );

      if (error) {
        console.error("Error fetching drivers:", error);
        return;
      }

      const formatted: Driver[] =
        data?.map((d: any) => ({
          id: d.id,
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
              d.id === u.id
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
          body: {},
        }
      );

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
    if (!optimizedRoutes || optimizedRoutes.length === 0) return 0;
    return optimizedRoutes.reduce(
      (sum, route) => sum + (route.distance || 0),
      0
    );
  }, [optimizedRoutes]);

  // 🔹 NEW: map driver_id -> driver name from drivers table
  const driverNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    drivers.forEach((d) => {
      map[d.id] = d.name;
    });
    return map;
  }, [drivers]);

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
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-purple-100 text-purple-700";
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

        <div className="flex gap-3">
          <Button
            onClick={handleAutoAssign}
            className="gap-2 bg-[#27AE60] text-white"
          >
            <Truck className="w-4 h-4" />
            Auto Assign Routes
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
                  Total Distance of Routes
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {totalDistance.toFixed(1)} km
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
                <Select
                  value={availabilityFilter}
                  onValueChange={setAvailabilityFilter}
                >
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
                  {filteredDrivers.map((driver) => (
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
                              {route.driverName}
                            </p>
                          </div>
                        </div>
                        <Badge className={getRouteStatusColor(route.status)}>
                          {formatStatus(route.status)}
                        </Badge>
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
                    <div className="text-center p-4 text-gray-500">
                      No optimized routes found. Try Auto Assign.
                    </div>
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
                      <div className="h-96 rounded-lg overflow-hidden relative z-0 border border-gray-200">
                        {(() => {
                          const driver = drivers.find(
                            (d) => d.id === selectedRoute.driverId
                          );
                          const driverLoc = driver?.location;
                          const deliveryLocs = selectedRoute.deliveries
                            .map((d) =>
                              d.latitude && d.longitude
                                ? { lat: d.latitude, lng: d.longitude }
                                : null
                            )
                            .filter(Boolean) as { lat: number; lng: number }[];

                          if (!driverLoc && deliveryLocs.length === 0) {
                            return (
                              <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 text-sm p-4 text-center">
                                <AlertCircle className="w-8 h-8 mb-2 text-yellow-500" />
                                <p>Missing location data for this route.</p>
                              </div>
                            );
                          }

                          const allPoints = [
                            ...(driverLoc ? [[driverLoc.lat, driverLoc.lng]] : []),
                            ...deliveryLocs.map((loc) => [loc.lat, loc.lng]),
                          ] as [number, number][];

                          const bounds =
                            allPoints.length > 0
                              ? L.latLngBounds(allPoints)
                              : null;
                          const center = bounds
                            ? bounds.getCenter()
                            : ([14.5995, 120.9842] as [number, number]); // Default Manila

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
                                attribution="&copy; OpenStreetMap"
                              />

                              <MapController bounds={bounds} />

                              {/* Driver Marker */}
                              {driverLoc && (
                                <Marker
                                  position={[driverLoc.lat, driverLoc.lng]}
                                  icon={L.divIcon({
                                    className:
                                      "bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-white border-2 border-white shadow-lg",
                                    html: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><path d="M5 18H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10l4 4"/><path d="M5 18H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10l4 4v11h-3.3"/><path d="M7 18h10M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M19 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>`,
                                    iconSize: [32, 32],
                                  })}
                                >
                                  <Popup>Driver: {driver?.name}</Popup>
                                </Marker>
                              )}

                              {/* Delivery Markers */}
                              {selectedRoute.deliveries.map((delivery, index) =>
                                delivery.latitude && delivery.longitude ? (
                                  <Marker
                                    key={delivery.id}
                                    position={[
                                      delivery.latitude,
                                      delivery.longitude,
                                    ]}
                                    icon={L.divIcon({
                                      className:
                                        "bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-white border-2 border-white shadow-md",
                                      html: `<span class="text-xs font-bold">${
                                        index + 1
                                      }</span>`,
                                      iconSize: [24, 24],
                                    })}
                                  >
                                    <Popup>
                                      <div className="text-sm">
                                        <strong>
                                          Stop {index + 1}:{" "}
                                          {delivery.customer_name}
                                        </strong>
                                        <br />
                                        {delivery.address}
                                      </div>
                                    </Popup>
                                  </Marker>
                                ) : null
                              )}

                              {/* OSRM Route Shape */}
                              {selectedRoute.polyline &&
                                selectedRoute.polyline.length > 0 && (
                                  <Polyline
                                    positions={selectedRoute.polyline}
                                    color="#3B82F6"
                                    weight={5}
                                    opacity={0.7}
                                  />
                                )}
                            </MapContainer>
                          );
                        })()}
                      </div>

                      {/* Route Info Details */}
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">
                              Driver
                            </Label>
                            <p className="font-medium text-sm">
                              {selectedRoute.driverName}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">
                              Status
                            </Label>
                            <Badge
                              className={`mt-1 ${getRouteStatusColor(
                                selectedRoute.status
                              )}`}
                            >
                              {formatStatus(selectedRoute.status)}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Stops ({selectedRoute.stops})
                          </Label>
                          <div className="text-sm truncate max-h-20 overflow-y-auto">
                            {selectedRoute.deliveries.map((d, i) => (
                              <p key={d.id} className="truncate">
                                <b>{i + 1}:</b> {d.address}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-96 flex flex-col items-center justify-center text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
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
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loadingPerf ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Loading performance...
                      </TableCell>
                    </TableRow>
                  ) : performanceRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No performance data yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    performanceRows.map((row) => (
                      <TableRow key={row.driver_id}>
                        <TableCell>
                          {(() => {
                            const displayName =
                              driverNameMap[row.driver_id] ??
                              row.name ??
                              row.driver_id;

                            return (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#27AE60] flex items-center justify-center">
                                  <span className="text-white text-sm">
                                    {displayName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[#222B2D] dark:text-white">
                                    {displayName}
                                  </p>
                                  <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
                                    {row.vehicle_type ?? ""}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
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
                      <TableHead className="text-center w-[20%]">
                        Date
                      </TableHead>
                      <TableHead className="text-center w-[40%]">
                        Driver
                      </TableHead>
                      <TableHead className="text-center w-[20%]">
                        Deliveries
                      </TableHead>
                      <TableHead className="text-center w-[20%]">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loadingSchedule ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Loading schedules...
                        </TableCell>
                      </TableRow>
                    ) : scheduleRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No schedules yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      scheduleRows.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-center align-middle">
                            {new Date(s.schedule_date).toLocaleDateString()}
                          </TableCell>

                          <TableCell className="text-center align-middle">
                            <div className="flex flex-col items-center">
                              <span className="text-[#222B2D] dark:text-white">
                                {s.driver_name ?? s.driver_id}
                              </span>
                              <span className="text-xs text-[#222B2D]/60 dark:text-white/60">
                                {s.vehicle_type ?? ""}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center align-middle">
                            {s.deliveries_count}
                          </TableCell>

                          <TableCell className="text-center align-middle">
                            <Badge
                              className={
                                s.status === "completed"
                                  ? "bg-green-700 text-white"
                                  : "bg-blue-600 text-white"
                              }
                            >
                              {formatStatus(s.status)}
                            </Badge>
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
