import { useState, useEffect } from "react";

import { supabase } from "../utils/supabase/client"; 
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Skeleton } from "./ui/skeleton";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  TrendingUp,
  Package,
  Truck,
  CheckCircle2,
  Users,
  Download,
  Calendar as CalendarIcon,
  Loader2, // Spinner icon
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

export function AnalyticsDashboard() {
  // --- STATE MANAGEMENT ---
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30), // Default to last 30 days
    to: new Date(),
  });

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false); // Track export button state

  // Data States
  const [kpiStats, setKpiStats] = useState({
    total_deliveries: 0,
    active_deliveries: 0,
    success_rate: 0,
    avg_delivery_time_minutes: 0,
  });
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [driverStats, setDriverStats] = useState<any[]>([]);
  const [areaCoverage, setAreaCoverage] = useState<any[]>([]);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      
      setIsLoading(true);
      const startDate = dateRange.from.toISOString();
      const endDate = dateRange.to.toISOString();

      try {
        console.log("Fetching dashboard data...", { startDate, endDate });

        // 1. Daily Trends (View)
        const { data: trendData, error: trendError } = await supabase
          .from('analytics_daily_stats')
          .select('*')
          .gte('report_date', startDate)
          .lte('report_date', endDate)
          .order('report_date', { ascending: true });

        if (trendError) console.error("Trend Error:", trendError);

        // Format dates for Recharts
        const formattedTrendData = trendData?.map(d => ({
            ...d,
            formatted_date: format(new Date(d.report_date), 'MMM dd')
        })) || [];
        setDailyStats(formattedTrendData);

        // 2. Compute KPI Summary from daily stats
        if (formattedTrendData.length > 0) {
          const totalDeliveries = formattedTrendData.reduce((sum, d) => sum + d.total_deliveries, 0);
          const activeDeliveries = formattedTrendData.reduce((sum, d) => sum + d.active_deliveries, 0);
          const completedDeliveries = formattedTrendData.reduce((sum, d) => sum + d.completed_deliveries, 0);
          const successRate = totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0;
          const avgDeliveryTime = formattedTrendData.reduce((sum, d) => sum + d.avg_delivery_time_minutes, 0) / formattedTrendData.length || 0;

          setKpiStats({
            total_deliveries: totalDeliveries,
            active_deliveries: activeDeliveries,
            success_rate: successRate,
            avg_delivery_time_minutes: Math.round(avgDeliveryTime * 100) / 100, // Round to 2 decimal places
          });
        } else {
          setKpiStats({
            total_deliveries: 0,
            active_deliveries: 0,
            success_rate: 0,
            avg_delivery_time_minutes: 0,
          });
        }

        // 3. Driver Performance (View)
        const { data: driverData, error: driverError } = await supabase
          .from('analytics_driver_performance')
          .select('*')
          .order('completed_deliveries', { ascending: false });
        
        if (driverError) console.error("Driver Error:", driverError);
        setDriverStats(driverData || []);

        // 4. Area Coverage (Mock for demo purposes)
        setAreaCoverage([
          { area: "Quezon City", deliveries: 156},
          { area: "Makati", deliveries: 125},
          { area: "Taguig", deliveries: 98},
          { area: "Pasig", deliveries: 85},
          { area: "Manila", deliveries: 110},
        ]);

      } catch (error) {
        console.error("Unexpected error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // --- EXPORT FUNCTION (DEBUGGED) ---
  const handleExportReport = async (formatType: "csv") => {
    console.log("--> 1. Export Button Clicked");

    // Validation
    if (!dateRange?.from || !dateRange?.to) {
        alert("Please select a valid date range first.");
        return;
    }

    try {
        setIsExporting(true);
        const payload = { 
            startDate: dateRange.from.toISOString(), 
            endDate: dateRange.to.toISOString() 
        };

        console.log("--> 2. Invoking Edge Function 'export-delivery-report' with:", payload);

        const { data, error } = await supabase.functions.invoke('export-delivery-report', {
            body: payload
        });

        // Error Handling
        if (error) {
            console.error("--> X. Function Error:", error);
            alert(`Export Failed: ${error.message || "Check console for details"}`);
            return;
        }

        if (!data) {
            console.error("--> X. No Data Returned");
            alert("Export succeeded but the file was empty.");
            return;
        }

        console.log("--> 3. Data received. Size:", data.size || data.length);
        console.log("--> 4. Triggering Browser Download...");

        // Trigger Download
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `LogiTrack_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log("--> 5. Download Complete");

    } catch (err) {
        console.error("--> X. Unexpected Catch Error:", err);
        alert("An unexpected client-side error occurred.");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#222B2D] dark:text-white mb-2 text-3xl font-bold">
            Analytics & Reporting
          </h1>
          <p className="text-[#222B2D]/60 dark:text-white/60">
            Real-time insights powered by Supabase
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className="w-[260px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd, y")} -{" "}
                      {format(dateRange.to, "MMM dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="dark:bg-gray-800 dark:text-white"
              />
            </PopoverContent>
          </Popover>

          {/* Export Button */}
          <Button 
            variant="outline" 
            onClick={() => handleExportReport("csv")} 
            disabled={isExporting || isLoading}
            className="gap-2 min-w-[140px]"
          >
            {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Download className="w-4 h-4" />
            )}
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
            title="Active Deliveries"
            value={kpiStats.active_deliveries}
            icon={<Truck className="w-5 h-5 text-orange-600" />}
            colorBg="bg-orange-50 dark:bg-orange-900/20"
            loading={isLoading}
        />
        <KpiCard
            title="Success Rate"
            value={`${kpiStats.success_rate}%`}
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
            colorBg="bg-green-50 dark:bg-green-900/20"
            loading={isLoading}
        />
        <KpiCard
            title="Avg Delivery Time"
            value={`${kpiStats.avg_delivery_time_minutes} min`}
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            colorBg="bg-blue-50 dark:bg-blue-900/20"
            loading={isLoading}
        />
      </div>

      {/* --- TABS & CHARTS --- */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Daily Delivery Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : dailyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formatted_date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="completed_deliveries" name="Completed" stackId="1" stroke="#27AE60" fill="#27AE60" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="active_deliveries" name="Active" stackId="1" stroke="#F39C12" fill="#F39C12" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="total_deliveries" name="Total" stackId="1" stroke="#3498DB" fill="#3498DB" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No data available for this date range.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. DRIVERS TAB */}
        <TabsContent value="drivers">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Driver Performance Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
                    <div className="space-y-4">
                    {driverStats.map((driver) => (
                        <div key={driver.driver_id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#27AE60] flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-sm">
                                    {driver.driver_name ? driver.driver_name.charAt(0).toUpperCase() : '?'}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-[#222B2D] dark:text-white font-semibold">
                                    {driver.driver_name || "Unknown Driver"}
                                </h4>
                                <p className="text-xs text-gray-500">
                                    {driver.vehicle_type} • {driver.plate_number}
                                </p>
                            </div>
                            </div>
                            <Badge className={driver.success_rate > 90 ? "bg-green-600" : "bg-yellow-600"}>
                                {driver.success_rate}% Success
                            </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center md:text-left">
                            <p className="text-[#222B2D]/60 dark:text-white/60 text-xs uppercase font-bold">Assigned</p>
                            <p className="font-mono font-semibold text-lg">{driver.total_deliveries}</p>
                            </div>
                            <div className="text-center md:text-left">
                            <p className="text-[#222B2D]/60 dark:text-white/60 text-xs uppercase font-bold">Delivered</p>
                            <p className="font-mono font-semibold text-lg text-green-600">{driver.completed_deliveries}</p>
                            </div>
                            <div className="text-center md:text-left">
                            <p className="text-[#222B2D]/60 dark:text-white/60 text-xs uppercase font-bold">Avg Time</p>
                            <p className="font-mono font-semibold text-lg">{driver.avg_delivery_time_minutes?.toFixed(1) || 0} min</p>
                            </div>
                        </div>
                        </div>
                    ))}
                    {driverStats.length === 0 && <p className="text-center text-gray-500">No active drivers found for this period.</p>}
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. REGIONS TAB */}
        <TabsContent value="regions">
          <Card>
            <CardHeader>
              <CardTitle>Regional Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaCoverage} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="area" type="category" width={100} />
                    <Tooltip 
                        formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#27AE60" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Component for KPI Cards
function KpiCard({ title, value, icon, colorBg, loading }: any) {
    return (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#222B2D]/60 dark:text-white/60">{title}</p>
                {loading ? (
                    <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                    <h3 className="text-[#222B2D] dark:text-white mt-1 text-2xl font-bold tracking-tight">{value}</h3>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl ${colorBg} flex items-center justify-center transition-transform hover:scale-105`}>
                {icon}
              </div>
            </div>
          </CardContent>
        </Card>
    );
}