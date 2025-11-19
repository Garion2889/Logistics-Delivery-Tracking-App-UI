import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DriverDeliveryDetail } from "./DriverDeliveryDetail";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Import Leaflet components
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import L from 'leaflet'; // Import Leaflet for marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png'; // Import marker icon
import markerShadow from 'leaflet/dist/images/marker-shadow.png'; // Import marker shadow
import {
  Package,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Upload,
  Truck,
  User,
  LogOut,
  Moon,
  Sun,
  Navigation,
  Camera,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner@2.0.3";

interface Delivery {
  id: string;
  refNo: string;
  customer: string;
  address: string;
  status: "pending" | "assigned" | "in-transit" | "delivered" | "returned";
  paymentType: "COD" | "Paid";
  amount?: number;
}

interface DriverDashboardProps {
  deliveries: Delivery[];
  onUpdateStatus: (deliveryId: string, status: Delivery["status"]) => void;
  onUploadPOD: (deliveryId: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  driverName: string;
  stats: {
    total: number;
    completed: number;
    returned: number;
  };
}

export function DriverDashboard({
  deliveries,
  onUpdateStatus,
  onUploadPOD,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  driverName,
  stats,
}: DriverDashboardProps) {
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  
  const selectedDelivery = deliveries.find(d => d.id === selectedDeliveryId);

  const getStatusColor = (status: Delivery["status"]) => {
    const colors = {
      pending: "bg-orange-100 text-orange-700",
      assigned: "bg-blue-100 text-blue-700",
      "in-transit": "bg-purple-100 text-purple-700",
      delivered: "bg-green-100 text-green-700",
      returned: "bg-red-100 text-red-700",
    };
    return colors[status];
  };
  const defaultIcon = new L.Icon({
    iconUrl: markerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
  });
  // Function to open Google Maps with delivery route
  const handleOpenMap = () => {
    toast.info("Opening route map view...");
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#F6F7F8] dark:bg-[#222B2D]">
        {/* Mobile Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-[#1a2123] border-b border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#27AE60] flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-[#222B2D] dark:text-white">
                    SmartStock
                  </h2>
                  <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
                    Driver Portal
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleDarkMode}
                  className="text-[#222B2D] dark:text-white"
                  title="Toggle Dark Mode"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-[#222B2D] dark:text-white">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5">
                      <p className="text-sm text-[#222B2D] dark:text-white">
                        {driverName}
                      </p>
                      <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
                        Driver
                      </p>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#F6F7F8] dark:bg-[#222B2D] rounded-lg p-3 text-center">
                <p className="text-2xl text-[#222B2D] dark:text-white">
                  {stats.total}
                </p>
                <p className="text-xs text-[#222B2D]/60 dark:text-white/60">
                  Total
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl text-[#27AE60]">{stats.completed}</p>
                <p className="text-xs text-[#27AE60]">Completed</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl text-red-600">{stats.returned}</p>
                <p className="text-xs text-red-600">Returned</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 space-y-4">
          {selectedDelivery ? (
            <DriverDeliveryDetail
              delivery={selectedDelivery}
              onBack={() => setSelectedDeliveryId(null)}
              onUpdateStatus={(status) => {
                onUpdateStatus(selectedDelivery.id, status);
                setSelectedDeliveryId(null);
              }}
              onUploadPOD={() => {
                onUploadPOD(selectedDelivery.id);
              }}
            />
          ) : (
            <>
              {/* Map Preview */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                 <MapContainer center={[14.5995, 120.9842]} zoom={13} style={{ height: "400px", width: "100%" }}>
                             <TileLayer
                               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                               attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                             />
                             {/* Example Marker */}
                             <Marker position={[14.5995, 120.9842]} icon={defaultIcon}>
                               <Popup>
                                 A live driver is here.
                               </Popup>
                             </Marker>
                           </MapContainer>
                </CardContent>
              </Card>

              {/* Deliveries Section */}
              <div>
                <h3 className="text-[#222B2D] dark:text-white mb-3">
                  Assigned Deliveries
                </h3>
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <Card
                      key={delivery.id}
                      className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedDeliveryId(delivery.id)}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[#222B2D] dark:text-white">
                              {delivery.refNo}
                            </p>
                            <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                              {delivery.customer}
                            </p>
                          </div>
                          <Badge
                            className={getStatusColor(delivery.status)}
                            variant="outline"
                          >
                            {delivery.status.charAt(0).toUpperCase() +
                              delivery.status.slice(1)}
                          </Badge>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                            {delivery.address}
                          </p>
                        </div>

                        {/* Payment */}
                        {delivery.paymentType === "COD" && delivery.amount && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              Collect on Delivery: ₱{delivery.amount.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {deliveries.length === 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-8 text-center">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-[#222B2D]/60 dark:text-white/60">
                          No deliveries assigned yet
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        {/* Floating Action Button - Open Map View */}
        {!selectedDelivery && deliveries.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <Button
              size="icon"
              className="w-14 h-14 rounded-full bg-[#27AE60] hover:bg-[#229954] text-white shadow-lg"
              onClick={handleOpenMap}
              title="View Routes"
            >
              <Navigation className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
