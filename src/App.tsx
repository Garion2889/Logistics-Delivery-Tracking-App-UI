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
import { AssignDriverModal } from "./components/AssignDriverModal";

import { toast } from "sonner";
import { trackDelivery, fetchAllDrivers, supabase, updateOrderStatus as updateOrderStatusRpc } from "./lib/supabase";
//import { autoAssignRoutes } from "./lib/supabase"; 
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
  timeline?: {
    status: string;
    label: string;
    date?: string;
    completed: boolean;
  }[];
}

export interface Driver {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  status: "online" | "offline";
  vehicle_type: "Motorcycle" | "Car" | "Van" | "Truck";
  plate_number?: string;
  license_number?: string;
  last_lat?: number;
  last_lng?: number;
  last_location_update?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string
  rating?: number;
  completedDeliveries?: number;
  avatar?: string;
  isDeactivated?: boolean;
  deactivationReason?: string;
  deactivatedAt?: string;
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
  const [createDriverModal, setCreateDriverModal] = useState(false);
  const [editDriverModal, setEditDriverModal] = useState<{
    open: boolean;
    driver: Driver | null;
  }>({ open: false, driver: null });
  const [assignDriverModal, setAssignDriverModal] = useState({
    open: false,
    delivery: null as Delivery | null, });
  


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

  const handleLogin = async (token: string, role: "admin" | "driver", id: string) => {
  setUserId(id);
  setUserRole(role);
  setCurrentView(role);

  // Persist session info
  localStorage.setItem("userId", id);
  localStorage.setItem("userRole", role);

  // Get current session from Supabase
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;


  if (!accessToken) {
    toast.error("Login failed: no active session token");
    return;
  }

  localStorage.setItem("supabaseAccessToken", accessToken);

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

  const handleUpdateDeliveryStatus = async (deliveryId: string, status: Delivery["status"]) => {
    try {
      const dbStatus = mapStatusToDB(status);
      await updateOrderStatusRpc(deliveryId, dbStatus as any);
      await fetchDeliveries();
      toast.success("Delivery status updated");
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  const handleUploadPOD = (deliveryId: string) => toast.success("Proof of delivery uploaded successfully");

  const handleCreateDriver = async (driverData: {
  full_name: string;
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
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        full_name: driverData.full_name,
        email: driverData.email,
        password: driverData.password,
        phone: driverData.phone,
        vehicle_type: driverData.vehicle, // e.g. "Motorcycle"
      }),
    });

    console.log("Status:", res.status);
    const data = await res.json().catch(() => null);
    console.log("Response:", data);

    if (!res.ok || !data || data.error) {
      throw new Error(
        data?.error || data?.details || `HTTP ${res.status}`
      );
    }

    // Create frontend driver object
    const newDriver: Driver = {
      id: data.driver.id,
      user_id: data.driver.user_id,
      name: data.user.full_name,
      email: data.user.email,
      phone: data.user.phone,
      status: data.driver.status ?? "offline",
      vehicle_type: data.driver.vehicle_type,
      plate_number: data.driver.plate_number ?? "",
      license_number: data.driver.license_number ?? "",
      last_lat: data.driver.last_lat ?? null,
      last_lng: data.driver.last_lng ?? null,
      last_location_update: data.driver.last_location_update ?? null,
      is_active: data.driver.is_active ?? true,
      created_at: data.driver.created_at,
      updated_at: data.driver.updated_at,
      rating: 0,
      completedDeliveries: 0,
      avatar: "",
      isDeactivated: false,
      deactivationReason: "",
      deactivatedAt: "",
    };
    setDrivers((prev) => [newDriver, ...prev]);
    toast.success(`Driver ${driverData.full_name} created successfully`);
  } catch (err: any) {
    console.error("handleCreateDriver exception:", err);
    toast.error(`Failed to create driver: ${err.message ?? "Unknown error"}`);
  }
};

// App.tsx or wherever onUpdate lives
const handleUpdateDriver = async (
  driverId: string,
  userId: string,
  updates: Partial<Driver>
) => {
  try {
    // Prepare vehicle JSON if needed
    let vehicleJson: Record<string, string> | null = null;
    if (updates.vehicle) {
      vehicleJson = { type: updates.vehicle }; // adjust if more vehicle info exists
    }

    const { data, error } = await supabase.rpc("update_driver_profile", {
      p_caller: userId,          // admin UUID or driver themselves
      p_driver_id: driverId,
      p_full_name: updates.name ?? null,
      p_email: updates.email ?? null,
      p_phone: updates.phone ?? null,
      p_vehicle: vehicleJson,
    });

    if (error) throw error;

    console.log("Driver updated successfully:", data);

    // Optionally update local state
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId
          ? { ...d, ...updates, vehicle: updates.vehicle ?? d.vehicle }
          : d
      )
    );

    toast.success("Driver profile updated successfully");
  } catch (err: any) {
    console.error("Failed to update driver profile:", err);
    toast.error(`Update failed: ${err.message}`);
  }
};


const handleDeactivateDriver = async (driverId: string) => {
  try {
    const { error } = await supabase.rpc("deactivate_driver_account", {
      p_caller: userId, // admin UUID
      p_driver_id: driverId,
    });

    if (error) throw error;

    // Update local state so UI reflects the change immediately
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId ? { ...d, status: "deactivated" } : d
      )
    );

    toast.success("Driver account deactivated");
  } catch (err: any) {
    console.error("Deactivate driver error:", err);
    toast.error(`Failed to deactivate driver: ${err.message}`);
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
  
  //const handleAutoAssign = async () => {
  //toast.info("Assigning deliveries...");

  //const { ok, data } = await autoAssignRoutes();

  //if (!ok) return toast.error(data.error || "Auto-assign failed");

  //toast.success("Auto Assignment Completed");
  //console.log("Assignments:", data.assignments);

  //await fetchDeliveries(); // refresh UI
  //};

  const handleAssignDriver = async (driverId: string) => {
  if (!assignDriverModal.delivery) return;

  const refNo = assignDriverModal.delivery.refNo;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-driver`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryRefNo: refNo,
          driverId,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to assign driver");

    toast.success(`Driver assigned to ${refNo}`);

    setAssignDriverModal({ open: false, delivery: null });
    await fetchDeliveries(); // 🔥 refresh table
  } catch (err: any) {
    toast.error(err.message);
  }
};
  
  const mapDriverForModal = (d: Driver) => ({
  id: d.id,
  name: d.name,
  email: d.email,
  vehicle: d.vehicle_type || "Unknown",   // modal requires `vehicle`
  status: d.status,
  activeDeliveries: 0,                     // or compute real number later
});

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

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          driver_info:drivers!assigned_driver(
            id,
            user_info:logistics_users!user_id(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed = (data || []).map((d: any) => ({
        id: d.id,
        refNo: d.ref_no,
        customer: d.customer_name,
        address: d.address,
        status: mapStatus(d.status),
        driver: d.driver_info?.user_info?.full_name,
        createdAt: new Date(d.created_at).toLocaleString(),
        phone: d.customer_phone,
        amount: d.total_amount,
      }));

      setDeliveries(transformed);
    } catch (error: any) {
      toast.error(`Failed to fetch deliveries: ${error.message}`);
    }
  };

  const mapStatusToDB = (uiStatus: Delivery['status']): string => {
    const mapping: Record<Delivery['status'], string> = {
      'pending': 'created',
      'assigned': 'picked_up',  // Accept Assignment = picked up the package
      'in-transit': 'delivered', // Confirm Delivery = mark as delivered
      'delivered': 'delivered',
      'returned': 'returned',
    };
    return mapping[uiStatus] || 'created';
  };

  useEffect(() => {
    if (currentView === "admin" || currentView === "driver") {
      fetchDeliveries();
    }
  }, [currentView]);

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
              <DeliveryManagement
               deliveries={deliveries} 
               onViewDelivery={setSelectedDelivery} 
               onAssignDriver={(delivery) => setAssignDriverModal({ open: true, delivery })} 
               onUpdateDelivery={() => {}} 
               onMarkComplete={() => {}} />
            ) : currentPage === "drivers" ? (
              <DriverManagement
                drivers={drivers}
                onEditDriver={handleUpdateDriver}
                onDeactivateDriver={handleDeactivateDriver}
                onShowCreateDriverModal={() => setCreateDriverModal(true)}
                onShowEditDriverModal={(driver) => setEditDriverModal({ open: true, driver })}/>
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
          <AssignDriverModal
            isOpen={assignDriverModal.open}
            onClose={() => setAssignDriverModal({ open: false, delivery: null })}
            drivers={drivers.map(mapDriverForModal)}
            deliveryRefNo={assignDriverModal.delivery?.refNo || ""}
            onAssign={handleAssignDriver}
          />

        </>
      );

    default:
      return null;
  }
}