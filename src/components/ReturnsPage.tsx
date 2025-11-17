import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { PackageX, Calendar, User } from "lucide-react";

export function ReturnsPage() {
  // Example return data for placeholder
  const exampleReturns = [
    {
      id: "1",
      refNo: "REF-004",
      customer: "Jose Garcia",
      driver: "Carlos Mendoza",
      reason: "Customer refused package",
      date: "Nov 10, 2025",
      status: "Processing",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[#222B2D] dark:text-white mb-2">Returns Management</h1>
        <p className="text-[#222B2D]/60 dark:text-white/60">
          Track and manage returned deliveries
        </p>
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
                <p className="text-3xl text-[#222B2D] dark:text-white mt-1">
                  0
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
                  Processing
                </p>
                <p className="text-3xl text-[#222B2D] dark:text-white mt-1">
                  0
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
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
                <p className="text-3xl text-[#222B2D] dark:text-white mt-1">
                  0
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <PackageX className="w-6 h-6 text-[#27AE60]" />
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
          {/* Empty State */}
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <PackageX className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg text-[#222B2D] dark:text-white mb-2">
              No active return requests yet
            </h3>
            <p className="text-sm text-[#222B2D]/60 dark:text-white/60 max-w-md mx-auto">
              When deliveries are marked as returned, they will appear here for processing.
            </p>
          </div>

          {/* Example Table (Hidden by default) */}
          {false && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exampleReturns.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.refNo}</TableCell>
                    <TableCell>{item.customer}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {item.driver}
                      </div>
                    </TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <Badge className="bg-orange-100 text-orange-700" variant="outline">
                        {item.status}
                      </Badge>
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
