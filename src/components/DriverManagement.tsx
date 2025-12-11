import { useState, useEffect} from "react";
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
  user_id: string;
  name: string;      
  email: string;     
  phone: string;     
  status: "online" | "offline";
  vehicle_type: "Motorcycle" | "Car" | "Van" | "Truck";
  plate_number?: string;
  license_number?: string;
  last_lat?: number;
  last_lng?: number;
  last_location_update?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  rating?: number;
  completedDeliveries?: number;
  avatar?: string;
  isDeactivated?: boolean;
  deactivationReason?: string;
  deactivatedAt?: string;
}


interface DriverManagementProps {
  isDarkMode?: boolean;
  drivers: Driver[];
  onEditDriver: (driverId: string, userId: string, updates: Partial<Driver>) => Promise<void>;
  onDeactivateDriver: (driverId: string) => Promise<void>;
  onShowCreateDriverModal: () => void;
  onShowEditDriverModal: (driver: Driver) => void;
}

export function DriverManagement({ isDarkMode = false }: DriverManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
    

  useEffect(() => {
    const fetchDrivers = async () => {
      // 1. Update query to fetch the count from your deliveries table
      // Note: Replace 'deliveries' with your actual table name if different (e.g., 'orders', 'assignments')
      const { data, error } = await supabase
        .from("drivers")
        .select(`
          *,
          logistics_users:user_id (
            email,
            phone,
            full_name
          ),
          deliveries:deliveries(count)
        `)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching drivers:", error);
        toast.error("Failed to load drivers");
        return;
      }

      if (data) {
        const normalized = data.map((d: any) => ({
          id: d.id,
          name: d.logistics_users?.full_name ?? d.name ?? "Unnamed Driver",
          email: d.logistics_users?.email ?? "",
          phone: d.logistics_users?.phone ?? "",
          status: d.status ?? "offline",
          rating: d.rating ?? 5.0, // Default to 5 if null
          
          // 2. Map the count returned by Supabase to the property
          // Supabase returns count as an array of objects: [{ count: 5 }]
          completedDeliveries: d.deliveries?.[0]?.count ?? 0,
          
          vehicle: d.vehicle_type ?? "",
          license: d.license_number ?? "",
          avatar: "",
          isDeactivated: d.is_active === false,
          deactivatedAt: null,
          deactivationReason: null,
        }));

        setDrivers(normalized);
      }
    };

    fetchDrivers();
  }, []);

  
 const activeDrivers = drivers;

  // Apply filters to active drivers only
  const filteredDrivers = activeDrivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  });


  const handleViewDetails = (driverId: string) => {
  const driver = drivers.find((d) => d.id === driverId);
  if (driver) {
    setSelectedDriver(driver);
    setIsDetailsModalOpen(true);
  }
  };

  const handleEditDriver = (driverId: string) => {
  const driver = drivers.find((d) => d.id === driverId);
  if (driver) {
    setSelectedDriver(driver);
    setIsEditModalOpen(true);
  }
  };



  const handleUpdateDriver = (driverId: string, updates: Partial<Driver>) => {
    setDrivers(
      drivers.map((d) =>
        d.id === driverId ? { ...d, ...updates } : d
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
              {drivers.length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1a2123] border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <p className="text-xs text-[#222B2D]/60 dark:text-white/60">Active Now</p>
            <p className="text-xl font-semibold text-green-600 dark:text-green-400 mt-0.5">
              {drivers.filter((d) => d.status === "active").length}
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
              onViewDetails={handleViewDetails}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </div>


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
