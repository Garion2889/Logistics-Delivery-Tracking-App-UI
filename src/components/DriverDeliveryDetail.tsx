import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  MapPin,
  Phone,
  Package,
  CheckCircle2,
  RotateCcw,
  Camera,
  ArrowLeft,
  DollarSign,
} from "lucide-react";

interface Delivery {
  id: string;
  refNo: string;
  customer: string;
  address: string;
  status: "pending" | "assigned" | "in-transit" | "delivered" | "returned";
  paymentType: "COD" | "Paid";
  amount?: number;
  phone?: string;
}

interface DriverDeliveryDetailProps {
  delivery: Delivery;
  onBack: () => void;
  onUpdateStatus: (status: Delivery["status"]) => void;
  onUploadPOD: () => void;
}

export function DriverDeliveryDetail({
  delivery,
  onBack,
  onUpdateStatus,
  onUploadPOD,
}: DriverDeliveryDetailProps) {
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

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Deliveries
      </Button>

      {/* Delivery Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg text-[#222B2D] dark:text-white">
                {delivery.refNo}
              </p>
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                {delivery.customer}
              </p>
            </div>
            <Badge className={getStatusColor(delivery.status)} variant="outline">
              {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Details */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-sm text-[#222B2D]/60 dark:text-white/60 mb-1">
              Delivery Address
            </p>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-[#222B2D] dark:text-white">{delivery.address}</p>
            </div>
          </div>

          {delivery.phone && (
            <div>
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60 mb-1">
                Contact Number
              </p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a
                  href={`tel:${delivery.phone}`}
                  className="text-[#27AE60] hover:underline"
                >
                  {delivery.phone}
                </a>
              </div>
            </div>
          )}

          {delivery.paymentType === "COD" && delivery.amount && (
            <div>
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60 mb-2">
                Payment
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-800 dark:text-yellow-200">
                      Collect on Delivery
                    </span>
                  </div>
                  <p className="text-xl text-yellow-800 dark:text-yellow-200">
                    ₱{delivery.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {delivery.paymentType === "Paid" && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#27AE60]" />
                <span className="text-[#27AE60]">Payment Already Received</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        {delivery.status === "assigned" && (
          <Button
            className="w-full bg-[#27AE60] hover:bg-[#229954 text-white h-12"
            onClick={() => onUpdateStatus("in-transit")}
          >
            <Package className="w-5 h-5 mr-2" />
            Mark as Picked Up
          </Button>
        )}

        {delivery.status === "in-transit" && (
          <>
            <Button
              className="w-full bg-[#27AE60] hover:bg-[#229954] text-white h-12"
              onClick={() => onUpdateStatus("delivered")}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Confirm Delivery
            </Button>
            <Button
              variant="outline"
              className="w-full text-red-600 h-12"
              onClick={() => onUpdateStatus("returned")}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Mark as Returned
            </Button>
          </>
        )}

        {(delivery.status === "delivered" || delivery.status === "returned") && (
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={onUploadPOD}
          >
            <Camera className="w-5 h-5 mr-2" />
            Upload Proof of Delivery
          </Button>
        )}
      </div>

      {/* Map Preview */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-48 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-[#27AE60] mx-auto mb-2" />
              <p className="text-sm text-[#222B2D]/60 dark:text-white/60">
                Route Map
              </p>
              <p className="text-xs text-[#222B2D]/40 dark:text-white/40">
                Google Maps integration placeholder
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
