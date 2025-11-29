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
import { toast } from "sonner";

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
}

export function DriverManagement({ isDarkMode = false }: DriverManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeactivatedModalOpen, setIsDeactivatedModalOpen] = useState(false);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState<string | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: "1",
      name: "John Driver",
      email: "john.driver15@example.com",
      phone: "(123) 456-7890",
      status: "active",
      rating: 4.8,
      completedDeliveries: 234,
      vehicle: "Toyota Camry 2020",
      license: "DL-12345",
    },
    {
      id: "2",
      name: "Bulma",
      email: "bulma@gmail.com",
      phone: "+0 (947) 982-6331",
      status: "inactive",
      rating: 4.5,
      completedDeliveries: 156,
      vehicle: "Honda Civic 2019",
      license: "DL-67890",
    },
    {
      id: "3",
      name: "Gohan",
      email: "gohan@gmail.com",
      phone: "(555) 123-4567",
      status: "on-break",
      rating: 4.9,
      completedDeliveries: 389,
      vehicle: "Ford Transit 2021",
      license: "DL-11111",
    },
  ]);

  // Filter active drivers (not deactivated)
  const activeDrivers = drivers.filter((driver) => !driver.isDeactivated);

  // Get deactivated drivers
  const deactivatedDrivers = drivers.filter((driver) => driver.isDeactivated);

  // Apply filters to active drivers only
  const filteredDrivers = activeDrivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAddDriver = (driverData: any) => {
    const newDriver: Driver = {
      id: Date.now().toString(),
      ...driverData,
      rating: 0,
      completedDeliveries: 0,
      status: "inactive" as const,
      isDeactivated: false,
    };

    setDrivers([...drivers, newDriver]);
    setIsAddModalOpen(false);
    toast.success(`${driverData.name} has been added successfully`);
  };

  const handleDeactivate = (driverId: string) => {
    setConfirmingDeactivate(driverId);
    setDeactivationReason("");
  };

  const confirmDeactivation = () => {
    if (!confirmingDeactivate) return;

    const driver = drivers.find((d) => d.id === confirmingDeactivate);
    if (!driver) return;

    setDrivers(
      drivers.map((d) =>
        d.id === confirmingDeactivate
          ? {
              ...d,
              isDeactivated: true,
              deactivatedAt: new Date().toISOString(),
              deactivationReason: deactivationReason || "Account deactivated by admin",
            }
          : d
      )
    );

    toast.success(`${driver.name}'s account has been deactivated`);
    setConfirmingDeactivate(null);
    setDeactivationReason("");
  };

  const cancelDeactivation = () => {
    setConfirmingDeactivate(null);
    setDeactivationReason("");
  };

  const handleReactivate = async (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");

    setDrivers(
      drivers.map((d) =>
        d.id === driverId
          ? {
              ...d,
              isDeactivated: false,
              deactivatedAt: undefined,
              deactivationReason: undefined,
            }
          : d
      )
    );
  };

  const handleViewDetails = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver) {
      setSelectedDriver(driver);
      setIsDetailsModalOpen(true);
    }
  };

  return (
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

      {/* Filters and Search - NEW DESIGN */}
      <Card className="bg-white dark:bg-[#1a2123] border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar - Takes most space */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-white dark:bg-[#222B2D] border-gray-300 dark:border-gray-600 text-sm text-[#222B2D] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            {/* Status Filter - Fixed width */}
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

      {/* Stats - More Compact Grid */}
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

      {/* Drivers Grid - More Compact */}
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
              onDeactivate={handleDeactivate}
              onViewDetails={handleViewDetails}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
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

      {/* Add Driver Modal */}
      <AddDriverModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDriver}
        isDarkMode={isDarkMode}
      />

      {/* Deactivated Drivers Modal */}
      <DeactivatedDriversModal
        isOpen={isDeactivatedModalOpen}
        onClose={() => setIsDeactivatedModalOpen(false)}
        drivers={deactivatedDrivers.map((driver) => ({
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          vehicle: driver.vehicle,
          license: driver.license,
          rating: driver.rating,
          completedDeliveries: driver.completedDeliveries,
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
    </div>
  );
}