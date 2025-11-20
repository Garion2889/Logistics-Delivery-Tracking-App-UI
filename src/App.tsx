import { useState, useEffect } from "react";
import { LoginPageWithAuth } from "./components/LoginPageWithAuth";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./components/AdminDashboard";
import { DeliveryManagement } from "./components/DeliveryManagement";
import { DeliveryDetail } from "./components/DeliveryDetail";
import { DriverManagement } from "./components/DriverManagement";
import { DriverDashboard } from "./components/DriverDashboard";
import { PublicTracking } from "./components/PublicTracking";
import { ReturnsPage } from "./components/ReturnsPage";
import { SettingsPage } from "./components/SettingsPage";
import { RealTimeTrackingPage } from "./components/RealTimeTrackingPage";
import { RouteOptimizationPage } from "./components/RouteOptimizationPage";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import 'leaflet/dist/leaflet.css';

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
  const [userId, setUserId] = useState(""); // Store admin/driver ID
  const [userRole, setUserRole] = useState<"admin" | "driver" | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // ---------- Load session from localStorage ----------
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as "admin" | "driver" | null;
    const storedId = localStorage.getItem("userId");
    const storedPage = localStorage.getItem("currentPage");
    const storedDarkMode = localStorage.getItem("isDarkMode");

    if (storedRole && storedId) {
      setUserRole(storedRole);
      setUserId(storedId);
      setCurrentView(storedRole);
    }

    if (storedPage) setCurrentPage(storedPage);
    if (storedDarkMode) setIsDarkMode(storedDarkMode === "true");
  }, []);

  // ---------- Handlers ----------

  const handleLogin = (token: string, role: "admin" | "driver", id: string) => {
    setUserId(id);
    setUserRole(role);
    setCurrentView(role);

    // Persist session
    localStorage.setItem("userId", id);
    localStorage.setItem("userRole", role);

    toast.success(`Welcome back! Logged in as ${role}`);
  };

  const handleLogout = () => {
    setCurrentView("login");
    setCurrentPage("dashboard");
    setSelectedDelivery(null);
    setUserId("");
    setUserRole(null);
    setIsDarkMode(false);

    // Clear session
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentPage");
    localStorage.removeItem("isDarkMode");

    toast.info("Logged out successfully");
  };

  const handleUpdateDeliveryStatus = (deliveryId: string, status: Delivery["status"]) => {
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status } : d));
    toast.success("Delivery status updated");
  };

  const handleUploadPOD = (deliveryId: string) => toast.success("Proof of delivery uploaded successfully");

  const driverDeliveries = deliveries.filter(d => d.driver === userId && (d.status === "assigned" || d.status === "in-transit"));

  // Persist current page and dark mode whenever they change
  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("isDarkMode", isDarkMode.toString());
  }, [isDarkMode]);

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
    total: deliveries.filter(d => d.driver === userId && (d.status === "assigned" || d.status === "in-transit")).length,
    completed: deliveries.filter(d => d.driver === userId && d.status === "delivered").length,
    returned: deliveries.filter(d => d.driver === userId && d.status === "returned").length,
  };

  // ---------- Render ----------

  switch (currentView) {
    case "login":
      return (
        <>
          <LoginPageWithAuth onLogin={handleLogin} onShowTracking={() => setCurrentView("tracking")} />
          <Toaster />
        </>
      );

    case "tracking":
      return <PublicTracking onNavigateToLogin={() => setCurrentView("login")} />;

    case "driver":
      return (
        <DriverDashboard
          deliveries={driverDeliveries}
          onUpdateStatus={handleUpdateDeliveryStatus}
          onUploadPOD={handleUploadPOD}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          driverName={drivers.find(d => d.id === userId)?.name || "Driver"}
          stats={driverStats}
        />
      );

    case "admin":
      return (
        <AdminLayout
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          userEmail={userId}
        >
          {selectedDelivery ? (
            <DeliveryDetail delivery={selectedDelivery} onClose={() => setSelectedDelivery(null)} />
          ) : currentPage === "dashboard" ? (
            <AdminDashboard stats={dashboardStats} />
          ) : currentPage === "deliveries" ? (
            <DeliveryManagement deliveries={deliveries} onViewDelivery={setSelectedDelivery} />
          ) : currentPage === "drivers" ? (
            <DriverManagement drivers={drivers} />
          ) : currentPage === "returns" ? (
            <ReturnsPage />
          ) : currentPage === "settings" ? (
            <SettingsPage />
          ) : currentPage === "tracking" ? (
            <RealTimeTrackingPage />
          ) : currentPage === "routes" ? (
            <RouteOptimizationPage />
          ) : currentPage === "analytics" ? (
            <AnalyticsDashboard />
          ) : null}
        </AdminLayout>
      );

    default:
      return null;
  }
}
