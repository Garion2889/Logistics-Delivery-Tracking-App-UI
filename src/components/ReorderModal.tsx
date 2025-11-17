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
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns@4.1.0";

interface ReorderItem {
  id: string;
  productName: string;
  sku: string;
  supplier: string;
  suggestedQuantity: number;
}

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ReorderItem | null;
  onPlaceOrder: (order: {
    itemId: string;
    supplier: string;
    quantity: number;
    expectedDelivery: Date | null;
  }) => void;
}

export function ReorderModal({
  isOpen,
  onClose,
  item,
  onPlaceOrder,
}: ReorderModalProps) {
  const [quantity, setQuantity] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState<Date | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    onPlaceOrder({
      itemId: item.id,
      supplier: item.supplier,
      quantity: parseInt(quantity),
      expectedDelivery: expectedDelivery || null,
    });

    setQuantity("");
    setExpectedDelivery(undefined);
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Place Reorder</DialogTitle>
          <DialogDescription>
            Submit a reorder request for this product from the supplier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Info */}
          <div className="bg-[#F6F7F8] dark:bg-[#222B2D]/40 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[#222B2D]/60 dark:text-white/60">Product:</span>
              <span className="font-medium text-[#222B2D] dark:text-white">
                {item.productName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#222B2D]/60 dark:text-white/60">SKU:</span>
              <span className="text-[#222B2D] dark:text-white">{item.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#222B2D]/60 dark:text-white/60">Supplier:</span>
              <span className="text-[#222B2D] dark:text-white">{item.supplier}</span>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Order Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Suggested: ${item.suggestedQuantity}`}
              required
            />
            <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
              Suggested quantity: {item.suggestedQuantity} units
            </p>
          </div>

          {/* Expected Delivery Date */}
          <div className="space-y-2">
            <Label>Expected Delivery Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {expectedDelivery ? (
                    format(expectedDelivery, "PPP")
                  ) : (
                    <span className="text-[#222B2D]/40 dark:text-white/40">
                      Pick a date
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expectedDelivery}
                  onSelect={setExpectedDelivery}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Order Summary */}
          <div className="bg-[#27AE60]/10 dark:bg-[#27AE60]/20 rounded-lg p-4 border border-[#27AE60]/30">
            <h4 className="font-medium text-[#222B2D] dark:text-white mb-2">
              Order Summary
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#222B2D]/60 dark:text-white/60">Quantity:</span>
                <span className="text-[#222B2D] dark:text-white">
                  {quantity || "-"} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#222B2D]/60 dark:text-white/60">Expected:</span>
                <span className="text-[#222B2D] dark:text-white">
                  {expectedDelivery ? format(expectedDelivery, "PP") : "-"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#27AE60] hover:bg-[#229954] text-white"
              disabled={!quantity || !expectedDelivery}
            >
              Place Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
