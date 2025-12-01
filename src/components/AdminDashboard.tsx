
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Package, Truck, CheckCircle2, RotateCcw, UserPlus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { supabase } from "../utils/supabase/client";
import { PanToSelectedDriver } from "./PanToSelectedDriver";
import { AssignDriverModal } from "./AssignDriverModal";

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
}

interface DriverOption {
  id: string;
  name: string;
  email: string;
  vehicle: string;
  status: "online" | "offline";
  activeDeliveries: number;
}

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
    html: `<div class="driver-icon-wrapper" style="background-color: ${color};">
             ${firstLetter}
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
  });
};



export function AdminDashboard({ stats }: AdminDashboardProps) {
  const [driverLocations, setDriverLocations] = useState<LiveDriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<LiveDriverLocation | null>(null);
  const [drivers, setDrivers] = useState<Record<string, Driver>>({});
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<DriverOption[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<PendingDelivery | null>(null);

  // Fetch driver info for name initials in markers
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
  }
  , []);

  // Fetch pending deliveries and available drivers
  useEffect(() => {
    const fetchPendingDeliveries = async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, ref_no, customer_name, address, payment_type, status, assigned_driver, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5); // Show only recent 5 pending deliveries

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
        activeDeliveries: 0, // We'll calculate this if needed
      }));

      setAvailableDrivers(formattedDrivers);
    };

    fetchPendingDeliveries();
    fetchAvailableDrivers();
  }, []);

  // Subscribe to real-time driver GPS updates
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

  // Auto-select latest updated driver to pan map to
  useEffect(() => {
    if (driverLocations.length === 0) {
      setSelectedDriver(null);
      return;
    }

    // Sort by latest recorded_at descending
    const sortedDrivers = [...driverLocations].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    );

    setSelectedDriver(sortedDrivers[0]);
  }, [driverLocations]);

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

  // Default Leaflet marker icon
  const defaultIcon = new L.Icon({
    iconUrl: markerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
  });

  // Handler for opening assign modal
  const handleAssignDriver = (delivery: PendingDelivery) => {
    setSelectedDelivery(delivery);
    setAssignModalOpen(true);
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

      {/* Leaflet Map */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Live Driver Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <MapContainer
            center={selectedDriver ? [selectedDriver.latitude, selectedDriver.longitude] : [14.5995, 120.9842]}
            zoom={13}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <PanToSelectedDriver 
              selectedDriver={selectedDriver ? { 
                location: { lat: selectedDriver.latitude, lng: selectedDriver.longitude } 
              } : null} role = "driver"
            />
            {driverLocations.map((driver) => (
              <Marker
                key={driver.driver_id}
                position={[driver.latitude, driver.longitude]}
                icon={getDriverIcon(drivers[driver.driver_id] || {})}
              >
                <Popup>
                  <b>Driver:</b>  {drivers[driver.driver_id]?.name ?? "Unknown"} <br />
                  <b>Last update:</b> {new Date(driver.recorded_at).toLocaleTimeString()}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
}