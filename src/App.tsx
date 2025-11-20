import { useState } from "react";
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
  // ---------- State ----------
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
    total: deliveries.filter(d => d.status === "assigned" || d.status === "in-transit").length,
    completed: deliveries.filter(d => d.status === "delivered").length,
    returned: deliveries.filter(d => d.status === "returned").length,
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

  const handleAssignDriver = (driverId: string) => {
    if (!assignDriverModal.delivery) return;

    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    setDeliveries(prev =>
      prev.map(d =>
        d.id === assignDriverModal.delivery!.id ? { ...d, driver: driver.name, status: "assigned" } : d
      )
    );

    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId ? { ...d, activeDeliveries: d.activeDeliveries + 1 } : d
      )
    );

    toast.success(`Driver ${driver.name} assigned successfully`);
  };

  const handleCreateDriver = (driverData: { name: string; email: string; password: string; phone: string; vehicle: string }) => {
    const newDriver: Driver = { id: String(drivers.length + 1), name: driverData.name, email: driverData.email, phone: driverData.phone, vehicle: driverData.vehicle, status: "offline", activeDeliveries: 0 };
    setDrivers(prev => [...prev, newDriver]);
    toast.success(`Driver ${driverData.name} created successfully`);
  };

  const handleUpdateDelivery = (deliveryId: string, updates: Partial<Delivery>) => {
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, ...updates } : d));
    toast.success("Delivery updated successfully");
  };

  const handleUpdateDeliveryStatus = (deliveryId: string, status: Delivery["status"]) => {
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status } : d));
    toast.success("Delivery status updated");
  };

  const handleEditDriver = (driverId: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, ...updates } : d));
    toast.success("Driver information updated");
  };

  const handleDeactivateDriver = (driver: Driver) => {
    setConfirmDialog({
      open: true,
      title: `Deactivate Driver`,
      description: `Are you sure you want to deactivate ${driver.name}?`,
      onConfirm: () => {
        setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: "offline" } : d));
        toast.success(`Driver ${driver.name} deactivated`);
      },
    });
  };

  const handleUploadPOD = (deliveryId: string) => toast.success("Proof of delivery uploaded successfully");

  const handleTrackDelivery = (refNo: string) => {
    const delivery = deliveries.find(d => d.refNo.toLowerCase() === refNo.toLowerCase());
    if (!delivery) return null;
    return {
      ...delivery,
      timeline: [
        { status: "pending", label: "Order Created", completed: true, date: delivery.createdAt },
        { status: "assigned", label: "Driver Assigned", completed: delivery.status !== "pending", date: delivery.status !== "pending" ? "Nov 12, 2025 10:30 AM" : undefined },
        { status: "in-transit", label: "In Transit", completed: delivery.status === "in-transit" || delivery.status === "delivered", date: delivery.status === "in-transit" || delivery.status === "delivered" ? "Nov 12, 2025 11:15 AM" : undefined },
        { status: "delivered", label: "Delivered", completed: delivery.status === "delivered", date: delivery.status === "delivered" ? "Nov 12, 2025 2:45 PM" : undefined },
      ],
    };
  };

  const driverDeliveries = deliveries.filter(d => d.status === "assigned" || d.status === "in-transit");

  // ---------- Render ----------
  if (currentView === "login")
    return <><LoginPageWithAuth onLogin={handleLogin} onNavigateToTracking={() => setCurrentView("tracking")} /><Toaster /></>;

  if (currentView === "tracking")
    return <><PublicTracking onNavigateToLogin={() => setCurrentView("login")} onTrackDelivery={handleTrackDelivery} /><Toaster /></>;

  if (currentView === "driver")
    return <><DriverDashboard deliveries={driverDeliveries} onUpdateStatus={handleUpdateDeliveryStatus} onUploadPOD={handleUploadPOD} onLogout={handleLogout} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} driverName="Pedro Reyes" stats={driverStats} /><Toaster /></>;

  // Admin View
  return (
    <>
      <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} userEmail={userEmail}>
        {selectedDelivery ? <DeliveryDetail delivery={selectedDelivery} onClose={() => setSelectedDelivery(null)} /> :
          currentPage === "dashboard" ? <AdminDashboard stats={dashboardStats} /> :
            currentPage === "deliveries" ? <DeliveryManagement deliveries={deliveries} onViewDelivery={setSelectedDelivery} onAssignDriver={(delivery) => setAssignDriverModal({ open: true, delivery })} onUpdateDelivery={(delivery) => setUpdateDeliveryModal({ open: true, delivery })} onMarkComplete={(delivery) => handleUpdateDeliveryStatus(delivery.id, "delivered")} /> :
              currentPage === "drivers" ? <DriverManagement drivers={drivers} onCreateDriver={() => setCreateDriverModal(true)} onEditDriver={(driver) => setEditDriverModal({ open: true, driver })} onDeactivateDriver={handleDeactivateDriver} /> :
                currentPage === "returns" ? <ReturnsPage /> :
                  currentPage === "settings" ? <SettingsPage /> :
                    currentPage === "tracking" ? <RealTimeTrackingPage /> :
                      currentPage === "routes" ? <RouteOptimizationPage /> :
                        currentPage === "analytics" ? <AnalyticsDashboard /> : null}
      </AdminLayout>

      {/* Modals */}
      <AssignDriverModal isOpen={assignDriverModal.open} onClose={() => setAssignDriverModal({ open: false, delivery: null })} drivers={drivers} deliveryRefNo={assignDriverModal.delivery?.refNo || ""} onAssign={handleAssignDriver} />
      <CreateDriverModal isOpen={createDriverModal} onClose={() => setCreateDriverModal(false)} onCreateDriver={handleCreateDriver} />
      <UpdateDeliveryModal isOpen={updateDeliveryModal.open} onClose={() => setUpdateDeliveryModal({ open: false, delivery: null })} delivery={updateDeliveryModal.delivery} onUpdate={handleUpdateDelivery} />
      <EditDriverModal isOpen={editDriverModal.open} onClose={() => setEditDriverModal({ open: false, driver: null })} driver={editDriverModal.driver} onUpdate={handleEditDriver} />
      <ConfirmDialog isOpen={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} })} onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} description={confirmDialog.description} variant="destructive" />
      <Toaster />
    </>
  );
}
        