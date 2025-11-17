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
import { ArrowLeft, Mail, Phone, MapPin, Edit, Package } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  status: "active" | "inactive";
  totalProducts: number;
  totalOrders: number;
}

interface SupplierDetailsProps {
  supplier: Supplier;
  onBack: () => void;
  onEdit: () => void;
}

export function SupplierDetails({ supplier, onBack, onEdit }: SupplierDetailsProps) {
  // Mock products data
  const linkedProducts = [
    { id: "1", name: "Smartphone Model X", sku: "ELEC-001", stock: 45 },
    { id: "2", name: "Wireless Mouse", sku: "ELEC-045", stock: 8 },
    { id: "3", name: "Laptop Stand", sku: "ELEC-089", stock: 3 },
  ];

  // Mock order history
  const orderHistory = [
    {
      id: "1",
      orderNo: "PO-2024-001",
      date: "2024-11-10",
      items: 3,
      status: "delivered",
      total: 45000,
    },
    {
      id: "2",
      orderNo: "PO-2024-002",
      date: "2024-11-05",
      items: 2,
      status: "delivered",
      total: 28500,
    },
    {
      id: "3",
      orderNo: "PO-2024-003",
      date: "2024-10-28",
      items: 5,
      status: "pending",
      total: 62000,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Suppliers
          </Button>
          <h2 className="text-[#222B2D] dark:text-white">{supplier.name}</h2>
          <div className="flex items-center gap-2">
            {supplier.status === "active" ? (
              <Badge className="bg-[#27AE60] text-white">Active</Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            )}
          </div>
        </div>
        <Button
          onClick={onEdit}
          className="bg-[#27AE60] hover:bg-[#229954] text-white"
        >
          <Edit className="size-4 mr-2" />
          Edit Supplier
        </Button>
      </div>

      {/* Supplier Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
          <h3 className="text-[#222B2D] dark:text-white mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#27AE60]/10 dark:bg-[#27AE60]/20">
                <Mail className="size-4 text-[#27AE60]" />
              </div>
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">Email</p>
                <p className="text-[#222B2D] dark:text-white">{supplier.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#27AE60]/10 dark:bg-[#27AE60]/20">
                <Phone className="size-4 text-[#27AE60]" />
              </div>
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">Phone</p>
                <p className="text-[#222B2D] dark:text-white">{supplier.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#27AE60]/10 dark:bg-[#27AE60]/20">
                <MapPin className="size-4 text-[#27AE60]" />
              </div>
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">Address</p>
                <p className="text-[#222B2D] dark:text-white">
                  {supplier.address || "No address provided"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
          <h3 className="text-[#222B2D] dark:text-white mb-4">Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#222B2D]/60 dark:text-white/60">Contact Person</span>
              <span className="font-medium text-[#222B2D] dark:text-white">
                {supplier.contactPerson}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#222B2D]/60 dark:text-white/60">Total Products</span>
              <span className="font-medium text-[#222B2D] dark:text-white">
                {supplier.totalProducts}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#222B2D]/60 dark:text-white/60">Total Orders</span>
              <span className="font-medium text-[#222B2D] dark:text-white">
                {supplier.totalOrders}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Linked Products */}
      <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#222B2D] dark:text-white">Linked Products</h3>
          <Badge variant="outline" className="gap-1">
            <Package className="size-3" />
            {linkedProducts.length}
          </Badge>
        </div>
        <div className="border border-[#222B2D]/10 dark:border-white/10 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F6F7F8] dark:bg-[#222B2D]/40">
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-[#222B2D] dark:text-white">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {product.sku}
                  </TableCell>
                  <TableCell className="text-right text-[#222B2D] dark:text-white">
                    {product.stock}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Order History */}
      <Card className="p-6 border-[#222B2D]/10 dark:border-white/10">
        <h3 className="text-[#222B2D] dark:text-white mb-4">Order History</h3>
        <div className="border border-[#222B2D]/10 dark:border-white/10 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F6F7F8] dark:bg-[#222B2D]/40">
                <TableHead>Order No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderHistory.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-[#222B2D] dark:text-white">
                    {order.orderNo}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {new Date(order.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-[#222B2D]/60 dark:text-white/60">
                    {order.items}
                  </TableCell>
                  <TableCell>
                    {order.status === "delivered" ? (
                      <Badge className="bg-[#27AE60] text-white">Delivered</Badge>
                    ) : (
                      <Badge className="bg-orange-500 text-white">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-[#222B2D] dark:text-white">
                    ₱{order.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
