import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Package, Truck, CheckCircle2, RotateCcw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { supabase } from "../utils/supabase/client";

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

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const [driverLocations, setDriverLocations] = useState<LiveDriverLocation[]>([]);

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
            center={[14.5995, 120.9842]}
            zoom={13}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {driverLocations.map((driver) => (
              <Marker
                key={driver.driver_id}
                position={[driver.latitude, driver.longitude]}
                icon={defaultIcon}
              >
                <Popup>
                  <b>Driver:</b> {driver.driver_id} <br />
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
