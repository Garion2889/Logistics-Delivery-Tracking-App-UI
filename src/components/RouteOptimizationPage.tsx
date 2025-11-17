import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Calendar as CalendarIcon,
  MapPin,
  Navigation,
  Users,
  TrendingUp,
  Clock,
  Route,
  Zap,
  CheckCircle2,
  XCircle,
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
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "./ui/utils";

interface Driver {
  id: string;
  name: string;
  vehicle: string;
  status: "online" | "in-transit" | "idle" | "offline";
  currentRoute?: string;
  deliveriesPerDay: number;
  successRate: number;
  distanceTraveled: number;
  availableHours: string;
  rating: number;
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

const mockDrivers: Driver[] = [
  {
    id: "1",
    name: "Pedro Reyes",
    vehicle: "Motorcycle",
    status: "in-transit",
    currentRoute: "Route A - North Metro",
    deliveriesPerDay: 24,
    successRate: 96,
    distanceTraveled: 145.3,
    availableHours: "8:00 AM - 6:00 PM",
    rating: 4.8,
  },
  {
    id: "2",
    name: "Carlos Mendoza",
    vehicle: "Van",
    status: "online",
    deliveriesPerDay: 18,
    successRate: 94,
    distanceTraveled: 178.2,
    availableHours: "9:00 AM - 7:00 PM",
    rating: 4.6,
  },
  {
    id: "3",
    name: "Luis Ramos",
    vehicle: "Truck",
    status: "idle",
    deliveriesPerDay: 12,
    successRate: 98,
    distanceTraveled: 132.8,
    availableHours: "7:00 AM - 5:00 PM",
    rating: 4.9,
  },
  {
    id: "4",
    name: "Miguel Santos",
    vehicle: "Motorcycle",
    status: "online",
    deliveriesPerDay: 22,
    successRate: 92,
    distanceTraveled: 156.4,
    availableHours: "8:00 AM - 6:00 PM",
    rating: 4.5,
  },
];

const mockOptimizedRoutes: OptimizedRoute[] = [
  {
    id: "1",
    name: "Route A - North Metro",
    driver: "Pedro Reyes",
    stops: 12,
    distance: 24.5,
    estimatedTime: "4h 30m",
    status: "active",
    priority: "high",
  },
  {
    id: "2",
    name: "Route B - South Metro",
    driver: "Carlos Mendoza",
    stops: 15,
    distance: 32.8,
    estimatedTime: "5h 15m",
    status: "assigned",
    priority: "medium",
  },
  {
    id: "3",
    name: "Route C - East Metro",
    stops: 10,
    distance: 18.2,
    estimatedTime: "3h 45m",
    status: "planned",
    priority: "high",
  },
  {
    id: "4",
    name: "Route D - West Metro",
    stops: 8,
    distance: 15.6,
    estimatedTime: "3h 20m",
    status: "planned",
    priority: "low",
  },
];

const mockScheduledDeliveries: ScheduledDelivery[] = [
  {
    id: "1",
    date: "Nov 12, 2025",
    driver: "Pedro Reyes",
    deliveries: 24,
    status: "in-progress",
  },
  {
    id: "2",
    date: "Nov 12, 2025",
    driver: "Carlos Mendoza",
    deliveries: 18,
    status: "in-progress",
  },
  {
    id: "3",
    date: "Nov 13, 2025",
    driver: "Luis Ramos",
    deliveries: 20,
    status: "scheduled",
  },
  {
    id: "4",
    date: "Nov 13, 2025",
    driver: "Miguel Santos",
    deliveries: 22,
    status: "scheduled",
  },
];

export function RouteOptimizationPage() {
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);

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

        <Button onClick={() => setShowOptimizeModal(true)} className="gap-2">
          <Zap className="w-4 h-4" />
          Optimize Routes
        </Button>
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
                  {mockDrivers.length}
                </h3>
                <p className="text-xs text-[#27AE60] mt-1">
                  {mockDrivers.filter((d) => d.status !== "offline").length} active
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
                  {mockOptimizedRoutes.filter((r) => r.status === "active").length}
                </h3>
                <p className="text-xs text-blue-600 mt-1">
                  {mockOptimizedRoutes.filter((r) => r.status === "planned").length}{" "}
                  planned
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
                  {(
                    mockDrivers.reduce((sum, d) => sum + d.successRate, 0) /
                    mockDrivers.length
                  ).toFixed(1)}
                  %
                </h3>
                <p className="text-xs text-[#27AE60] mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +2.3% this week
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
                  {mockDrivers
                    .reduce((sum, d) => sum + d.distanceTraveled, 0)
                    .toFixed(1)}{" "}
                  km
                </h3>
                <p className="text-xs text-[#222B2D]/60 dark:text-white/60 mt-1">
                  Today
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

        {/* Driver Availability */}
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Driver Availability</span>
                <div className="flex items-center gap-2">
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
                </div>
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
                    <TableHead>Available Hours</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#27AE60] flex items-center justify-center">
                            <span className="text-white text-sm">
                              {driver.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-[#222B2D] dark:text-white">
                              {driver.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#222B2D]/60 dark:text-white/60" />
                          <span className="text-[#222B2D] dark:text-white">
                            {driver.vehicle}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(driver.status)}>
                          {driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-[#222B2D]/60 dark:text-white/60">
                          {driver.currentRoute || "No route assigned"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#222B2D]/60 dark:text-white/60" />
                          <span className="text-[#222B2D] dark:text-white text-sm">
                            {driver.availableHours}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-[#222B2D] dark:text-white">
                            {driver.rating}
                          </span>
                          <span className="text-yellow-500">★</span>
                        </div>
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
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimized Routes */}
        <TabsContent value="routes">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Route List */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Optimized Routes</span>
                    <Badge variant="outline">
                      {mockOptimizedRoutes.length} routes
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockOptimizedRoutes.map((route) => (
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
                          <AlertCircle
                            className={`w-4 h-4 ${getPriorityColor(
                              route.priority
                            )}`}
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
                            {route.distance} km
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

            {/* Route Preview */}
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
                      {/* Map Preview */}
                      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <MapPin className="w-12 h-12 text-[#27AE60] mx-auto" />
                          <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                            Route map preview
                          </p>
                          <p className="text-xs text-[#222B2D]/40 dark:text-white/40">
                            Google Maps API
                          </p>
                        </div>
                      </div>

                      {/* Route Info */}
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
                        <div>
                          <Label className="text-xs">Priority</Label>
                          <p
                            className={`capitalize ${getPriorityColor(
                              selectedRoute.priority
                            )}`}
                          >
                            {selectedRoute.priority}
                          </p>
                        </div>
                      </div>

                      {/* Auto-Assignment Logic */}
                      {!selectedRoute.driver && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                            Auto-assign nearest available driver?
                          </p>
                          <Button size="sm" className="w-full">
                            Auto-Assign
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-center">
                      <div className="space-y-2">
                        <Map className="w-12 h-12 text-[#222B2D]/20 dark:text-white/20 mx-auto" />
                        <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                          Select a route to view details and preview
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Performance Metrics */}
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
                  {mockDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#27AE60] flex items-center justify-center">
                            <span className="text-white text-sm">
                              {driver.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-[#222B2D] dark:text-white">
                              {driver.name}
                            </p>
                            <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
                              {driver.vehicle}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-[#222B2D] dark:text-white">
                            {driver.deliveriesPerDay}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {driver.successRate >= 95 ? (
                            <CheckCircle2 className="w-4 h-4 text-[#27AE60]" />
                          ) : (
                            <Activity className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className="text-[#222B2D] dark:text-white">
                            {driver.successRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-purple-600" />
                          <span className="text-[#222B2D] dark:text-white">
                            {driver.distanceTraveled} km
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-[#222B2D] dark:text-white">
                            {driver.rating}
                          </span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Management */}
        <TabsContent value="schedule">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Schedule Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-[#27AE60]"></div>
                    <span className="text-[#222B2D]/60 dark:text-white/60">
                      Scheduled
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span className="text-[#222B2D]/60 dark:text-white/60">
                      In Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-700"></div>
                    <span className="text-[#222B2D]/60 dark:text-white/60">
                      Completed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduled Deliveries */}
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
                    {mockScheduledDeliveries.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-[#222B2D]/60 dark:text-white/60" />
                            <span className="text-[#222B2D] dark:text-white">
                              {schedule.date}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[#222B2D] dark:text-white">
                            {schedule.driver}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[#222B2D] dark:text-white">
                            {schedule.deliveries} deliveries
                          </span>
                        </TableCell>
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
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                  Route Optimization Algorithm
                </h4>
                <p className="text-sm text-blue-900/80 dark:text-blue-100/80">
                  Our algorithm considers distance, traffic, driver availability,
                  and delivery priorities to generate the most efficient routes.
                </p>
              </div>

              {/* Map Preview */}
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Map className="w-16 h-16 text-[#27AE60] mx-auto" />
                  <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                    Optimized routes preview
                  </p>
                  <p className="text-xs text-[#222B2D]/40 dark:text-white/40">
                    Google Maps API placeholder
                  </p>
                </div>
              </div>

              {/* Optimization Results */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
                    Total Distance Saved
                  </p>
                  <p className="text-[#222B2D] dark:text-white">32.5 km</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
                    Time Saved
                  </p>
                  <p className="text-[#222B2D] dark:text-white">1h 45m</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowOptimizeModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowOptimizeModal(false);
                    // Apply optimized routes
                  }}
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
