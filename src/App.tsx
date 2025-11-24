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
import { CreateDriverModal } from "./components/CreateDriverModal";
import { EditDriverModal } from "./components/EditDriverModal";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { trackDelivery } from "./lib/supabase";
import 'leaflet/dist/leaflet.css';
import { fetchAllDrivers } from "./lib/supabase";
import { supabase } from "./lib/supabase";

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
  timeline?: {
    status: string;
    label: string;
    date?: string;
    completed: boolean;
  }[];
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
  
  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: "1",
      refNo: "REF-001",
      customer: "John Doe",
      address: "123 Main St, Manila",
      status: "delivered",
      driver: "Driver 1",
      createdAt: "2023-10-01 10:00 AM",
      phone: "09123456789",
      amount: 500,
    },
    {
      id: "2",
      refNo: "REF-002",
      customer: "Jane Smith",
      address: "456 Elm St, Quezon City",
      status: "in-transit",
      driver: "Driver 2",
      createdAt: "2023-10-02 11:00 AM",
      phone: "09876543210",
      amount: 750,
    },
    {
      id: "3",
      refNo: "REF-003",
      customer: "Bob Johnson",
      address: "789 Oak St, Makati",
      status: "pending",
      createdAt: "2023-10-03 12:00 PM",
      phone: "09112233445",
      amount: 300,
    },
  ]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [createDriverModal, setCreateDriverModal] = useState(false);
  const [editDriverModal, setEditDriverModal] = useState<{
    open: boolean;
    driver: Driver | null;
  }>({ open: false, driver: null });

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

  const handleCreateDriver = async (driverData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicle: string;
    }): Promise<void> => {
    try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-driver`;
    console.log("Calling Edge Function:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // send anon key as Bearer, function expects Authorization
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        full_name: driverData.name,
        email: driverData.email,
        password: driverData.password,
        phone: driverData.phone,
        vehicle_type: driverData.vehicle.toLowerCase(), // "motorcycle" | "car" | "van" | "truck"
      }),
    });

    console.log("Edge function raw status:", res.status);
    const data = await res.json().catch(() => null);
    console.log("Edge function response body:", data);

    if (!res.ok || !data || data.error) {
      const message =
        data?.error ||
        data?.dbError ||
        data?.details ||
        `HTTP ${res.status}`;
      throw new Error(message);
    }

    // Map response into your Driver type
    const newDriver: Driver = {
      id: data.driver.id,
      name: data.user.full_name,
      email: data.user.email,
      phone: data.user.phone,
      vehicle: data.driver.vehicle_type,
      status: data.driver.status ?? "offline",
      activeDeliveries: 0,
    };

    setDrivers((prev) => [newDriver, ...prev]);
    toast.success(`Driver ${driverData.name} created successfully`);
  } catch (err: any) {
    console.error("handleCreateDriver exception:", err);
    toast.error(`Failed to create driver: ${err.message ?? "Unknown error"}`);
  }
  };


  const handleEditDriver = async (
    driver: Driver,
    updatedFields: any
  ): Promise<void> => {
    // For now, just forward to handleUpdateDriver
    handleUpdateDriver(driver.id, updatedFields);
  };

  const handleUpdateDriver = (driverId: string, updates: Partial<Driver>) => {
  setDrivers(prev =>
    prev.map(d => (d.id === driverId ? { ...d, ...updates } : d))  // fixed spread
  );
  toast.success("Driver updated successfully");
  };


  const handleDeactivateDriver = async (driver: Driver) => {
  try {
    const { error } = await supabase
      .from("drivers")
      .update({ is_active: false, status: "offline" })
      .eq("id", driver.id);

    if (error) throw error;

    // refresh
    setDrivers(await fetchAllDrivers());

    toast.warning(`Driver ${driver.name} deactivated`);
  } catch (err: any) {
    toast.error(err.message);
  }
  };


  const driverDeliveries = deliveries.filter(d => d.driver === userId && (d.status === "assigned" || d.status === "in-transit"));

  // Map database status to UI status
  const mapStatus = (dbStatus: string): Delivery["status"] => {
    const mapping: Record<string, Delivery["status"]> = {
      'created': 'pending',
      'assigned': 'assigned',
      'picked_up': 'assigned',
      'in_transit': 'in-transit',
      'delivered': 'delivered',
      'returned': 'returned',
      'cancelled': 'returned',
    };
    return mapping[dbStatus] || 'pending';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'created': 'Order Created',
      'assigned': 'Driver Assigned',
      'picked_up': 'Package Picked Up',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'returned': 'Returned',
      'cancelled': 'Cancelled',
    };
    return labels[status] || status;
  };

  // Handle track delivery with Supabase
  const handleTrackDelivery = async (refNo: string) => {
    try {
      const data = await trackDelivery(refNo);

      // Transform to UI format
      return {
        refNo: data.ref_no,
        customer: data.customer_name,
        address: data.address,
        status: mapStatus(data.status),
        driver: data.driver?.name,
        timeline: (data.history || []).map((h: any) => ({
          status: mapStatus(h.status),
          label: getStatusLabel(h.status),
          completed: true,
          date: new Date(h.created_at).toLocaleString(),
        })),
      };
    } catch (error: any) {
      return null;
    }
  };

  // Persist current page and dark mode whenever they change
  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("isDarkMode", isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
  if (userRole === "admin") {
    fetchAllDrivers()
      .then(setDrivers)
      .catch(console.error);
  }
}, [userRole]);

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
      return <PublicTracking onNavigateToLogin={() => setCurrentView("login")} onTrackDelivery={handleTrackDelivery} />;

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
        <>
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
              <DeliveryManagement deliveries={deliveries} onViewDelivery={setSelectedDelivery} onAssignDriver={() => {}} onUpdateDelivery={() => {}} onMarkComplete={() => {}} />
            ) : currentPage === "drivers" ? (
              <DriverManagement
                drivers={drivers}
                onCreateDriver={handleCreateDriver}
                onEditDriver={handleEditDriver}
                onDeactivateDriver={handleDeactivateDriver}
                onShowCreateDriverModal={() => setCreateDriverModal(true)}/>
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

          {/* Modals */}
          <CreateDriverModal
            isOpen={createDriverModal}
            onClose={() => setCreateDriverModal(false)}
            
            onCreateDriver={handleCreateDriver}
          />
          <EditDriverModal
            isOpen={editDriverModal.open}
            onClose={() => setEditDriverModal({ open: false, driver: null })}
            driver={editDriverModal.driver}
            onUpdate={handleUpdateDriver}
          />
        </>
      );

    default:
      return null;
  }
}
