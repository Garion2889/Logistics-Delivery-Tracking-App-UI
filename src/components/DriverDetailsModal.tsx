import { useState, useEffect } from "react";
import { X, Mail, Phone, Star, Package, Car, CreditCard, MapPin, Clock, TrendingUp } from "lucide-react";
import { Badge } from "./ui/badge";
import { supabase } from "../utils/supabase/client";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "on-break" | "online" | "offline";
  completedDeliveries: number;
  avatar?: string;
  vehicle?: string;
  license?: string;
  rating?: number;
}

interface Delivery {
  id: string;
  ref_no: string;
  address: string;
  status: string;
  updated_at: string;
}

interface DriverDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
  isDarkMode?: boolean;
}
const formatStatus = (status: string) => {
  if (!status) return "Unknown";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
export function DriverDetailsModal({
  isOpen,
  onClose,
  driver,
  isDarkMode = false,
}: DriverDetailsModalProps) {
  
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    successRate: 0,
    avgTime: "", 
  });

  useEffect(() => {
    if (!driver || !isOpen) return;

    const fetchDriverDetails = async () => {
      const { data: deliveries, error } = await supabase
        .from('deliveries')
        .select('id, ref_no, address, status, updated_at')
        .eq('assigned_driver', driver.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (!error && deliveries) {
        setRecentDeliveries(deliveries as unknown as Delivery[]);

     // Completed Deliveries Count
const { count: completedCount } = await supabase
  .from('deliveries')
  .select('*', { count: 'exact', head: true })
  .eq('assigned_driver', driver.id)
  .eq('status', 'delivered');

// Total Deliveries Count
const { count: totalCount } = await supabase
  .from('deliveries')
  .select('*', { count: 'exact', head: true })
  .eq('assigned_driver', driver.id);

// Average Delivery Time (actual value, not count)
const { data: avgTimeData } = await supabase
  .from('analytics_driver_performance')
  .select('avg_delivery_time_minutes')
  .eq('driver_id', driver.id)
  .maybeSingle();

const total = totalCount || 1;
const completed = completedCount || 0;
const avgTimeRaw = avgTimeData?.avg_delivery_time_minutes || 0;
const avgTime = Math.round(avgTimeRaw);  // ⬅️ no decimals

setStats({
  totalCompleted: completed,
  successRate: Math.round((completed / total) * 100),
  avgTime: avgTime ? `${avgTime} mins` : "N/A",
});
      } else {
        console.error("Error fetching driver details:", error);
      }
    };

    fetchDriverDetails();
  }, [driver, isOpen]);

  if (!isOpen || !driver) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "online":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive":
      case "offline":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "on-break":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="
            w-full max-w-md 
            bg-white dark:bg-[#1a2123] 
            border border-gray-200 dark:border-gray-700 
            rounded-lg shadow-2xl 
            flex flex-col 
            overflow-hidden
            h-[400px] 
            max-h-[90vh]
          "
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0 bg-white dark:bg-[#1a2123] z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#27AE60] flex items-center justify-center text-white font-semibold text-lg">
                  {driver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#222B2D] dark:text-white">
                    {driver.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs px-2 py-0.5 h-5 ${getStatusColor(driver.status)}`}>
                      {formatStatus(driver.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto  flex-1 space-y-4">
            
            {/* Contact & Vehicle */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-[#222B2D] border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-2">
                  Contact
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-[#222B2D] dark:text-white truncate" title={driver.email}>{driver.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-[#222B2D] dark:text-white">{driver.phone || "No phone"}</span>
                  </div>
                </div>
              </div>

              {(driver.vehicle || driver.license) && (
                <div className="bg-gray-50 dark:bg-[#222B2D] border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-2">
                    Vehicle
                  </p>
                  <div className="space-y-2">
                    {driver.vehicle && (
                      <div className="flex items-center gap-2">
                        <Car className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-[#222B2D] dark:text-white truncate">{driver.vehicle}</span>
                      </div>
                    )}
                    {driver.license && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-[#222B2D] dark:text-white">{driver.license}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Performance */}
            <div className="bg-gray-50 dark:bg-[#222B2D] border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
                Performance
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#27AE60]/10 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-[#27AE60]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Completed Deliveries</p>
                    <p className="text-sm font-semibold text-[#222B2D] dark:text-white leading-tight">
                      {stats.totalCompleted}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Success</p>
                    <p className="text-sm font-semibold text-[#222B2D] dark:text-white leading-tight">{stats.successRate}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Avg Time</p>
                    <p className="text-sm font-semibold text-[#222B2D] dark:text-white leading-tight">{stats.avgTime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Deliveries */}
            <div className="bg-gray-50 dark:bg-[#222B2D] border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
                Recent Deliveries
              </p>
              <div className="space-y-3"> {/* Increased spacing between items */}
                {recentDeliveries.length > 0 ? (
                  recentDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-start gap-3 p-3 bg-white dark:bg-[#1a2123] border border-gray-200 dark:border-gray-700 rounded hover:border-gray-300 transition-colors"
                    >
                      {/* Icon aligned top */}
                      <div className="w-7 h-7 rounded bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      
                      {/* Content with explicit spacing */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        
                        {/* Row 1: Ref No + Badge */}
                        <div className="flex items-center justify-between w-full">
                          <p className="text-xs font-bold text-[#222B2D] dark:text-white truncate">
                            {delivery.ref_no}
                          </p>
                          <Badge className={`text-xs px-2 py-0.5 h-5 flex-shrink-0 ${
                              delivery.status === 'delivered' ? "bg-green-100 text-green-800" : 
                              delivery.status === 'in_transit' ? "bg-purple-100 text-purple-800" :
                              delivery.status === 'returned' ? "bg-red-100 text-red-800" :
                              delivery.status === 'picked_up' ? "bg-yellow-100 text-yellow-800" :
                              delivery.status === 'cancelled' ? "bg-gray-100 text-gray-800" :
                              delivery.status === 'assigned' ? "bg-blue-100 text-blue-800" :
                              delivery.status === 'pending' ? "bg-yellow-100 text-yellow-800" : "bg-ray-100"
                          }`}>
                            {formatStatus(delivery.status.replace('_', ' '))}
                         
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                          {delivery.address}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                           <Clock className="w-3 h-3" />
                           <span>{new Date(delivery.updated_at).toLocaleString()}</span>
                        </div>

                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">No recent deliveries found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}