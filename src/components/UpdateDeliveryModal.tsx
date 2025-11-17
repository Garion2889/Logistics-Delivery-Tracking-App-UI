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
import { Textarea } from "./ui/textarea";

interface Delivery {
  id: string;
  refNo: string;
  customer: string;
  address: string;
  paymentType: "COD" | "Paid";
  status: "pending" | "assigned" | "in-transit" | "delivered" | "returned";
  phone?: string;
  amount?: number;
}

interface UpdateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onUpdate: (deliveryId: string, updates: Partial<Delivery>) => void;
}

export function UpdateDeliveryModal({
  isOpen,
  onClose,
  delivery,
  onUpdate,
}: UpdateDeliveryModalProps) {
  const [formData, setFormData] = useState({
    customer: delivery?.customer || "",
    phone: delivery?.phone || "",
    address: delivery?.address || "",
    paymentType: delivery?.paymentType || "COD",
    amount: delivery?.amount?.toString() || "",
    status: delivery?.status || "pending",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;

    onUpdate(delivery.id, {
      customer: formData.customer,
      phone: formData.phone,
      address: formData.address,
      paymentType: formData.paymentType as "COD" | "Paid",
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      status: formData.status as Delivery["status"],
    });

    onClose();
  };

  if (!delivery) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Delivery - {delivery.refNo}</DialogTitle>
          <DialogDescription>
            Modify the delivery information and status below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer Name</Label>
            <Input
              id="customer"
              value={formData.customer}
              onChange={(e) =>
                setFormData({ ...formData, customer: e.target.value })
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select
                value={formData.paymentType}
                onValueChange={(value) =>
                  setFormData({ ...formData, paymentType: value })
                }
              >
                <SelectTrigger id="paymentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COD">Cash on Delivery</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Delivery Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
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
              Update Delivery
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}