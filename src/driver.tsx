// driver.tsx
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Custom hook to track the driver's location.
 * Returns a tuple: [latitude, longitude] | null
 */
export function useDriverTracking(
  onUpdate?: (coords: [number, number]) => void
): [number, number] | null {
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        if (onUpdate) onUpdate(coords);
        console.log("Driver location:", coords);
      },
      (err) => {
        console.error("Geolocation error:", err);
        toast.error("Unable to access GPS");
      },
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return location;
}
