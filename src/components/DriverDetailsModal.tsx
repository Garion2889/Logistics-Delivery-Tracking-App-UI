import { X, Mail, Phone, Star, Package, Car, CreditCard, MapPin, Clock, TrendingUp } from "lucide-react";
import { Badge } from "./ui/badge";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "on-break";
  rating: number;
  completedDeliveries: number;
  avatar?: string;
  vehicle?: string;
  license?: string;
}

interface DriverDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
  isDarkMode?: boolean;
}

export function DriverDetailsModal({
  isOpen,
  onClose,
  driver,
  isDarkMode = false,
}: DriverDetailsModalProps) {
  if (!isOpen || !driver) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "on-break":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "on-break":
        return "On Break";
      default:
        return status;
    }
  };

  // Mock recent deliveries
  const recentDeliveries = [
    {
      id: "1",
      trackingNumber: "TRK-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      destination: "123 Main St, New York, NY",
      status: "Delivered",
      time: "2 hours ago",
    },
    {
      id: "2",
      trackingNumber: "TRK-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      destination: "456 Oak Ave, Brooklyn, NY",
      status: "Delivered",
      time: "5 hours ago",
    },
    {
      id: "3",
      trackingNumber: "TRK-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      destination: "789 Pine Rd, Queens, NY",
      status: "Delivered",
      time: "1 day ago",
    },
  ];

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      {/* Modal - Fixed Height with Scroll */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3">
        <div
          className="w-full max-w-md bg-white dark:bg-[#1a2123] border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl h-[600px] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
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
                      {getStatusLabel(driver.status)}
                    </Badge>
                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                        {driver.rating.toFixed(1)}
                      </span>
                    </div>
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

          {/* Content - Scrollable */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* Contact & Vehicle - Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Contact */}
              <div className="bg-gray-50 dark:bg-[#222B2D] border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-2">
                  Contact
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-[#222B2D] dark:text-white truncate">{driver.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-[#222B2D] dark:text-white">{driver.phone}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle */}
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

            {/* Performance - Compact 2x2 Grid */}
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
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Deliveries</p>
                    <p className="text-sm font-semibold text-[#222B2D] dark:text-white leading-tight">
                      {driver.completedDeliveries}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Rating</p>
                    <p className="text-sm font-semibold text-[#222B2D] dark:text-white leading-tight">
                      {driver.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Success</p>
                    <p className="text-sm font-semibold text-[#222B2D] dark:text-white leading-tight">98.5%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Avg Time</p>
                    <p className="text-sm font-semibold text-[#222B2D] dark:text-white leading-tight">32 min</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Deliveries - Compact */}
            <div className="bg-gray-50 dark:bg-[#222B2D] border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-3">
                Recent Deliveries
              </p>
              <div className="space-y-2">
                {recentDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-start gap-2 p-2.5 bg-white dark:bg-[#1a2123] border border-gray-200 dark:border-gray-700 rounded"
                  >
                    <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-medium text-[#222B2D] dark:text-white truncate">
                          {delivery.trackingNumber}
                        </p>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-2 py-0.5 h-5">
                          {delivery.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {delivery.destination}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                        {delivery.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}