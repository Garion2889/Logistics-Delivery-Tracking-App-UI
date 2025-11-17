import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Skeleton } from "./ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Truck,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  FileText,
  Download,
  Calendar as CalendarIcon,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "./ui/utils";

// Mock data
const deliveriesOverTime = [
  { date: "Nov 6", total: 45, completed: 38, cancelled: 3, pending: 4 },
  { date: "Nov 7", total: 52, completed: 47, cancelled: 2, pending: 3 },
  { date: "Nov 8", total: 48, completed: 42, cancelled: 4, pending: 2 },
  { date: "Nov 9", total: 61, completed: 56, cancelled: 2, pending: 3 },
  { date: "Nov 10", total: 58, completed: 53, cancelled: 3, pending: 2 },
  { date: "Nov 11", total: 67, completed: 62, cancelled: 2, pending: 3 },
  { date: "Nov 12", total: 72, completed: 65, cancelled: 4, pending: 3 },
];

const paymentBreakdown = [
  { name: "GCash", value: 45, color: "#27AE60" },
  { name: "Credit Card", value: 30, color: "#3498DB" },
  { name: "COD", value: 25, color: "#F39C12" },
];

const areaCoverage = [
  { area: "Makati", deliveries: 125, revenue: 145000 },
  { area: "BGC", deliveries: 98, revenue: 132000 },
  { area: "Quezon City", deliveries: 156, revenue: 178000 },
  { area: "Mandaluyong", deliveries: 87, revenue: 98000 },
  { area: "Pasig", deliveries: 112, revenue: 124000 },
  { area: "Taguig", deliveries: 92, revenue: 105000 },
];

const driverPerformance = [
  { driver: "Pedro Reyes", deliveries: 145, onTime: 92, rating: 4.8 },
  { driver: "Carlos Mendoza", deliveries: 132, onTime: 88, rating: 4.6 },
  { driver: "Luis Ramos", deliveries: 118, onTime: 95, rating: 4.9 },
  { driver: "Miguel Santos", deliveries: 156, onTime: 90, rating: 4.7 },
];

const hourlyActivity = [
  { hour: "6 AM", orders: 12 },
  { hour: "8 AM", orders: 28 },
  { hour: "10 AM", orders: 45 },
  { hour: "12 PM", orders: 62 },
  { hour: "2 PM", orders: 58 },
  { hour: "4 PM", orders: 42 },
  { hour: "6 PM", orders: 35 },
  { hour: "8 PM", orders: 18 },
];

const performanceMetrics = [
  { metric: "Speed", value: 85 },
  { metric: "Accuracy", value: 92 },
  { metric: "Customer Satisfaction", value: 88 },
  { metric: "On-Time Delivery", value: 90 },
  { metric: "Communication", value: 86 },
];

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("week");
  const [selectedDriver, setSelectedDriver] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Calculate KPIs
  const totalDeliveries = deliveriesOverTime.reduce(
    (sum, day) => sum + day.total,
    0
  );
  const completedDeliveries = deliveriesOverTime.reduce(
    (sum, day) => sum + day.completed,
    0
  );
  const onTimeRate = 91.5;
  const totalRevenue = areaCoverage.reduce((sum, area) => sum + area.revenue, 0);
  const driverEfficiency = 88.3;

  const handleExportReport = (format: "pdf" | "csv") => {
    // Mock export functionality
    console.log(`Exporting report in ${format} format...`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#222B2D] dark:text-white mb-2">
            Analytics & Reporting
          </h1>
          <p className="text-[#222B2D]/60 dark:text-white/60">
            Comprehensive insights into logistics performance and business metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleExportReport("csv")} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button onClick={() => handleExportReport("pdf")} className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="mb-2 block text-xs">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
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

            <div className="flex-1">
              <Label className="mb-2 block text-xs">Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  <SelectItem value="pedro">Pedro Reyes</SelectItem>
                  <SelectItem value="carlos">Carlos Mendoza</SelectItem>
                  <SelectItem value="luis">Luis Ramos</SelectItem>
                  <SelectItem value="miguel">Miguel Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label className="mb-2 block text-xs">Region</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="makati">Makati</SelectItem>
                  <SelectItem value="bgc">BGC</SelectItem>
                  <SelectItem value="qc">Quezon City</SelectItem>
                  <SelectItem value="mandaluyong">Mandaluyong</SelectItem>
                  <SelectItem value="pasig">Pasig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="gap-2">
                <Filter className="w-4 h-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Total Deliveries
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {totalDeliveries}
                </h3>
                <p className="text-xs text-[#27AE60] mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12.5%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  On-Time Rate
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {onTimeRate}%
                </h3>
                <p className="text-xs text-[#27AE60] mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +2.3%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#27AE60]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Revenue
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  ₱{(totalRevenue / 1000).toFixed(0)}K
                </h3>
                <p className="text-xs text-[#27AE60] mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +8.7%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#27AE60]/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#27AE60]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Driver Efficiency
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {driverEfficiency}%
                </h3>
                <p className="text-xs text-[#27AE60] mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +1.8%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Truck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Active Drivers
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {driverPerformance.length}
                </h3>
                <p className="text-xs text-[#222B2D]/60 dark:text-white/60 mt-1">
                  All online
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Provider Notice */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-[#222B2D] dark:text-white mb-1">
                Real-time Data Integration
              </h4>
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60 mb-2">
                Analytics powered by Supabase Realtime and PostgreSQL views. Data
                updates automatically as new deliveries are processed.
              </p>
              <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">
                Supabase API • Business Intelligence Dashboard
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="regions">Regions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Deliveries Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Deliveries Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={deliveriesOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stackId="1"
                          stroke="#27AE60"
                          fill="#27AE60"
                          fillOpacity={0.6}
                        />
                        <Area
                          type="monotone"
                          dataKey="pending"
                          stackId="1"
                          stroke="#F39C12"
                          fill="#F39C12"
                          fillOpacity={0.6}
                        />
                        <Area
                          type="monotone"
                          dataKey="cancelled"
                          stackId="1"
                          stroke="#E74C3C"
                          fill="#E74C3C"
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {paymentBreakdown.map((method) => (
                      <div
                        key={method.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: method.color }}
                          ></div>
                          <span className="text-[#222B2D] dark:text-white">
                            {method.name}
                          </span>
                        </div>
                        <span className="text-[#222B2D]/60 dark:text-white/60">
                          {method.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Hourly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="orders" fill="#3498DB" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deliveriesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#3498DB"
                      strokeWidth={2}
                      name="Total Deliveries"
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#27AE60"
                      strokeWidth={2}
                      name="Completed"
                    />
                    <Line
                      type="monotone"
                      dataKey="cancelled"
                      stroke="#E74C3C"
                      strokeWidth={2}
                      name="Cancelled"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={areaCoverage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="area" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#27AE60" name="Revenue (₱)" />
                      <Bar dataKey="deliveries" fill="#3498DB" name="Deliveries" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {areaCoverage.map((area) => (
                    <div
                      key={area.area}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#27AE60]" />
                        <div>
                          <h4 className="text-[#222B2D] dark:text-white">
                            {area.area}
                          </h4>
                          <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                            {area.deliveries} deliveries
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#222B2D] dark:text-white">
                          ₱{area.revenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-[#27AE60]">
                          ₱{(area.revenue / area.deliveries).toFixed(0)} avg
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers">
          <div className="space-y-6">
            {/* Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Driver Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceMetrics}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Performance"
                        dataKey="value"
                        stroke="#27AE60"
                        fill="#27AE60"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Driver Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Driver Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {driverPerformance.map((driver) => (
                    <div
                      key={driver.driver}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#27AE60] flex items-center justify-center">
                            <span className="text-white text-sm">
                              {driver.driver.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-[#222B2D] dark:text-white">
                              {driver.driver}
                            </h4>
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-yellow-500">★</span>
                              <span className="text-[#222B2D] dark:text-white">
                                {driver.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-[#27AE60] text-white">
                          {driver.onTime}% On-Time
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[#222B2D]/60 dark:text-white/60">
                            Total Deliveries
                          </p>
                          <p className="text-[#222B2D] dark:text-white">
                            {driver.deliveries}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#222B2D]/60 dark:text-white/60">
                            Success Rate
                          </p>
                          <p className="text-[#27AE60]">{driver.onTime}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Regions Tab */}
        <TabsContent value="regions">
          <div className="space-y-6">
            {/* Area Coverage Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Area Coverage Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <MapPin className="w-16 h-16 text-[#27AE60] mx-auto" />
                    <div>
                      <h3 className="text-[#222B2D] dark:text-white mb-2">
                        Regional Coverage Map
                      </h3>
                      <p className="text-sm text-[#222B2D]/60 dark:text-white/60 max-w-md">
                        Interactive heatmap showing delivery density and performance
                        across Metro Manila. Powered by Google Maps API.
                      </p>
                    </div>
                    <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      Google Maps API with Heatmap Layer
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regional Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={areaCoverage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="area" type="category" />
                      <Tooltip />
                      <Bar dataKey="deliveries" fill="#27AE60" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Custom Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label className="mb-2 block">Select Fields</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="deliveries">Deliveries Only</SelectItem>
                    <SelectItem value="revenue">Revenue Only</SelectItem>
                    <SelectItem value="drivers">Drivers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Date Range</Label>
                <Select defaultValue="week">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Format</Label>
                <Select defaultValue="pdf">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="gap-2">
                <FileText className="w-4 h-4" />
                Generate Report
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Table Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
