import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // adjust path to your supabase client
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
  id: string;       // drivers.id
  user_id: string;  // optional
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
  onUpdate: (driverId: string, userId: string, updates: Partial<Driver>) => void;
  currentUserId: string; // your logged-in admin UUID
}

export function EditDriverModal({
  isOpen,
  onClose,
  driver,
  onUpdate,
  currentUserId
}: EditDriverModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicle: "",
  });
  const [userId, setUserId] = useState<string>("");

  // Load initial form data
  useEffect(() => {
    if (!driver) return;

    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehicle: driver.vehicle,
    });

    if (!driver.user_id) {
      (async () => {
        const { data, error } = await supabase
          .from("drivers")
          .select("user_id")
          .eq("id", driver.id)
          .single();
        if (error) console.error("Failed to fetch user_id:", error);
        else setUserId(data.user_id);
      })();
    } else {
      setUserId(driver.user_id);
    }
  }, [driver]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver || !userId) return;

    // Prepare updates for RPC
    const updates = {
      p_caller: userId,          // your admin UUID
      p_driver_id: driver.id,
      p_email: formData.email || null,
      p_full_name: formData.name || null,
      p_phone: formData.phone || null,
      p_vehicle: formData.vehicle ? { type: formData.vehicle } : null, // JSON
    };

    const { data, error } = await supabase.rpc("update_driver_profile", updates);

    if (error) {
      console.error("Failed to update driver profile:", error);
      alert("Error updating driver profile: " + error.message);
      return;
    }

    console.log("Driver updated successfully:", data);

    // Notify parent component
    onUpdate(driver.id, userId, formData);

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
