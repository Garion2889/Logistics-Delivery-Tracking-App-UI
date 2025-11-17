import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { BarChart3, Download, FileText, Calendar, TrendingUp } from "lucide-react";

export function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#222B2D] dark:text-white mb-2">Reports & Analytics</h1>
          <p className="text-[#222B2D]/60 dark:text-white/60">
            Generate insights and export data
          </p>
        </div>
        <Button className="bg-[#27AE60] hover:bg-[#229954] text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Report Generator */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Report Type
              </label>
              <Select defaultValue="deliveries">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deliveries">Deliveries Summary</SelectItem>
                  <SelectItem value="drivers">Driver Performance</SelectItem>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                  <SelectItem value="returns">Returns Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Time Period
              </label>
              <Select defaultValue="week">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Format
              </label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full md:w-auto bg-[#27AE60] hover:bg-[#229954] text-white">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Today's Deliveries
                </p>
                <p className="text-3xl text-[#222B2D] dark:text-white mt-1">
                  0
                </p>
                <p className="text-xs text-[#27AE60] mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +0% from yesterday
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Active Drivers
                </p>
                <p className="text-3xl text-[#222B2D] dark:text-white mt-1">
                  0
                </p>
                <p className="text-xs text-[#222B2D]/40 dark:text-white/40 mt-1">
                  Out of 0 total
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#27AE60]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Success Rate
                </p>
                <p className="text-3xl text-[#222B2D] dark:text-white mt-1">
                  0%
                </p>
                <p className="text-xs text-[#222B2D]/40 dark:text-white/40 mt-1">
                  Last 30 days
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg text-[#222B2D] dark:text-white mb-2">
              No Data Available
            </h3>
            <p className="text-sm text-[#222B2D]/60 dark:text-white/60 max-w-md mx-auto">
              Charts and analytics will appear here once you have delivery data.
              Track deliveries, driver performance, and revenue trends over time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
              No reports generated yet
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
