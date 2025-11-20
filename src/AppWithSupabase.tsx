import { useState, useEffect } from "react";
import { LoginPageWithAuth } from "./components/LoginPageWithAuth";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./components/AdminDashboard";
import { DeliveryManagement } from "./components/DeliveryManagement";
import { DeliveryDetail } from "./components/DeliveryDetail";
import { DriverManagement } from "./components/DriverManagement";
import { DriverDashboard } from "./components/DriverDashboard";
import { PublicTracking } from "./components/PublicTracking";
import { RealTimeTrackingPage } from "./components/RealTimeTrackingPage";
import { RouteOptimizationPage } from "./components/RouteOptimizationPage";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { AssignDriverModal } from "./components/AssignDriverModal";
import { CreateDriverModal } from "./components/CreateDriverModal";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import {
  supabase,
  signIn,
  signOut,
  createDriverAccount,
  trackDelivery,
  uploadPODImage,
  subscribeToDeliveries,
  updateDriverStatus,
} from "./lib/supabase";
import type { Database } from "./types/database.types";
import "./styles/globals.css";

type DeliveryRow = Database['public']['Tables']['deliveries']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];

// Extended types with joined data
interface DeliveryWithDriver extends DeliveryRow {
  driver_info?: {
    full_name: string;
    vehicle_type: string;
  };
}

interface DriverWithUser extends DriverRow {
  user_info: UserRow;
}

interface Delivery {
  id: string;
  refNo: string;
  customer: string;
  address: string;
  paymentType: "COD" | "Paid";
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
  activeDeliveries: number;
}

export default function AppWithSupabase() {
  const [currentView, setCurrentView] = useState<
    "login" | "admin" | "driver" | "tracking"
  >("login");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [assignDriverModal, setAssignDriverModal] = useState<{
    open: boolean;
    delivery: Delivery | null;
  }>({ open: false, delivery: null });
  const [createDriverModal, setCreateDriverModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "driver" | null>(null);
  const [currentDriverId, setCurrentDriverId] = useState<string | null>(null);

  // State for Supabase data
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);


  
  // Fetch deliveries from Supabase
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          driver_info:drivers!assigned_driver(
            id,
            user_info:users!user_id(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to UI format
      const transformed = (data || []).map((d: any) => ({
        id: d.id,
        refNo: d.ref_no,
        customer: d.customer_name,
        address: d.address,
        paymentType: d.payment_type === 'cod' ? 'COD' : 'Paid',
        status: mapStatus(d.status),
        driver: d.driver_info?.user_info?.full_name,
        createdAt: new Date(d.created_at).toLocaleString(),
        phone: d.customer_phone,
        amount: d.total_amount,
      }));

      setDeliveries(transformed);
    } catch (error: any) {
      toast.error(`Failed to fetch deliveries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch drivers from Supabase
  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          user_info:users!user_id(*)
        `);

      if (error) throw error;

      // Count active deliveries for each driver
      const { data: deliveriesData } = await supabase
        .from('deliveries')
        .select('assigned_driver')
        .in('status', ['dispatched', 'in_transit']);

      const deliveryCounts: Record<string, number> = {};
      (deliveriesData || []).forEach((d: any) => {
        if (d.assigned_driver) {
          deliveryCounts[d.assigned_driver] = (deliveryCounts[d.assigned_driver] || 0) + 1;
        }
      });

      // Transform to UI format
      const transformed = (data || []).map((d: any) => ({
        id: d.id,
        name: d.user_info.full_name,
        email: d.user_info.email || '',
        phone: d.user_info.phone || '',
        vehicle: d.vehicle_type,
        status: d.status === 'on_delivery' ? 'online' : d.status,
        activeDeliveries: deliveryCounts[d.id] || 0,
      }));

      setDrivers(transformed);
    } catch (error: any) {
      toast.error(`Failed to fetch drivers: ${error.message}`);
    }
  };

  // Map database status to UI status
  const mapStatus = (dbStatus: string): Delivery['status'] => {
    const mapping: Record<string, Delivery['status']> = {
      'created': 'pending',
      'dispatched': 'assigned',
      'in_transit': 'in-transit',
      'delivered': 'delivered',
      'returned': 'returned',
    };
    return mapping[dbStatus] || 'pending';
  };

  // Map UI status to database status
  const mapStatusToDB = (uiStatus: Delivery['status']): string => {
    const mapping: Record<Delivery['status'], string> = {
      'pending': 'created',
      'assigned': 'dispatched',
      'in-transit': 'in_transit',
      'delivered': 'delivered',
      'returned': 'returned',
    };
    return mapping[uiStatus] || 'created';
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (currentView === 'admin' || currentView === 'driver') {
      const subscription = subscribeToDeliveries((payload) => {
        console.log('Delivery update:', payload);
        fetchDeliveries();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentView]);

  // Load data when logged in
  useEffect(() => {
    if (currentView === 'admin' || currentView === 'driver') {
      fetchDeliveries();
      if (currentView === 'admin') {
        fetchDrivers();
      }
    }
  }, [currentView]);

  // Stats calculations
  const dashboardStats = {
    pendingOrders: deliveries.filter((d) => d.status === "pending").length,
    activeDeliveries: deliveries.filter((d) => d.status === "in-transit").length,
    completedDeliveries: deliveries.filter((d) => d.status === "delivered").length,
    returns: deliveries.filter((d) => d.status === "returned").length,
    successRate: deliveries.length > 0 ? Math.round((deliveries.filter((d) => d.status === "delivered").length / deliveries.length) * 100) : 0,
  };

  const driverStats = {
    total: deliveries.filter(
      (d) => d.status === "assigned" || d.status === "in-transit"
    ).length,
    completed: deliveries.filter((d) => d.status === "delivered").length,
    returned: deliveries.filter((d) => d.status === "returned").length,
  };

  // Handlers
  const handleLogin = async (role: "admin" | "driver", email: string, password: string) => {
    try {
      setLoading(true);
      const { user, profile } = await signIn(email, password);
      
      if (profile.role !== role) {
        toast.error(`Invalid credentials for ${role} role`);
        await signOut();
        return;
      }

      setUserEmail(email);
      setUserId(user.id);
      setUserRole(profile.role);
      setCurrentView(role);

      // If driver, get driver ID
      if (role === 'driver') {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (driverData) {
          setCurrentDriverId(driverData.id);
          // Set driver as online
          await updateDriverStatus(driverData.id, 'online');
        }
      }

      toast.success(`Welcome back, ${profile.full_name}!`);
    } catch (error: any) {
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Set driver as offline before logout
      if (currentDriverId) {
        await updateDriverStatus(currentDriverId, 'offline');
      }

      await signOut();
      setCurrentView("login");
      setCurrentPage("dashboard");
      setSelectedDelivery(null);
      setUserEmail("");
      setUserId(null);
      setUserRole(null);
      setCurrentDriverId(null);
      toast.info("Logged out successfully");
    } catch (error: any) {
      toast.error(`Logout failed: ${error.message}`);
    }
  };

  const handleAssignDriver = async (driverId: string) => {
    if (!assignDriverModal.delivery) return;

    try {
      const { error } = await supabase
        .from('deliveries')
        .update({
          assigned_driver: driverId,
          status: 'dispatched',
        })
        .eq('id', assignDriverModal.delivery.id);

      if (error) throw error;

      const driver = drivers.find((d) => d.id === driverId);
      toast.success(`Driver ${driver?.name} assigned successfully`);
      fetchDeliveries();
      fetchDrivers();
    } catch (error: any) {
      toast.error(`Failed to assign driver: ${error.message}`);
    }
  };

  const handleCreateDriver = async (driverData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicle: string;
  }) => {
    try {
      setLoading(true);
      await createDriverAccount({
        email: driverData.email,
        password: driverData.password,
        full_name: driverData.name,
        phone: driverData.phone,
        vehicle_type: driverData.vehicle,
      });

      toast.success(`Driver ${driverData.name} created successfully`);
      fetchDrivers();
    } catch (error: any) {
      toast.error(`Failed to create driver: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryStatus = async (
    deliveryId: string,
    status: Delivery["status"]
  ) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: mapStatusToDB(status) })
        .eq('id', deliveryId);

      if (error) throw error;

      toast.success("Delivery status updated");
      fetchDeliveries();
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  const handleUploadPOD = async (deliveryId: string) => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use camera on mobile

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setLoading(true);
        await uploadPODImage(file, deliveryId);
        toast.success("Proof of delivery uploaded successfully");
      } catch (error: any) {
        toast.error(`Upload failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };

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

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'created': 'Order Created',
      'dispatched': 'Driver Assigned',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'returned': 'Returned',
    };
    return labels[status] || status;
  };

  // Driver portal deliveries (only assigned to current driver)
  const driverDeliveries = deliveries.filter(
    (d) => d.status === "assigned" || d.status === "in-transit"
  );

  // Render logic
  if (currentView === "login") {
    return (
      <>
        <LoginPageWithAuth
          onLogin={handleLogin}
          onNavigateToTracking={() => setCurrentView("tracking")}
          loading={loading}
        />
        <Toaster />
      </>
    );
  }

  if (currentView === "tracking") {
    return (
      <>
        <PublicTracking
          onNavigateToLogin={() => setCurrentView("login")}
          onTrackDelivery={handleTrackDelivery}
        />
        <Toaster />
      </>
    );
  }

  if (currentView === "driver") {
    return (
      <>
        <DriverDashboard
          deliveries={driverDeliveries}
          onUpdateStatus={handleUpdateDeliveryStatus}
          onUploadPOD={handleUploadPOD}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          driverName={userEmail.split('@')[0]}
          stats={driverStats}
        />
        <Toaster />
      </>
    );
  }

  // Admin view
  return (
    <>
      <AdminLayout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        userEmail={userEmail}
      >
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-[#222B2D]/60 dark:text-white/60">Loading...</div>
          </div>
        )}
        
        {!loading && selectedDelivery ? (
          <DeliveryDetail
            delivery={selectedDelivery}
            onClose={() => setSelectedDelivery(null)}
          />
        ) : !loading && currentPage === "dashboard" ? (
          <AdminDashboard stats={dashboardStats} />
        ) : !loading && currentPage === "deliveries" ? (
          <DeliveryManagement
            deliveries={deliveries}
            onViewDelivery={setSelectedDelivery}
            onAssignDriver={(delivery) =>
              setAssignDriverModal({ open: true, delivery })
            }
            onUpdateDelivery={(delivery) => {
              toast.info("Update delivery functionality");
            }}
            onMarkComplete={(delivery) => {
              handleUpdateDeliveryStatus(delivery.id, "delivered");
            }}
          />
        ) : !loading && currentPage === "drivers" ? (
          <DriverManagement
            drivers={drivers}
            onCreateDriver={() => setCreateDriverModal(true)}
            onEditDriver={(driver) => {
              toast.info(`Edit driver: ${driver.name}`);
            }}
            onDeactivateDriver={(driver) => {
              toast.warning(`Deactivate driver: ${driver.name}`);
            }}
          />
        ) : !loading && currentPage === "tracking" ? (
          <RealTimeTrackingPage />
        ) : !loading && currentPage === "routes" ? (
          <RouteOptimizationPage />
        ) : !loading && currentPage === "analytics" ? (
          <AnalyticsDashboard />
        ) : !loading && currentPage === "returns" ? (
          <div className="space-y-6">
            <h1 className="text-[#222B2D] dark:text-white">Returns</h1>
            <p className="text-[#222B2D]/60 dark:text-white/60">
              Returns management coming soon...
            </p>
          </div>
        ) : !loading && currentPage === "settings" ? (
          <div className="space-y-6">
            <h1 className="text-[#222B2D] dark:text-white">Settings</h1>
            <p className="text-[#222B2D]/60 dark:text-white/60">
              System settings coming soon...
            </p>
          </div>
        ) : null}
      </AdminLayout>

      {/* Modals */}
      <AssignDriverModal
        isOpen={assignDriverModal.open}
        onClose={() => setAssignDriverModal({ open: false, delivery: null })}
        drivers={drivers}
        deliveryRefNo={assignDriverModal.delivery?.refNo || ""}
        onAssign={handleAssignDriver}
      />

      <CreateDriverModal
        isOpen={createDriverModal}
        onClose={() => setCreateDriverModal(false)}
        onCreateDriver={handleCreateDriver}
      />

      <Toaster />
    </>
  );
}
