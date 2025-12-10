import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  UserPlus,
  Search,
  Filter,
} from "lucide-react";

interface Delivery {
  id: string;
  refNo: string;
  customer: string;
  address: string;
  status: "pending" | "assigned" | "in-transit" | "delivered" | "returned";
  driver?: string;
  createdAt: string;
}

interface DeliveryManagementProps {
  deliveries: Delivery[];
  onViewDelivery: (delivery: Delivery) => void;
  onAssignDriver: (delivery: Delivery) => void;
  onUpdateDelivery: (delivery: Delivery) => void;
  onMarkComplete: (delivery: Delivery) => void;
}

export function DeliveryManagement({
  deliveries,
  onViewDelivery,
  onAssignDriver,
}: DeliveryManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getStatusBadge = (status: Delivery["status"]) => {
    const variants: Record<Delivery["status"], { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-orange-100 text-orange-700" },
      assigned: { label: "Assigned", className: "bg-blue-100 text-blue-700" },
      "in-transit": { label: "In Transit", className: "bg-purple-100 text-purple-700" },
      delivered: { label: "Delivered", className: "bg-green-100 text-green-700" },
      returned: { label: "Returned", className: "bg-red-100 text-red-700" },
    };
    const variant = variants[status] || variants.pending; // Fallback to pending
    return (
      <Badge className={variant.className} variant="outline">
        {variant.label}
      </Badge>
    );
  };

  // --- FIXED SEARCH LOGIC ---
  const filteredDeliveries = deliveries.filter((delivery) => {
    const query = searchTerm.toLowerCase();
    
    // 1. Safe Search: Handle null/undefined values gracefully
    const matchesSearch =
      (delivery.refNo?.toLowerCase() || "").includes(query) ||
      (delivery.customer?.toLowerCase() || "").includes(query) ||
      (delivery.address?.toLowerCase() || "").includes(query);

    // 2. Status Filter
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[#222B2D] dark:text-white mb-2">Delivery Management</h1>
        <p className="text-[#222B2D]/60 dark:text-white/60">
          Manage and track all deliveries
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by Ref No., Customer, or Address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <Card className="border-0 shadow-sm hidden md:block">
        <CardHeader>
          <CardTitle>All Deliveries ({filteredDeliveries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                      No deliveries found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">{delivery.refNo}</TableCell>
                      <TableCell>{delivery.customer}</TableCell>
                      <TableCell className="max-w-xs truncate" title={delivery.address}>
                        {delivery.address}
                      </TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell>
                        {delivery.driver || (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewDelivery(delivery)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!delivery.driver && delivery.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onAssignDriver(delivery)}
                              title="Assign Driver"
                              className="text-[#27AE60] hover:text-[#219150] hover:bg-green-50"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredDeliveries.length === 0 ? (
           <div className="text-center py-8 text-gray-500">No deliveries found.</div>
        ) : (
          filteredDeliveries.map((delivery) => (
            <Card key={delivery.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[#222B2D] dark:text-white">
                      {delivery.refNo}
                    </p>
                    <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                      {delivery.customer}
                    </p>
                  </div>
                  {getStatusBadge(delivery.status)}
                </div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  {delivery.address}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Driver:</span>
                  {delivery.driver ? (
                    <span className="text-sm text-[#222B2D] dark:text-white">
                      {delivery.driver}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Unassigned</span>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDelivery(delivery)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  {!delivery.driver && delivery.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAssignDriver(delivery)}
                      className="flex-1 text-[#27AE60] border-green-200 hover:bg-green-50"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}