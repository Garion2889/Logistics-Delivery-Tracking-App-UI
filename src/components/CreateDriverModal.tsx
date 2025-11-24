import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDriver: (driver: {
    full_name: string;
    email: string;
    password: string;
    phone: string;
    vehicle: string;
  }) => void;
}

export function CreateDriverModal({
  isOpen,
  onClose,
  onCreateDriver,
}: CreateDriverModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    vehicle: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Map 'name' to 'full_name' for Edge Function
  onCreateDriver({
    full_name: formData.name,
    email: formData.email,
    password: formData.password,
    phone: formData.phone,
    vehicle: formData.vehicle,
  });
  setFormData({
    name: "",
    email: "",
    password: "",
    phone: "",
    vehicle: "",
  });
  onClose();
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Driver Account</DialogTitle>
          <DialogDescription>
            Add a new driver to the system
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
              placeholder="Juan Dela Cruz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="juan@smartstock.ph"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Contact Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+63 912 345 6789"
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
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Car">Car</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#27AE60] hover:bg-[#229954] text-white"
            >
              Create Driver
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
