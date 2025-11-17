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
import { Input } from "./ui/input";
import { Search, Plus, Eye, ShoppingCart, UserX } from "lucide-react";
import { useState } from "react";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  lastDelivery: string;
  status: "active" | "inactive";
  totalProducts: number;
  totalOrders: number;
}

interface SupplierManagementProps {
  onAddSupplier: () => void;
  onViewDetails: (supplier: Supplier) => void;
  onCreateOrder: (supplier: Supplier) => void;
  onDeactivateSupplier: (supplier: Supplier) => void;
}

export function SupplierManagement({
  onAddSupplier,
  onViewDetails,
  onCreateOrder,
  onDeactivateSupplier,
}: SupplierManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const suppliers: Supplier[] = [
    {
      id: "1",
      name: "Tech Supplies Inc.",
      contactPerson: "John Santos",
      phone: "+63 917 123 4567",
      email: "john@techsupplies.ph",
      lastDelivery: "2024-11-10",
      status: "active",
      totalProducts: 15,
      totalOrders: 48,
    },
    {
      id: "2",
      name: "Furniture Plus",
      contactPerson: "Maria Cruz",
      phone: "+63 918 234 5678",
      email: "maria@furnitureplus.ph",
      lastDelivery: "2024-11-08",
      status: "active",
      totalProducts: 8,
      totalOrders: 22,
    },
    {
      id: "3",
      name: "Office Depot",
      contactPerson: "Ramon Garcia",
      phone: "+63 919 345 6789",
      email: "ramon@officedepot.ph",
      lastDelivery: "2024-11-05",
      status: "active",
      totalProducts: 12,
      totalOrders: 35,
    },
    {
      id: "4",
      name: "Global Electronics",
      contactPerson: "Lisa Reyes",
      phone: "+63 920 456 7890",
      email: "lisa@globalelec.ph",
      lastDelivery: "2024-10-28",
      status: "inactive",
      totalProducts: 6,
      totalOrders: 15,
    },
  ];

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSuppliers = suppliers.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
            {activeSuppliers} active suppliers
          </p>
        </div>
        <Button
          onClick={onAddSupplier}
          className="bg-[#27AE60] hover:bg-[#229954] text-white w-full sm:w-auto"
        >
          <Plus className="size-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#222B2D]/40 dark:text-white/40" />
        <Input
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Suppliers Table */}
      <div className="border border-[#222B2D]/10 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-[#222B2D]/20">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F6F7F8] dark:bg-[#222B2D]/40">
                <TableHead>Supplier Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Last Delivery</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium text-[#222B2D] dark:text-white">
                    {supplier.name}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {supplier.contactPerson}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {supplier.phone}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {supplier.email}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {new Date(supplier.lastDelivery).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {supplier.totalProducts}
                  </TableCell>
                  <TableCell>
                    {supplier.status === "active" ? (
                      <Badge className="bg-[#27AE60] text-white">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(supplier)}
                      >
                        <Eye className="size-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreateOrder(supplier)}
                        disabled={supplier.status === "inactive"}
                      >
                        <ShoppingCart className="size-4 mr-1" />
                        Order
                      </Button>
                      {supplier.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeactivateSupplier(supplier)}
                        >
                          <UserX className="size-4 mr-1" />
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="p-8 text-center text-[#222B2D]/60 dark:text-white/60">
            No suppliers found
          </div>
        )}
      </div>
    </div>
  );
}
