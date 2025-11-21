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

/**
 * Validates if a string is a proper UUID
 */
const isValidUUID = (uuid: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);

export function useGPSUploader(driverId: string, fallbackCoords?: GPSCoords) {
  useEffect(() => {
    if (!driverId || !isValidUUID(driverId)) {
      console.warn("Invalid or missing driverId:", driverId);
      return;
    }

    let watchId: number | null = null;

    const sendLocation = async (coords: GPSCoords) => {
      const { latitude, longitude, accuracy, speed, heading, altitude } = coords;

      if (!latitude || !longitude) return;

      const { data, error } = await supabase.rpc("update_driver_location", {
        driver_id: driverId,
        lat: latitude,
        lng: longitude,
        accuracy: accuracy ?? null,
        speed: speed ?? null,
        heading: heading ?? null,
        altitude: altitude ?? null,
      });

      if (error) {
        console.error("Supabase RPC error:", error);
      } else {
        console.log("Location updated:", { latitude, longitude });
      }
    };

    const startTracking = async () => {
      const isSecureOrigin =
        window.location.protocol === "https:" || window.location.hostname === "localhost";

      if (!navigator.geolocation) {
        console.warn("Geolocation not supported. Using fallback coords if available.");
        if (fallbackCoords) await sendLocation(fallbackCoords);
        return;
      }

      if (!isSecureOrigin) {
        console.warn("Geolocation requires HTTPS. Using fallback coords if available.");
        if (fallbackCoords) await sendLocation(fallbackCoords);
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;
          await sendLocation({ latitude, longitude, accuracy, speed, heading, altitude });
        },
        async (err) => {
          console.error("GPS error:", err);
          if ((err.code === 2 || err.code === 3) && fallbackCoords) {
            console.warn("Using fallback coordinates due to GPS error.");
            await sendLocation(fallbackCoords);
          }
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    };

    startTracking();

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [driverId, fallbackCoords]);
}
