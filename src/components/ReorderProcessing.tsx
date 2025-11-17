import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { AlertTriangle, Package, Clock, CheckCircle2 } from "lucide-react";

interface ReorderItem {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  supplier: string;
  suggestedQuantity: number;
  status: "pending" | "ordered" | "delivered";
  orderDate?: string;
  expectedDelivery?: string;
}

interface ReorderProcessingProps {
  onReorder: (item: ReorderItem) => void;
}

export function ReorderProcessing({ onReorder }: ReorderProcessingProps) {
  // Mock data
  const reorderItems: ReorderItem[] = [
    {
      id: "1",
      productName: "Wireless Mouse",
      sku: "ELEC-045",
      currentStock: 8,
      reorderPoint: 25,
      supplier: "Tech Supplies Inc.",
      suggestedQuantity: 50,
      status: "pending",
    },
    {
      id: "2",
      productName: "Office Chair Deluxe",
      sku: "FURN-023",
      currentStock: 12,
      reorderPoint: 15,
      supplier: "Furniture Plus",
      suggestedQuantity: 30,
      status: "pending",
    },
    {
      id: "3",
      productName: "Laptop Stand",
      sku: "ELEC-089",
      currentStock: 3,
      reorderPoint: 15,
      supplier: "Tech Supplies Inc.",
      suggestedQuantity: 40,
      status: "ordered",
      orderDate: "2024-11-08",
      expectedDelivery: "2024-11-15",
    },
    {
      id: "4",
      productName: "USB-C Cable",
      sku: "ELEC-120",
      currentStock: 0,
      reorderPoint: 50,
      supplier: "Tech Supplies Inc.",
      suggestedQuantity: 100,
      status: "ordered",
      orderDate: "2024-11-10",
      expectedDelivery: "2024-11-18",
    },
    {
      id: "5",
      productName: "Desk Organizer",
      sku: "OFF-034",
      currentStock: 5,
      reorderPoint: 20,
      supplier: "Office Depot",
      suggestedQuantity: 60,
      status: "delivered",
      orderDate: "2024-11-01",
      expectedDelivery: "2024-11-05",
    },
  ];

  const pendingCount = reorderItems.filter((item) => item.status === "pending").length;
  const orderedCount = reorderItems.filter((item) => item.status === "ordered").length;
  const deliveredCount = reorderItems.filter((item) => item.status === "delivered").length;
  const criticalItems = reorderItems.filter((item) => item.currentStock === 0).length;

  const getStatusBadge = (status: ReorderItem["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-orange-500 text-white">
            <AlertTriangle className="size-3 mr-1" />
            Pending
          </Badge>
        );
      case "ordered":
        return (
          <Badge className="bg-blue-500 text-white">
            <Clock className="size-3 mr-1" />
            Ordered
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-[#27AE60] text-white">
            <CheckCircle2 className="size-3 mr-1" />
            Delivered
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Pending Reorders
              </p>
              <p className="text-[#222B2D] dark:text-white">{pendingCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
              <AlertTriangle className="size-5 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Orders Placed
              </p>
              <p className="text-[#222B2D] dark:text-white">{orderedCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
              <Clock className="size-5 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Delivered
              </p>
              <p className="text-[#222B2D] dark:text-white">{deliveredCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#27AE60]/10 dark:bg-[#27AE60]/20">
              <CheckCircle2 className="size-5 text-[#27AE60]" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Critical (Out of Stock)
              </p>
              <p className="text-[#222B2D] dark:text-white">{criticalItems}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 dark:bg-red-500/20">
              <Package className="size-5 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Reorder Table */}
      <div className="border border-[#222B2D]/10 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-[#222B2D]/20">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F6F7F8] dark:bg-[#222B2D]/40">
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Suggested Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reorderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-[#222B2D] dark:text-white">
                    {item.productName}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {item.sku}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-[#222B2D] dark:text-white">
                        {item.currentStock}
                      </span>
                      {item.currentStock === 0 && (
                        <Badge variant="destructive" className="bg-red-500 text-white text-xs">
                          Critical
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {item.reorderPoint}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {item.supplier}
                  </TableCell>
                  <TableCell className="text-[#222B2D] dark:text-white">
                    {item.suggestedQuantity}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {item.expectedDelivery
                      ? new Date(item.expectedDelivery).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status === "pending" ? (
                      <Button
                        size="sm"
                        onClick={() => onReorder(item)}
                        className="bg-[#27AE60] hover:bg-[#229954] text-white"
                      >
                        Place Order
                      </Button>
                    ) : item.status === "ordered" ? (
                      <Button variant="outline" size="sm" disabled>
                        Order Placed
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Delivered
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Products below their reorder point are automatically flagged for reordering. 
          Review the suggested quantities and place orders with your suppliers.
        </p>
      </div>
    </div>
  );
}
