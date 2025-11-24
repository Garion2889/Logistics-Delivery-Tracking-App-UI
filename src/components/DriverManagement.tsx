import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Search, Plus, Edit, UserX, User, Truck } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  status: "online" | "offline";
  activeDeliveries: number;
}

interface DriverManagementProps {
  drivers: Driver[];
  onEditDriver: (driver: Driver, updatedFields: any) => Promise<void>;
  onDeactivateDriver: (driver: Driver) => void;
  onShowCreateDriverModal: () => void; 
  onShowEditDriverModal: (driver: Driver) => void;
}



export function DriverManagement({
  drivers,
  onEditDriver,
  onDeactivateDriver,
  onShowCreateDriverModal,
  onShowEditDriverModal
}: DriverManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#222B2D] dark:text-white mb-2">
            Driver Management
          </h1>
          <p className="text-[#222B2D]/60 dark:text-white/60">
            Manage driver accounts and assignments
          </p>
        </div>
        <Button
          onClick={onShowCreateDriverModal}
          className="bg-[#27AE60] hover:bg-[#229954] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Driver Account
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search drivers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <Card className="border-0 shadow-sm hidden md:block">
        <CardHeader>
          <CardTitle>All Drivers ({filteredDrivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Deliveries</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[#222B2D] dark:text-white">
                          {driver.name}
                        </p>
                        <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                          {driver.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      {driver.vehicle}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        driver.status === "online"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      }
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-1 ${
                          driver.status === "online"
                            ? "bg-green-600"
                            : "bg-gray-600"
                        }`}
                      ></span>
                      {driver.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{driver.activeDeliveries}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onShowEditDriverModal(driver)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeactivateDriver(driver)}
                        className="text-red-600"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredDrivers.map((driver) => (
          <Card key={driver.id} className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[#222B2D] dark:text-white">
                      {driver.name}
                    </p>
                    <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                      {driver.email}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    driver.status === "online"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  }
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-1 ${
                      driver.status === "online"
                        ? "bg-green-600"
                        : "bg-gray-600"
                    }`}
                  ></span>
                  {driver.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#222B2D]/60 dark:text-white/60">
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  {driver.vehicle}
                </div>
                <div>Active: {driver.activeDeliveries}</div>
              </div>
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                {driver.phone}
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowEditDriverModal(driver)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeactivateDriver(driver)}
                  className="flex-1 text-red-600"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}