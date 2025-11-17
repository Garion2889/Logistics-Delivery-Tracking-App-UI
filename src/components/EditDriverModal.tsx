import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  status: "online" | "offline";
}

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
  onUpdate: (driverId: string, updates: Partial<Driver>) => void;
}

export function EditDriverModal({
  isOpen,
  onClose,
  driver,
  onUpdate,
}: EditDriverModalProps) {
  const [formData, setFormData] = useState({
    name: driver?.name || "",
    email: driver?.email || "",
    phone: driver?.phone || "",
    vehicle: driver?.vehicle || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver) return;

    onUpdate(driver.id, formData);
    onClose();
  };

  if (!driver) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
          <DialogDescription>
            Update the driver's information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle Type</Label>
            <Select
              value={formData.vehicle}
              onValueChange={(value) =>
                setFormData({ ...formData, vehicle: value })
              }
            >
              <SelectTrigger id="vehicle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                <SelectItem value="Sedan">Sedan</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#27AE60] hover:bg-[#229954] text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}