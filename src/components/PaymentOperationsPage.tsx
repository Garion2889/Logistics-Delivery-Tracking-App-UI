import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Smartphone,
  Banknote,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Transaction {
  id: string;
  transactionId: string;
  orderRef: string;
  customer: string;
  paymentMethod: "GCash" | "Credit Card" | "COD";
  amount: number;
  status: "paid" | "pending" | "refunded" | "failed";
  date: string;
  time: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    transactionId: "TXN-2025-001234",
    orderRef: "REF-001",
    customer: "Maria Santos",
    paymentMethod: "GCash",
    amount: 2500,
    status: "paid",
    date: "Nov 12, 2025",
    time: "9:15 AM",
  },
  {
    id: "2",
    transactionId: "TXN-2025-001235",
    orderRef: "REF-002",
    customer: "Juan Dela Cruz",
    paymentMethod: "Credit Card",
    amount: 3200,
    status: "paid",
    date: "Nov 12, 2025",
    time: "10:30 AM",
  },
  {
    id: "3",
    transactionId: "TXN-2025-001236",
    orderRef: "REF-003",
    customer: "Ana Mercado",
    paymentMethod: "COD",
    amount: 1800,
    status: "pending",
    date: "Nov 12, 2025",
    time: "11:00 AM",
  },
  {
    id: "4",
    transactionId: "TXN-2025-001237",
    orderRef: "REF-004",
    customer: "Jose Garcia",
    paymentMethod: "GCash",
    amount: 4500,
    status: "refunded",
    date: "Nov 11, 2025",
    time: "3:45 PM",
  },
  {
    id: "5",
    transactionId: "TXN-2025-001238",
    orderRef: "REF-005",
    customer: "Rosa Torres",
    paymentMethod: "Credit Card",
    amount: 2900,
    status: "paid",
    date: "Nov 12, 2025",
    time: "2:20 PM",
  },
  {
    id: "6",
    transactionId: "TXN-2025-001239",
    orderRef: "REF-006",
    customer: "Carlos Reyes",
    paymentMethod: "COD",
    amount: 3500,
    status: "paid",
    date: "Nov 12, 2025",
    time: "1:10 PM",
  },
];

const revenueData = [
  { date: "Nov 6", revenue: 45000 },
  { date: "Nov 7", revenue: 52000 },
  { date: "Nov 8", revenue: 48000 },
  { date: "Nov 9", revenue: 61000 },
  { date: "Nov 10", revenue: 58000 },
  { date: "Nov 11", revenue: 67000 },
  { date: "Nov 12", revenue: 72000 },
];

const paymentMethodData = [
  { name: "GCash", value: 45, color: "#27AE60" },
  { name: "Credit Card", value: 30, color: "#3498DB" },
  { name: "COD", value: 25, color: "#F39C12" },
];

export function PaymentOperationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [refundModal, setRefundModal] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({ open: false, transaction: null });
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  // Calculate KPIs
  const totalRevenue = mockTransactions
    .filter((t) => t.status === "paid")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPayments = mockTransactions
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const completedTransactions = mockTransactions.filter(
    (t) => t.status === "paid"
  ).length;

  const totalRefunds = mockTransactions
    .filter((t) => t.status === "refunded")
    .reduce((sum, t) => sum + t.amount, 0);

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "paid":
        return "bg-[#27AE60] text-white";
      case "pending":
        return "bg-yellow-600 text-white";
      case "refunded":
        return "bg-blue-600 text-white";
      case "failed":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getPaymentMethodIcon = (method: Transaction["paymentMethod"]) => {
    switch (method) {
      case "GCash":
        return <Smartphone className="w-4 h-4" />;
      case "Credit Card":
        return <CreditCard className="w-4 h-4" />;
      case "COD":
        return <Banknote className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const filteredTransactions = mockTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || transaction.status === filterStatus;
    const matchesMethod =
      filterMethod === "all" || transaction.paymentMethod === filterMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const handleRefund = () => {
    if (refundModal.transaction) {
      // In production, this would call PayMongo API
      console.log("Processing refund:", {
        transaction: refundModal.transaction,
        reason: refundReason,
        amount: refundAmount,
      });
      setRefundModal({ open: false, transaction: null });
      setRefundReason("");
      setRefundAmount("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#222B2D] dark:text-white mb-2">
            Payment & Financial Operations
          </h1>
          <p className="text-[#222B2D]/60 dark:text-white/60">
            Manage payments, refunds, and financial reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button className="gap-2">
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Total Revenue
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  ₱{totalRevenue.toLocaleString()}
                </h3>
                <p className="text-xs text-[#27AE60] mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12.5% this week
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#27AE60]/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#27AE60]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Pending Payments
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  ₱{pendingPayments.toLocaleString()}
                </h3>
                <p className="text-xs text-[#222B2D]/60 dark:text-white/60 mt-1">
                  {mockTransactions.filter((t) => t.status === "pending").length}{" "}
                  orders
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Completed Transactions
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  {completedTransactions}
                </h3>
                <p className="text-xs text-[#27AE60] mt-1">Today</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#27AE60]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                  Total Refunds
                </p>
                <h3 className="text-[#222B2D] dark:text-white mt-1">
                  ₱{totalRefunds.toLocaleString()}
                </h3>
                <p className="text-xs text-red-600 mt-1">
                  {mockTransactions.filter((t) => t.status === "refunded").length}{" "}
                  refunds
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PayMongo Integration Notice */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-[#222B2D] dark:text-white mb-1">
                PayMongo Payment Integration
              </h4>
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60 mb-2">
                Integrated payment gateway supporting GCash, Credit/Debit Cards,
                and Cash on Delivery. Configure API keys in Settings.
              </p>
              <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">
                API Key: pk_test_YOUR_PAYMONGO_KEY
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Financial Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Transactions</span>
                <Badge variant="outline">{filteredTransactions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#222B2D]/40 dark:text-white/40" />
                  <Input
                    placeholder="Search by Transaction ID, Order Ref, or Customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterMethod} onValueChange={setFilterMethod}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="GCash">GCash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="COD">COD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transactions Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Order Ref</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {transaction.transactionId}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-[#222B2D] dark:text-white">
                            {transaction.orderRef}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[#222B2D] dark:text-white">
                            {transaction.customer}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                            <span className="text-[#222B2D] dark:text-white text-sm">
                              {transaction.paymentMethod}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[#222B2D] dark:text-white">
                            ₱{transaction.amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-[#222B2D] dark:text-white">
                              {transaction.date}
                            </p>
                            <p className="text-[#222B2D]/60 dark:text-white/60 text-xs">
                              {transaction.time}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                              {transaction.status === "paid" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setRefundModal({
                                      open: true,
                                      transaction,
                                    })
                                  }
                                  className="text-red-600"
                                >
                                  Process Refund
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#27AE60"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Method Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {paymentMethodData.map((method) => (
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

              {/* Daily Income */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#27AE60" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custom Report Generator */}
              <div className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                <h3 className="text-[#222B2D] dark:text-white mb-4">
                  Custom Report Generator
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="mb-2 block">Report Type</Label>
                    <Select defaultValue="revenue">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Revenue Report</SelectItem>
                        <SelectItem value="transactions">
                          Transaction Report
                        </SelectItem>
                        <SelectItem value="refunds">Refunds Report</SelectItem>
                        <SelectItem value="payment-methods">
                          Payment Methods Report
                        </SelectItem>
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
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
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
                    Export to PDF
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export to CSV
                  </Button>
                </div>
              </div>

              {/* Pre-generated Reports */}
              <div>
                <h3 className="text-[#222B2D] dark:text-white mb-4">
                  Recent Reports
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      name: "Weekly Revenue Report",
                      date: "Nov 6-12, 2025",
                      size: "245 KB",
                    },
                    {
                      name: "Monthly Transaction Summary",
                      date: "October 2025",
                      size: "1.2 MB",
                    },
                    {
                      name: "Payment Methods Analysis",
                      date: "Q3 2025",
                      size: "512 KB",
                    },
                  ].map((report, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#27AE60] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-[#222B2D] dark:text-white">
                            {report.name}
                          </h4>
                          <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                            {report.date} • {report.size}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Modal */}
      {refundModal.open && refundModal.transaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Process Refund</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#222B2D]/60 dark:text-white/60">
                      Transaction ID:
                    </span>
                    <code className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded">
                      {refundModal.transaction.transactionId}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#222B2D]/60 dark:text-white/60">
                      Customer:
                    </span>
                    <span className="text-[#222B2D] dark:text-white">
                      {refundModal.transaction.customer}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#222B2D]/60 dark:text-white/60">
                      Original Amount:
                    </span>
                    <span className="text-[#222B2D] dark:text-white">
                      ₱{refundModal.transaction.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Refund Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter refund amount"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={refundModal.transaction.amount}
                />
              </div>

              <div>
                <Label className="mb-2 block">Refund Reason</Label>
                <Textarea
                  placeholder="Enter the reason for refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  ⚠️ This action will process a refund through PayMongo API.
                  Refunds typically take 5-10 business days to reflect.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRefundModal({ open: false, transaction: null });
                    setRefundReason("");
                    setRefundAmount("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRefund}
                  variant="destructive"
                  className="flex-1"
                  disabled={!refundAmount || !refundReason}
                >
                  Confirm Refund
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
