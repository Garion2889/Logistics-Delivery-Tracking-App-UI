import { useEffect } from "react";
import { supabase } from "../utils/supabase/client";

interface GPSCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
}

export function useGPSUploader(driverId: string, fallbackCoords?: GPSCoords) {
  useEffect(() => {
    if (!driverId) return;

    let watchId: number | null = null;

    const startTracking = async () => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported. Using fallback coords if available.");
        if (fallbackCoords) {
          await supabase.from("driver_locations").upsert({
            driver_id: driverId,
            ...fallbackCoords,
            is_moving: false,
            recorded_at: new Date().toISOString(),
          });
        }
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;

          if (!latitude || !longitude) return;

          await supabase.from("driver_locations").upsert({
            driver_id: driverId,
            latitude,
            longitude,
            is_moving: speed && speed > 0,
            recorded_at: new Date().toISOString(),
            ...(accuracy !== undefined && { accuracy }),
            ...(speed !== undefined && { speed }),
            ...(heading !== undefined && { heading }),
            ...(altitude !== undefined && { altitude }),
          }, { onConflict: "driver_id" });
        },
        async (err) => {
          console.error("GPS error:", err);

          if ((err.code === 2 || err.code === 3) && fallbackCoords) {
            console.warn("Using fallback coordinates due to GPS error.");
            await supabase.from("driver_locations").upsert({
              driver_id: driverId,
              ...fallbackCoords,
              is_moving: false,
              recorded_at: new Date().toISOString(),
            });
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );
    };

    startTracking();

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [driverId, fallbackCoords]);
}
