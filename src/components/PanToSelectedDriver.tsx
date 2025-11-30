import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

interface DriverLocation {
  lat: number;
  lng: number;
}

interface PanToSelectedDriverProps {
  selectedDriver: {
    location: DriverLocation | null;
  } | null;
  role: "admin" | "driver";
}

export function PanToSelectedDriver({ selectedDriver, role }: PanToSelectedDriverProps) {
  const map = useMap();
  const hasPanned = useRef(false);

  useEffect(() => {
    if (!selectedDriver?.location) return;

    if (role === "admin") {
      // Pan only once for admin
      if (!hasPanned.current) {
        map.setView([selectedDriver.location.lat, selectedDriver.location.lng], map.getZoom(), {
          animate: true,
        });
        hasPanned.current = true;
      }
    } else if (role === "driver") {
      // Continuously follow driver
      map.setView([selectedDriver.location.lat, selectedDriver.location.lng], map.getZoom(), {
        animate: true,
      });
    }
  }, [selectedDriver, map, role]);

  return null;
}
