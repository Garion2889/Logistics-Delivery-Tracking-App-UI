import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  PackageX, 
  User, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client"; // Use your shared client

interface ReturnItem {
  id: string;
  ref_no: string;
  customer_name: string;
  updated_at: string;
  status: string;
  notes: string | null;
  driver: {
    name: string;
  } | null;
}

export function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    resolved: 0
  });

  const fetchReturns = async () => {
    setLoading(true);
    try {
      // Fetch deliveries that are marked as returned
      const { data, error } = await supabase
        .from("deliveries")
        .select(`
          id, 
          ref_no, 
          customer_name, 
          updated_at, 
          status, 
          notes,
          driver:drivers ( name )
        `)
        .eq("status", "returned")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData = data as unknown as ReturnItem[];
        setReturns(formattedData);

        // Stats Logic:
        // 'returned' = Processing (Item is back, need to refund customer)
        // 'cancelled' or 'refunded' = Resolved
        setStats({
          total: formattedData.length,
          processing: formattedData.length,
          resolved: 0 // You can adjust this if you fetch 'refunded' items too
        });
      }
    } catch (err: any) {
      console.error("Error fetching returns:", err);
      toast.error("Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleResolveReturn = async (id: string) => {
    // Logic: Mark as "Cancelled" or "Refunded" to close the ticket.
    // Note: Inventory was ALREADY updated by the Trigger when status became 'returned'.
    try {
      const { error } = await supabase
        .from("deliveries")
        .update({ status: "cancelled", notes: "Refund Processed / Resolved" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Return marked as resolved");
      fetchReturns(); // Refresh list
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6 p-6 bg-[#F6F7F8] dark:bg-[#222B2D] min-h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#222B2D] dark:text-white mb-2">
            Returns Management
          </h1>
          <p className="text-[#222B2D]/60 dark:text-white/60">
            Review items returned to warehouse
          </p>
        </div>
        <Button onClick={fetchReturns} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Total Returns
                </p>
                <p className="text-3xl font-bold text-[#222B2D] dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <PackageX className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Pending Refund
                </p>
                <p className="text-3xl font-bold text-[#222B2D] dark:text-white mt-1">
                  {stats.processing}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Resolved
                </p>
                <p className="text-3xl font-bold text-[#222B2D] dark:text-white mt-1">
                  {stats.resolved}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#27AE60]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Returns Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading data...</div>
          ) : returns.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <PackageX className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg text-[#222B2D] dark:text-white mb-2">
                No active return requests
              </h3>
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60 max-w-md mx-auto">
                When drivers mark a delivery as "Returned", it will appear here.
              </p>
            </div>
          ) : (
            /* Real Data Table */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Reason (Notes)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.ref_no}</TableCell>
                    <TableCell>{item.customer_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {item.driver?.name || "Unassigned"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="italic text-gray-500">
                        {item.notes ? item.notes.replace("RETURNED: ", "") : "No reason"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.updated_at ? format(new Date(item.updated_at), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 shadow-none">
                        RETURNED
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolveReturn(item.id)}
                      >
                        Resolve / Refund
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}