import { useState } from "react";
import { X, UserCheck, Mail, Phone, Car, CreditCard, Star, Package, Calendar, AlertCircle, Search } from "lucide-react";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface DeactivatedDriver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle?: string;
  license?: string;
  rating: number;
  completedDeliveries: number;
  deactivatedAt: string;
  reason?: string;
}

interface DeactivatedDriversModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: DeactivatedDriver[];
  isDarkMode?: boolean;
  onReactivate: (driverId: string) => Promise<void>;
}

export function DeactivatedDriversModal({
  isOpen,
  onClose,
  drivers,
  isDarkMode = false,
  onReactivate,
}: DeactivatedDriversModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const handleReactivate = async (driver: DeactivatedDriver) => {
    try {
      await onReactivate(driver.id);
      toast.success(`${driver.name} has been reactivated`);
    } catch (error) {
      toast.error("Failed to reactivate driver");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter drivers based on search query
  const filteredDrivers = drivers.filter((driver) =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone.includes(searchQuery)
  );

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      {/* Modal - Full Width */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl bg-white dark:bg-[#1a2123] rounded-lg shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Better padding */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-[#222B2D] dark:text-white">
                  Deactivated Drivers
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {filteredDrivers.length} of {drivers.length} accounts
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar - Full width with proper styling */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 h-10 text-sm bg-white dark:bg-[#222B2D] border-gray-300 dark:border-gray-600 text-[#222B2D] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60]"
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 overflow-y-auto flex-1">
            {filteredDrivers.length === 0 ? (
              <div className="py-16 text-center">
                <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-base font-medium text-[#222B2D] dark:text-white">
                  {searchQuery ? "No drivers match your search" : "No deactivated drivers found"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {searchQuery ? "Try a different search term" : "All driver accounts are currently active"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="p-4 bg-gray-50 dark:bg-[#222B2D] border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    {/* Driver Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {driver.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-[#222B2D] dark:text-white truncate">
                            {driver.name}
                          </h3>
                          <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                              {driver.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReactivate(driver)}
                        className="px-3 py-1.5 bg-[#27AE60] hover:bg-[#229954] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors flex-shrink-0 ml-3"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reactivate Driver</span>
                        <span className="sm:hidden">Reactivate</span>
                      </button>
                    </div>

                    {/* Driver Info */}
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
                      {driver.license && (
                        <div className="flex items-center gap-2 text-xs text-[#222B2D]/70 dark:text-white/70">
                          <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{driver.license}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[#222B2D] dark:text-white">
                        <Package className="w-3.5 h-3.5 text-[#27AE60] flex-shrink-0" />
                        <span>
                          <span className="font-semibold">{driver.completedDeliveries}</span> deliveries
                        </span>
                      </div>
                    </div>

                    {/* Deactivation Info */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formatDate(driver.deactivatedAt)}</span>
                      </div>
                      {driver.reason && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-[#222B2D]/70 dark:text-white/70">
                            Reason: {driver.reason}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}