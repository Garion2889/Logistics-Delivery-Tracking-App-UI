import { X, UserX, UserCheck, Mail, Phone, Clock, Search, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface DeactivatedDriver {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmingReactivate, setConfirmingReactivate] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Filter drivers based on search
  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.includes(searchTerm)
  );

  // Format phone number
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11) {
      return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReactivate = async (driverId: string, driverName: string) => {
    // Show confirmation
    setConfirmingReactivate(driverId);
  };

  const confirmReactivate = async (driverId: string, driverName: string) => {
    setReactivating(driverId);
    setConfirmingReactivate(null);
    
    try {
      await onReactivate(driverId);
      toast.success(`${driverName} has been reactivated successfully`);
    } catch (error: any) {
      toast.error(`Failed to reactivate driver: ${error.message || "Unknown error"}`);
    } finally {
      setReactivating(null);
    }
  };

  const cancelReactivate = () => {
    setConfirmingReactivate(null);
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container - Better proportions */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div
          ref={modalRef}
          className="relative w-full max-w-2xl lg:max-w-3xl my-6 sm:my-8 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Card with max height to prevent full screen takeover */}
          <Card className="border-0 shadow-2xl bg-white dark:bg-[#1a2123] max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header - Sticky with flex-shrink-0 */}
            <CardHeader className="flex-shrink-0 sticky top-0 z-10 bg-white dark:bg-[#1a2123] border-b border-gray-200 dark:border-gray-700 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/20 rounded-lg flex-shrink-0">
                    <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2
                      id="modal-title"
                      className="text-base sm:text-lg font-semibold text-[#222B2D] dark:text-white truncate"
                    >
                      Deactivated Drivers
                    </h2>
                    <p
                      id="modal-description"
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      {filteredDrivers.length} of {drivers.length} {drivers.length === 1 ? "account" : "accounts"}
                    </p>
                  </div>
                </div>
                <Button
                  ref={closeButtonRef}
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              {/* Search Bar */}
              {drivers.length > 0 && (
                <div className="mt-4 relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm"
                    aria-label="Search drivers"
                  />
                </div>
              )}
            </CardHeader>

            {/* Body - Scrollable with better height control and custom scrollbar */}
            <CardContent 
              className="flex-1 p-4 sm:p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
              style={{
                maxHeight: 'calc(85vh - 180px)', // Prevents content from being too tall
              }}
            >
              {drivers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <UserX className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No deactivated drivers found
                  </p>
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No drivers match your search
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {filteredDrivers.map((driver, index) => (
                    <Card
                      key={driver.id}
                      className="border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200"
                      style={{
                        // Add subtle animation delay for visual hierarchy
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <CardContent className="p-3 sm:p-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="font-medium text-sm sm:text-base text-[#222B2D] dark:text-white truncate flex-1">
                            {driver.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs flex-shrink-0"
                          >
                            Deactivated
                          </Badge>
                        </div>

                        {/* Info Grid */}
                        <div className="space-y-2 text-xs sm:text-sm mb-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 cursor-help">
                                  <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                  <span className="truncate">{driver.email}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{driver.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {driver.phone && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                              <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                              <span>{formatPhone(driver.phone)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                            <span>
                              {new Date(driver.deactivatedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Reason */}
                        {driver.reason && (
                          <div className="mb-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            <span className="font-medium">Reason:</span> {driver.reason}
                          </div>
                        )}

                        {/* Action Buttons */}
                        {confirmingReactivate === driver.id ? (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                              <p className="text-yellow-800 dark:text-yellow-200">
                                Are you sure you want to reactivate <strong>{driver.name}</strong>?
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => confirmReactivate(driver.id, driver.name)}
                                disabled={reactivating === driver.id}
                                className="flex-1 bg-[#27AE60] hover:bg-[#229954] text-white h-9 sm:h-10 text-xs sm:text-sm"
                                size="sm"
                              >
                                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                                Confirm
                              </Button>
                              <Button
                                onClick={cancelReactivate}
                                variant="outline"
                                className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleReactivate(driver.id, driver.name)}
                            disabled={reactivating === driver.id}
                            className="w-full bg-[#27AE60] hover:bg-[#229954] text-white h-9 sm:h-10 text-xs sm:text-sm"
                            size="sm"
                          >
                            {reactivating === driver.id ? (
                              <>
                                <span className="animate-spin mr-1.5">⏳</span>
                                Reactivating...
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                                Reactivate Driver
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(107, 114, 128, 0.7);
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(55, 65, 81, 0.7);
        }
      `}</style>
    </div>
  );
}