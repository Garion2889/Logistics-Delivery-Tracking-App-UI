import { useEffect, useRef } from "react";
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
 * Hook to upload GPS coordinates for the logged-in driver
 * @param driverId The ID of the driver (passed from your Auth state)
 * @param fallbackCoords Optional coordinates to use if GPS fails
 */
export function useGPSUploader(driverId: string | null, fallbackCoords?: GPSCoords) {
  const lastUpdateRef = useRef<number>(0); // timestamp of last GPS update

  // We removed the useEffect that calls supabase.auth.getUser() 
  // because we are now passing driverId explicitly.

  useEffect(() => {
    // 1. Don't start tracking until we have a valid Driver ID
    if (!driverId) return;

    let watchId: number | null = null;

    const sendLocation = async (coords: GPSCoords) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 1000) return; // throttle: 5 seconds
      lastUpdateRef.current = now;

      const { latitude, longitude, accuracy, speed, heading, altitude } = coords;
      if (!latitude || !longitude) return;

      // Note: Since you are using custom auth, ensure your Postgres function 
      // 'update_driver_location' allows access to the public/anon role 
      // or validates the user differently, as auth.uid() will be null here.
      const { error } = await supabase.rpc("update_driver_location", {
        p_driver_id: driverId,
        p_lat: latitude,
        p_lng: longitude,
        p_accuracy: accuracy ?? null,
        p_speed: speed ?? null,
        p_heading: heading ?? null,
        p_altitude: altitude ?? null,
      });

      if (error) console.error("RPC error updating GPS:", error);
    };

    const startTracking = async () => {
      const isSecureOrigin =
        window.location.protocol === "https:" || window.location.hostname === "localhost";

      if (!navigator.geolocation) {
        if (fallbackCoords) await sendLocation(fallbackCoords);
        return;
      }

      if (!isSecureOrigin) {
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