import { Star, Eye, UserX, Phone, Mail, Car, Package, Edit } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
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

interface DriverCardProps {
  driver: Driver;
  onEdit: (driverId: string) => void; // ← ADD THIS
  onDeactivate: (driverId: string) => void;
  onViewDetails: (driverId: string) => void;
  isDarkMode?: boolean;
}

export function DriverCard({
  driver,
  onEdit, // ← ADD THIS
  onDeactivate,
  onViewDetails,
  isDarkMode = false,
}: DriverCardProps) {
  const getStatusBadge = () => {
    const statusConfig = {
      active: {
        label: "Active",
        className:
          "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
      },
      inactive: {
        label: "Inactive",
        className:
          "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      },
      "on-break": {
        label: "On Break",
        className:
          "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      },
    };

    const config = statusConfig[driver.status];
    return (
      <Badge
        variant="outline"
        className={`text-xs font-medium ${config.className}`}
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="bg-white dark:bg-[#1a2123] border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header with Avatar, Name, Rating, and Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#27AE60] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {driver.name.charAt(0).toUpperCase()}
            </div>
            {/* Name and Rating */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-[#222B2D] dark:text-white truncate">
                {driver.name}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-[#222B2D] dark:text-white">
                  {(driver.rating ?? 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
          {/* Status Badge - Moved to top right */}
          {getStatusBadge()}
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-[#222B2D]/70 dark:text-white/70">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{driver.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#222B2D]/70 dark:text-white/70">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{driver.phone}</span>
          </div>
          {driver.vehicle && (
            <div className="flex items-center gap-2 text-xs text-[#222B2D]/70 dark:text-white/70">
              <Car className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{driver.vehicle}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <Package className="w-3.5 h-3.5 text-[#27AE60] flex-shrink-0" />
          <span className="text-xs text-[#222B2D] dark:text-white">
            <span className="font-semibold">{driver.completedDeliveries}</span>{" "}
            deliveries
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => onViewDetails(driver.id)}
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs border-gray-300 dark:border-gray-600 text-[#222B2D] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            View
          </Button>
          <Button
            onClick={() => onEdit(driver.id)}
            variant="outline"
            size="sm"
            className="h-8 px-3 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={() => onDeactivate(driver.id)}
            variant="outline"
            size="sm"
            className="h-8 px-3 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <UserX className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}