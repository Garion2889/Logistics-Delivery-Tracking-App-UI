import { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./components/AdminDashboard";
import { DeliveryManagement } from "./components/DeliveryManagement";
import { DeliveryDetail } from "./components/DeliveryDetail";
import { DriverManagement } from "./components/DriverManagement";
import { DriverDashboard } from "./components/DriverDashboard";
import { PublicTracking } from "./components/PublicTracking";
import { ReturnsPage } from "./components/ReturnsPage";
import { ReportsPage } from "./components/ReportsPage";
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

// Mock data types
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

// Mock data
const initialDeliveries: Delivery[] = [
  {
    id: "1",
    refNo: "REF-001",
    customer: "Maria Santos",
    address: "123 Rizal St, Makati City, Metro Manila",
    paymentType: "COD",
    status: "pending",
    createdAt: "Nov 12, 2025 9:00 AM",
    phone: "+63 912 345 6789",
    amount: 2500,
  },
  {
    id: "2",
    refNo: "REF-002",
    customer: "Juan Dela Cruz",
    address: "456 Bonifacio Ave, Taguig City, Metro Manila",
    paymentType: "Paid",
    status: "assigned",
    driver: "Pedro Reyes",
    createdAt: "Nov 12, 2025 9:15 AM",
  },
  {
    id: "3",
    refNo: "REF-003",
    customer: "Ana Mercado",
    address: "789 EDSA, Quezon City, Metro Manila",
    paymentType: "COD",
    status: "in-transit",
    driver: "Pedro Reyes",
    createdAt: "Nov 12, 2025 8:30 AM",
    amount: 3200,
  },
  {
    id: "4",
    refNo: "REF-004",
    customer: "Jose Garcia",
    address: "321 Ortigas Ave, Pasig City, Metro Manila",
    paymentType: "Paid",
    status: "delivered",
    driver: "Carlos Mendoza",
    createdAt: "Nov 11, 2025 2:00 PM",
  },
  {
    id: "5",
    refNo: "REF-005",
    customer: "Rosa Torres",
    address: "654 Shaw Blvd, Mandaluyong City, Metro Manila",
    paymentType: "COD",
    status: "pending",
    createdAt: "Nov 12, 2025 9:45 AM",
    amount: 1800,
  },
];

const initialDrivers: Driver[] = [
  {
    id: "1",
    name: "Pedro Reyes",
    email: "pedro@smartstock.ph",
    phone: "+63 912 111 2222",
    vehicle: "Motorcycle",
    status: "online",
    activeDeliveries: 2,
  },
  {
    id: "2",
    name: "Carlos Mendoza",
    email: "carlos@smartstock.ph",
    phone: "+63 912 333 4444",
    vehicle: "Van",
    status: "online",
    activeDeliveries: 1,
  },
  {
    id: "3",
    name: "Luis Ramos",
    email: "luis@smartstock.ph",
    phone: "+63 912 555 6666",
    vehicle: "Truck",
    status: "offline",
    activeDeliveries: 0,
  },
];

export default function App() {
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
  const [updateDeliveryModal, setUpdateDeliveryModal] = useState<{
    open: boolean;
    delivery: Delivery | null;
  }>({ open: false, delivery: null });
  const [editDriverModal, setEditDriverModal] = useState<{
    open: boolean;
    driver: Driver | null;
  }>({ open: false, driver: null });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // State management
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);

  // Inventory state
  const [inventoryTab, setInventoryTab] = useState("products");
  const [addProductModal, setAddProductModal] = useState(false);
  const [addSupplierModal, setAddSupplierModal] = useState(false);
  const [stockAdjustmentModal, setStockAdjustmentModal] = useState<{
    open: boolean;
    item: any;
    type: "add" | "deduct";
  }>({ open: false, item: null, type: "add" });
  const [reorderModal, setReorderModal] = useState<{
    open: boolean;
    item: any;
  }>({ open: false, item: null });
  const [categoryModal, setCategoryModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  // Stats calculations
  const dashboardStats = {
    pendingOrders: deliveries.filter((d) => d.status === "pending").length,
    activeDeliveries: deliveries.filter((d) => d.status === "in-transit").length,
    completedDeliveries: deliveries.filter((d) => d.status === "delivered").length,
    returns: deliveries.filter((d) => d.status === "returned").length,
    revenueChange: 12.5,
    successRate: 94,
  };

  const driverStats = {
    total: deliveries.filter(
      (d) => d.status === "assigned" || d.status === "in-transit"
    ).length,
    completed: deliveries.filter((d) => d.status === "delivered").length,
    returned: deliveries.filter((d) => d.status === "returned").length,
  };

  // Handlers
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
    if (assignDriverModal.delivery) {
      const driver = drivers.find((d) => d.id === driverId);
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === assignDriverModal.delivery!.id
            ? { ...d, driver: driver?.name, status: "assigned" as const }
            : d
        )
      );
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driverId
            ? { ...d, activeDeliveries: d.activeDeliveries + 1 }
            : d
        )
      );
      toast.success(`Driver ${driver?.name} assigned successfully`);
    }
  };

  const handleCreateDriver = (driverData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicle: string;
  }) => {
    const newDriver: Driver = {
      id: String(drivers.length + 1),
      name: driverData.name,
      email: driverData.email,
      phone: driverData.phone,
      vehicle: driverData.vehicle,
      status: "offline",
      activeDeliveries: 0,
    };
    setDrivers((prev) => [...prev, newDriver]);
    toast.success(`Driver ${driverData.name} created successfully`);
  };

  const handleUpdateDelivery = (
    deliveryId: string,
    updates: Partial<Delivery>
  ) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, ...updates } : d))
    );
    toast.success("Delivery updated successfully");
  };

  const handleUpdateDeliveryStatus = (
    deliveryId: string,
    status: Delivery["status"]
  ) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, status } : d))
    );
    toast.success("Delivery status updated");
  };

  const handleEditDriver = (driverId: string, updates: Partial<Driver>) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, ...updates } : d))
    );
    toast.success("Driver information updated");
  };

  const handleDeactivateDriver = (driver: Driver) => {
    setConfirmDialog({
      open: true,
      title: "Deactivate Driver",
      description: `Are you sure you want to deactivate ${driver.name}? They will not be able to access the system until reactivated.`,
      onConfirm: () => {
        setDrivers((prev) =>
          prev.map((d) =>
            d.id === driver.id ? { ...d, status: "offline" as const } : d
          )
        );
        toast.success(`Driver ${driver.name} has been deactivated`);
      },
    });
  };

  const handleUploadPOD = (deliveryId: string) => {
    // Mock POD upload - in production, this would use Supabase Storage
    toast.success("Proof of delivery uploaded successfully");
  };

  const handleTrackDelivery = (refNo: string) => {
    const delivery = deliveries.find(
      (d) => d.refNo.toLowerCase() === refNo.toLowerCase()
    );
    if (delivery) {
      return {
        ...delivery,
        timeline: [
          {
            status: "pending",
            label: "Order Created",
            completed: true,
            date: delivery.createdAt,
          },
          {
            status: "assigned",
            label: "Driver Assigned",
            completed: delivery.status !== "pending",
            date: delivery.status !== "pending" ? "Nov 12, 2025 10:30 AM" : undefined,
          },
          {
            status: "in-transit",
            label: "In Transit",
            completed:
              delivery.status === "in-transit" || delivery.status === "delivered",
            date:
              delivery.status === "in-transit" || delivery.status === "delivered"
                ? "Nov 12, 2025 11:15 AM"
                : undefined,
          },
          {
            status: "delivered",
            label: "Delivered",
            completed: delivery.status === "delivered",
            date: delivery.status === "delivered" ? "Nov 12, 2025 2:45 PM" : undefined,
          },
        ],
      };
    }
    return null;
  };

  // Driver portal deliveries (only assigned to current driver)
  const driverDeliveries = deliveries.filter(
    (d) => d.status === "assigned" || d.status === "in-transit"
  );

  // Render logic
  if (currentView === "login") {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onNavigateToTracking={() => setCurrentView("tracking")}
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
          driverName="Pedro Reyes"
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
        {selectedDelivery ? (
          <DeliveryDetail
            delivery={selectedDelivery}
            onClose={() => setSelectedDelivery(null)}
          />
        ) : currentPage === "dashboard" ? (
          <AdminDashboard stats={dashboardStats} />
        ) : currentPage === "deliveries" ? (
          <DeliveryManagement
            deliveries={deliveries}
            onViewDelivery={setSelectedDelivery}
            onAssignDriver={(delivery) =>
              setAssignDriverModal({ open: true, delivery })
            }
            onUpdateDelivery={(delivery) => {
              setUpdateDeliveryModal({ open: true, delivery });
            }}
            onMarkComplete={(delivery) => {
              handleUpdateDeliveryStatus(delivery.id, "delivered");
            }}
          />
        ) : currentPage === "drivers" ? (
          <DriverManagement
            drivers={drivers}
            onCreateDriver={() => setCreateDriverModal(true)}
            onEditDriver={(driver) => {
              setEditDriverModal({ open: true, driver });
            }}
            onDeactivateDriver={handleDeactivateDriver}
          />
        
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

      <UpdateDeliveryModal
        isOpen={updateDeliveryModal.open}
        onClose={() => setUpdateDeliveryModal({ open: false, delivery: null })}
        delivery={updateDeliveryModal.delivery}
        onUpdate={handleUpdateDelivery}
      />

      <EditDriverModal
        isOpen={editDriverModal.open}
        onClose={() => setEditDriverModal({ open: false, driver: null })}
        driver={editDriverModal.driver}
        onUpdate={handleEditDriver}
      />

      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() =>
          setConfirmDialog({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
          })
        }
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="destructive"
      />
      <Toaster />
    </>
  );
}