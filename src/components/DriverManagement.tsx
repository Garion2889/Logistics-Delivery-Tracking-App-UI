import { useState } from "react";
import { Plus, Search, UserX, AlertCircle, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DriverCard } from "./DriverCard";
import { AddDriverModal } from "./AddDriverModal";
import { DeactivatedDriversModal } from "./DeactivatedDriversModal";
import { DriverDetailsModal } from "./DriverDetailsModal";
import { EditDriverModal } from "./EditDriverModal";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

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
  isDeactivated?: boolean;
  deactivatedAt?: string;
  deactivationReason?: string;
}

interface DriverManagementProps {
  isDarkMode?: boolean;
  drivers: Driver[];
  onEditDriver: (driverId: string, updates: Partial<Driver>) => void;
  onDeactivateDriver: (driverId: string) => void;
  onShowCreateDriverModal: () => void;
  onShowEditDriverModal: (driver: Driver) => void;
}

export function DriverManagement({ isDarkMode = false }: DriverManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivatedModalOpen, setIsDeactivatedModalOpen] = useState(false);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState<string | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
    



  // Filter active drivers (not deactivated)
  const activeDrivers = drivers.filter((driver: Driver) => !driver.isDeactivated);

  // Get deactivated drivers
  const deactivatedDrivers = drivers.filter((driver: Driver) => driver.isDeactivated);

  // Apply filters to active drivers only
  const filteredDrivers = activeDrivers.filter((driver: Driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

 const handleAddDriver = async (driverData: any) => {
  const { data, error } = await supabase
    .from("drivers")
    .insert([
      {
        full_name: driverData.name,
        email: driverData.email,
        phone: driverData.phone,
        vehicle: driverData.vehicle,
        status: "inactive",
        rating: 0,
        completedDeliveries: 0,
        isDeactivated: false,
      },
    ]);

  if (error) {
    console.error("Insert error:", error);
    toast.error("Failed to add driver");
    return;
  }

  setDrivers((prev) => [...prev, data[0]]);
  setIsAddModalOpen(false);
  toast.success(`${driverData.name} has been added successfully`);
};


  const handleDeactivate = (driverId: string) => {
    setConfirmingDeactivate(driverId);
    setDeactivationReason("");
  };

  const confirmDeactivation = () => {
  if (!confirmingDeactivate) return;

  setDrivers(
    drivers.map((driver: Driver) =>
      driver.id === confirmingDeactivate
        ? {
            ...driver,
            isDeactivated: true,
            deactivatedAt: new Date().toISOString(),
            deactivationReason:
              deactivationReason || "Account deactivated by admin",
          }
        : driver
    )
  );

  const driver = drivers.find((d) => d.id === confirmingDeactivate);
  toast.success(`${driver?.name}'s account has been deactivated`);

  setConfirmingDeactivate(null);
  setDeactivationReason("");
};


  const cancelDeactivation = () => {
    setConfirmingDeactivate(null);
    setDeactivationReason("");
  };

  const handleReactivate = async (driverId: string) => {
    const driver = drivers.find((driver: Driver) => driver.id === driverId);
    if (!driver) throw new Error("Driver not found");

    setDrivers(
      drivers.map((driver: Driver) =>
        driver.id === driverId
          ? {
              ...driver,
              isDeactivated: false,
              deactivatedAt: undefined,
              deactivationReason: undefined,
            }
          : driver
      )
    );
  };

  const handleViewDetails = (driverId: string) => {
    const driver = drivers.find((driver: Driver) => driver.id === driverId);
    if (driver) {
      setSelectedDriver(driver);
      setIsDetailsModalOpen(true);
    }
  };

  const handleEditDriver = (driverId: string) => {
    const driver = drivers.find((driver: Driver) => driver.id === driverId);
    if (driver) {
      setSelectedDriver(driver);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateDriver = (driverId: string, updates: Partial<Driver>) => {
    setDrivers(
      drivers.map((driver: Driver) =>
        driver.id === driverId ? { ...driver, ...updates } : driver
      )
    );
    toast.success("Driver updated successfully");
  };

  return (
    <>
      {/* Main Content */}
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#222B2D] dark:text-white">
              Driver Management
            </h1>
            <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
              Manage driver accounts and assignments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsDeactivatedModalOpen(true)}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600 text-[#222B2D] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <UserX className="w-4 h-4 mr-1.5" />
              Deactivated ({deactivatedDrivers.length})
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              className="bg-[#27AE60] hover:bg-[#229954] text-white"
            >
              <Plus className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Add Driver</span>
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white dark:bg-[#1a2123] border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white dark:bg-[#222B2D] border-gray-300 dark:border-gray-600 text-sm text-[#222B2D] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-10 bg-white dark:bg-[#222B2D] border-gray-300 dark:border-gray-600 text-sm text-[#222B2D] dark:text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1a2123] border-gray-200 dark:border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on-break">On Break</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-white dark:bg-[#1a2123] border-gray-200 dark:border-gray-700">
            <CardContent className="p-3">
              <p className="text-xs text-[#222B2D]/60 dark:text-white/60">Total Drivers</p>
              <p className="text-xl font-semibold text-[#222B2D] dark:text-white mt-0.5">
                {activeDrivers.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#1a2123] border-gray-200 dark:border-gray-700">
            <CardContent className="p-3">
              <p className="text-xs text-[#222B2D]/60 dark:text-white/60">Active Now</p>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400 mt-0.5">
                {activeDrivers.filter((d) => d.status === "active").length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#1a2123] border-gray-200 dark:border-gray-700">
            <CardContent className="p-3">
              <p className="text-xs text-[#222B2D]/60 dark:text-white/60">On Break</p>
              <p className="text-xl font-semibold text-yellow-600 dark:text-yellow-400 mt-0.5">
                {activeDrivers.filter((d) => d.status === "on-break").length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#1a2123] border-gray-200 dark:border-gray-700">
            <CardContent className="p-3">
              <p className="text-xs text-[#222B2D]/60 dark:text-white/60">Deactivated</p>
              <p className="text-xl font-semibold text-red-600 dark:text-red-400 mt-0.5">
                {deactivatedDrivers.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Drivers Grid */}
        {filteredDrivers.length === 0 ? (
          <Card className="bg-white dark:bg-[#1a2123] border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <Search className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-[#222B2D] dark:text-white font-medium text-sm">No drivers found</p>
              <p className="text-xs text-[#222B2D]/60 dark:text-white/60 mt-1">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredDrivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                onEdit={handleEditDriver}
                onDeactivate={handleDeactivate}
                onViewDetails={handleViewDetails}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        )}

        {/* Inline Deactivation Confirmation Modal - Keep inside main content */}
        {confirmingDeactivate && (
          <>
            <div
              className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[60]"
              onClick={cancelDeactivation}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <Card
                className="w-full max-w-md bg-white dark:bg-[#1a2123] border-0 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-lg text-[#222B2D] dark:text-white">
                      Deactivate Driver Account
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Are you sure you want to deactivate{" "}
                    <strong>
                      {drivers.find((d) => d.id === confirmingDeactivate)?.name}
                    </strong>
                    's account? This will remove them from the active driver list.
                  </p>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Reason for deactivation (optional)
                    </label>
                    <textarea
                      value={deactivationReason}
                      onChange={(e) => setDeactivationReason(e.target.value)}
                      placeholder="e.g., Policy violation, Request by driver, etc."
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-[#222B2D] border border-gray-300 dark:border-gray-600 rounded-lg text-[#222B2D] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#27AE60] focus:border-transparent outline-none resize-vertical"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      onClick={cancelDeactivation}
                      variant="outline"
                      className="bg-white dark:bg-[#222B2D] border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmDeactivation}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Deactivate Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* ===== ALL MODALS MOVED OUTSIDE - ROOT LEVEL ===== */}
      
      {/* Add Driver Modal */}
      <AddDriverModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDriver}
        isDarkMode={isDarkMode}
      />

      {/* Edit Driver Modal */}
      <EditDriverModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDriver(null);
        }}
        driver={selectedDriver}
        onUpdate={handleUpdateDriver}
        currentUserId="your-admin-user-id"
        isDarkMode={isDarkMode}
      />

      {/* Deactivated Drivers Modal */}
      <DeactivatedDriversModal
        isOpen={isDeactivatedModalOpen}
        onClose={() => setIsDeactivatedModalOpen(false)}
        drivers={deactivatedDrivers.map((driver: Driver) => ({
          ...driver,
          deactivatedAt: driver.deactivatedAt || new Date().toISOString(),
          reason: driver.deactivationReason,
          }))}

        isDarkMode={isDarkMode}
        onReactivate={handleReactivate}
      />

      {/* Driver Details Modal */}
      <DriverDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        driver={selectedDriver}
        isDarkMode={isDarkMode}
      />
    </>
  );
}