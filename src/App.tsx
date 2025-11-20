import { useState } from "react";
import { LoginPageWithAuth } from "./components/LoginPage";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./components/AdminDashboard";
import { DeliveryManagement } from "./components/DeliveryManagement";
import { DeliveryDetail } from "./components/DeliveryDetail";
import { DriverManagement } from "./components/DriverManagement";
import { DriverDashboard } from "./components/DriverDashboard";
import { PublicTracking } from "./components/PublicTracking";
import { ReturnsPage } from "./components/ReturnsPage";
import { SettingsPage } from "./components/SettingsPage";
import { AssignDriverModal } from "./components/AssignDriverModal";
import { CreateDriverModal } from "./components/CreateDriverModal";
import { UpdateDeliveryModal } from "./components/UpdateDeliveryModal";
import { EditDriverModal } from "./components/EditDriverModal";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { RealTimeTrackingPage } from "./components/RealTimeTrackingPage";
import { RouteOptimizationPage } from "./components/RouteOptimizationPage";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import "./styles/globals.css";

// ------------------ Types ------------------

interface Delivery {
  id: string;
  refNo: string;
  customer: string;
  address: string;
  status: "pending" | "assigned" | "in-transit" | "delivered" | "returned";
  driver?: string;
  createdAt: string;
  phone?: string;
  amount?: number;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  status: "online" | "offline";
  location?: { lat: number; lng: number };
  activeDeliveries: number;
}

// ------------------ App Component ------------------

export default function App() {
  const [currentView, setCurrentView] = useState<"login" | "admin" | "driver" | "tracking">("login");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Modals
  const [assignDriverModal, setAssignDriverModal] = useState<{ open: boolean; delivery: Delivery | null }>({ open: false, delivery: null });
  const [createDriverModal, setCreateDriverModal] = useState(false);
  const [updateDeliveryModal, setUpdateDeliveryModal] = useState<{ open: boolean; delivery: Delivery | null }>({ open: false, delivery: null });
  const [editDriverModal, setEditDriverModal] = useState<{ open: boolean; driver: Driver | null }>({ open: false, driver: null });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // ---------- Stats ----------
  const dashboardStats = {
    pendingOrders: deliveries.filter(d => d.status === "pending").length,
    activeDeliveries: deliveries.filter(d => d.status === "in-transit").length,
    completedDeliveries: deliveries.filter(d => d.status === "delivered").length,
    returns: deliveries.filter(d => d.status === "returned").length,
    revenueChange: 12.5,
    successRate: 94,
  };

  const driverStats = {
    total: deliveries.filter(d => d.driver === userEmail && (d.status === "assigned" || d.status === "in-transit")).length,
    completed: deliveries.filter(d => d.driver === userEmail && d.status === "delivered").length,
    returned: deliveries.filter(d => d.driver === userEmail && d.status === "returned").length,
  };

  // ---------- Handlers ----------
  const handleLogin = (role: "admin" | "driver", email: string) => {
    setUserEmail(email);
    setCurrentView(role);
    toast.success(`Welcome back! Logged in as ${role}`);
  };

  const handleLogout = () => {
    setCurrentView("login");
    setCurrentPage("dashboard");
    setSelectedDelivery(null);
    setUserEmail("");
    toast.info("Logged out successfully");
  };

  const handleUpdateDeliveryStatus = (deliveryId: string, status: Delivery["status"]) => {
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status } : d));
    toast.success("Delivery status updated");
  };

  const handleUploadPOD = (deliveryId: string) => toast.success("Proof of delivery uploaded successfully");

  // Deliveries assigned to current driver
  const driverDeliveries = deliveries.filter(d => d.driver === userEmail && (d.status === "assigned" || d.status === "in-transit"));

  // ---------- Render ----------
  if (currentView === "login")
    return <><LoginPageWithAuth onLogin={handleLogin} onNavigateToTracking={() => setCurrentView("tracking")} /><Toaster /></>;

  if (currentView === "tracking")
    return <><PublicTracking onNavigateToLogin={() => setCurrentView("login")} /><Toaster /></>;

  if (currentView === "driver")
    return <DriverDashboard
      deliveries={driverDeliveries}
      onUpdateStatus={handleUpdateDeliveryStatus}
      onUploadPOD={handleUploadPOD}
      onLogout={handleLogout}
      isDarkMode={isDarkMode}
      onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      driverName={drivers.find(d => d.email === userEmail)?.name || "Driver"}
      stats={driverStats}
    />;

  // ---------- Admin View ----------
  return (
    <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} userEmail={userEmail}>
      {selectedDelivery ? <DeliveryDetail delivery={selectedDelivery} onClose={() => setSelectedDelivery(null)} /> :
        currentPage === "dashboard" ? <AdminDashboard stats={dashboardStats} /> :
          currentPage === "deliveries" ? <DeliveryManagement deliveries={deliveries} onViewDelivery={setSelectedDelivery} /> :
            currentPage === "drivers" ? <DriverManagement drivers={drivers} /> :
              currentPage === "returns" ? <ReturnsPage /> :
                currentPage === "settings" ? <SettingsPage /> :
                  currentPage === "tracking" ? <RealTimeTrackingPage /> :
                    currentPage === "routes" ? <RouteOptimizationPage /> :
                      currentPage === "analytics" ? <AnalyticsDashboard /> : null}
    </AdminLayout>
  );
}
