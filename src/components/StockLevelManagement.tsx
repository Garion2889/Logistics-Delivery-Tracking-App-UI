import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Package,
  AlertTriangle,
  XCircle,
  Calendar,
  Download,
  Plus,
  Minus,
} from "lucide-react";

interface StockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorderPoint: number;
  maxCapacity: number;
  lastRestocked: string;
  nextRestock?: string;
}

interface StockLevelManagementProps {
  onAdjustStock: (item: StockItem, type: "add" | "deduct") => void;
}

export function StockLevelManagement({
  onAdjustStock,
}: StockLevelManagementProps) {
  // Mock data
  const stockItems: StockItem[] = [
    {
      id: "1",
      name: "Smartphone Model X",
      sku: "ELEC-001",
      stock: 45,
      reorderPoint: 20,
      maxCapacity: 100,
      lastRestocked: "2024-11-05",
      nextRestock: "2024-11-20",
    },
    {
      id: "2",
      name: "Office Chair Deluxe",
      sku: "FURN-023",
      stock: 12,
      reorderPoint: 15,
      maxCapacity: 50,
      lastRestocked: "2024-10-28",
    },
    {
      id: "3",
      name: "Wireless Mouse",
      sku: "ELEC-045",
      stock: 8,
      reorderPoint: 25,
      maxCapacity: 80,
      lastRestocked: "2024-11-01",
    },
    {
      id: "4",
      name: "Desk Lamp LED",
      sku: "OFF-012",
      stock: 34,
      reorderPoint: 10,
      maxCapacity: 60,
      lastRestocked: "2024-11-08",
      nextRestock: "2024-11-15",
    },
    {
      id: "5",
      name: "Laptop Stand",
      sku: "ELEC-089",
      stock: 3,
      reorderPoint: 15,
      maxCapacity: 40,
      lastRestocked: "2024-10-20",
    },
    {
      id: "6",
      name: "USB-C Cable",
      sku: "ELEC-120",
      stock: 0,
      reorderPoint: 50,
      maxCapacity: 200,
      lastRestocked: "2024-09-15",
    },
  ];

  const totalProducts = stockItems.length;
  const lowStockItems = stockItems.filter((item) => item.stock <= item.reorderPoint && item.stock > 0);
  const outOfStockItems = stockItems.filter((item) => item.stock === 0);
  const upcomingRestocks = stockItems.filter((item) => item.nextRestock).length;

  const getStockStatus = (stock: number, reorderPoint: number) => {
    if (stock === 0) return "out";
    if (stock <= reorderPoint) return "low";
    return "normal";
  };

  const getStockPercentage = (stock: number, maxCapacity: number) => {
    return (stock / maxCapacity) * 100;
  };

  const handleExportStock = () => {
    // Export logic here
    console.log("Exporting stock data...");
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Total Products
              </p>
              <p className="text-[#222B2D] dark:text-white">{totalProducts}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#27AE60]/10 dark:bg-[#27AE60]/20">
              <Package className="size-5 text-[#27AE60]" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Low Stock Items
              </p>
              <p className="text-[#222B2D] dark:text-white">{lowStockItems.length}</p>
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
                Out of Stock
              </p>
              <p className="text-[#222B2D] dark:text-white">{outOfStockItems.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 dark:bg-red-500/20">
              <XCircle className="size-5 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Upcoming Restocks
              </p>
              <p className="text-[#222B2D] dark:text-white">{upcomingRestocks}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
              <Calendar className="size-5 text-blue-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExportStock}>
          <Download className="size-4 mr-2" />
          Export Stock Data (CSV)
        </Button>
      </div>

      {/* Stock Table */}
      <div className="border border-[#222B2D]/10 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-[#222B2D]/20">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F6F7F8] dark:bg-[#222B2D]/40">
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Restocked</TableHead>
                <TableHead>Next Restock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockItems.map((item) => {
                const status = getStockStatus(item.stock, item.reorderPoint);
                const percentage = getStockPercentage(item.stock, item.maxCapacity);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-[#222B2D] dark:text-white">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                      {item.sku}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#222B2D] dark:text-white">
                            {item.stock} / {item.maxCapacity}
                          </span>
                          <span className="text-[#222B2D]/60 dark:text-white/60">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className={`h-2 ${
                            status === "out"
                              ? "bg-red-100 dark:bg-red-900/20"
                              : status === "low"
                              ? "bg-orange-100 dark:bg-orange-900/20"
                              : "bg-[#27AE60]/10"
                          }`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {status === "out" && (
                        <Badge variant="destructive" className="bg-red-500 text-white">
                          Out of Stock
                        </Badge>
                      )}
                      {status === "low" && (
                        <Badge className="bg-orange-500 text-white">
                          Low Stock
                        </Badge>
                      )}
                      {status === "normal" && (
                        <Badge className="bg-[#27AE60] text-white">
                          In Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                      {new Date(item.lastRestocked).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                      {item.nextRestock
                        ? new Date(item.nextRestock).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAdjustStock(item, "add")}
                        >
                          <Plus className="size-4 mr-1" />
                          Add
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAdjustStock(item, "deduct")}
                          disabled={item.stock === 0}
                        >
                          <Minus className="size-4 mr-1" />
                          Deduct
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
