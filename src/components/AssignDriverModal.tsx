import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Truck, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Driver {
  id: string;
  name: string;
  email: string;
  vehicle: string;
  // Updated type to allow for other statuses like 'on_delivery'
  status: "online" | "offline" | string; 
  activeDeliveries: number;
}

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  deliveryRefNo: string;
  onAssign: (driverId: string) => void;
}

export function AssignDriverModal({
  isOpen,
  onClose,
  drivers,
  deliveryRefNo,
  onAssign,
}: AssignDriverModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const filteredDrivers = drivers
    // 1. Logic to HIDE drivers with active deliveries or offline status
    // We only show drivers who are strictly "online" and available.
    .filter((driver) => driver.status === "online")
    // 2. Search Logic
    .filter((driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleAssign = () => {
    if (selectedDriver) {
      onAssign(selectedDriver);
      setSelectedDriver(null);
      setSearchTerm("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
          <DialogDescription>
            Select an available driver to assign to delivery {deliveryRefNo}. 
            (Only online drivers are shown)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search drivers by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Driver List */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredDrivers.length === 0 ? (
                 <div className="text-center py-8 text-gray-500">
                   No available drivers found.
                 </div>
              ) : (
                filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    onClick={() => setSelectedDriver(driver.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDriver === driver.id
                        ? "border-[#27AE60] bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[#222B2D] dark:text-white">
                              {driver.name}
                            </p>
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
                          <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                            {driver.email}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm text-[#222B2D]/60 dark:text-white/60">
                              <Truck className="w-4 h-4" />
                              {driver.vehicle}
                            </div>
                            <div className="text-sm text-[#222B2D]/60 dark:text-white/60">
                              Active: {driver.activeDeliveries}
                            </div>
                          </div>
                        </div>
                      </div>
                      {selectedDriver === driver.id && (
                        <CheckCircle2 className="w-6 h-6 text-[#27AE60]" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedDriver}
              className="flex-1 bg-[#27AE60] hover:bg-[#229954] text-white"
            >
              Assign Driver
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}