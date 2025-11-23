import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface DriverLocation {
  lat: number;
  lng: number;
}

interface PanToSelectedDriverProps {
  selectedDriver: {
    location: DriverLocation | null;
  } | null;
}

export function PanToSelectedDriver({ selectedDriver }: PanToSelectedDriverProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedDriver && selectedDriver.location) {
      map.setView([selectedDriver.location.lat, selectedDriver.location.lng], map.getZoom(), {
        animate: true,
      });
    }
  }, [selectedDriver, map]);

  return null;
}
