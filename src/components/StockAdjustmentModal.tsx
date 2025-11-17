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
import { Textarea } from "./ui/textarea";
import { Plus, Minus } from "lucide-react";

interface StockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem | null;
  type: "add" | "deduct";
  onAdjust: (itemId: string, quantity: number, reason: string) => void;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  item,
  type,
  onAdjust,
}: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const adjustmentQty = type === "add" ? parseInt(quantity) : -parseInt(quantity);
    onAdjust(item.id, adjustmentQty, reason);
    
    setQuantity("");
    setReason("");
    onClose();
  };

  if (!item) return null;

  const newStock = type === "add" 
    ? item.stock + parseInt(quantity || "0")
    : item.stock - parseInt(quantity || "0");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "add" ? (
              <>
                <Plus className="size-5 text-[#27AE60]" />
                Add Stock
              </>
            ) : (
              <>
                <Minus className="size-5 text-orange-500" />
                Deduct Stock
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === "add" 
              ? "Increase the stock quantity for this product."
              : "Decrease the stock quantity for this product."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Info */}
          <div className="bg-[#F6F7F8] dark:bg-[#222B2D]/40 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[#222B2D]/60 dark:text-white/60">Product:</span>
              <span className="font-medium text-[#222B2D] dark:text-white">{item.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#222B2D]/60 dark:text-white/60">SKU:</span>
              <span className="text-[#222B2D] dark:text-white">{item.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#222B2D]/60 dark:text-white/60">Current Stock:</span>
              <span className="text-[#222B2D] dark:text-white">{item.stock}</span>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity to {type === "add" ? "Add" : "Deduct"} *
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={type === "deduct" ? item.stock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* New Stock Preview */}
          {quantity && (
            <div className="bg-[#27AE60]/10 dark:bg-[#27AE60]/20 rounded-lg p-3 border border-[#27AE60]/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#222B2D] dark:text-white">
                  New Stock Level:
                </span>
                <span className="font-medium text-[#27AE60]">
                  {newStock < 0 ? 0 : newStock}
                </span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                type === "add"
                  ? "e.g., New stock delivery, Returned items"
                  : "e.g., Damaged goods, Quality check failure, Sale"
              }
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className={
                type === "add"
                  ? "bg-[#27AE60] hover:bg-[#229954] text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }
            >
              {type === "add" ? "Add Stock" : "Deduct Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
