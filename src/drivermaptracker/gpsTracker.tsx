import { useEffect, useState, useRef } from "react";
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
 * @param fallbackCoords Optional coordinates to use if GPS fails
 */
export function useGPSUploader(fallbackCoords?: GPSCoords) {
  const [driverId, setDriverId] = useState<string>("");
  const lastUpdateRef = useRef<number>(0); // timestamp of last GPS update

  // Step 1: fetch driver UUID for logged-in user
  useEffect(() => {
    const fetchDriverId = async () => {
      const { data: authUserData } = await supabase.auth.getUser();
      const userId = authUserData?.user?.id;
      if (!userId) return;

      const { data: driver, error } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (error || !driver?.id) return;
      setDriverId(driver.id);
    };

    fetchDriverId();
  }, []);

  // Step 2: start GPS tracking once driverId is available
  useEffect(() => {
    if (!driverId) return;

    let watchId: number | null = null;

    const sendLocation = async (coords: GPSCoords) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 5000) return; // throttle: 5 seconds
      lastUpdateRef.current = now;

      const { latitude, longitude, accuracy, speed, heading, altitude } = coords;
      if (!latitude || !longitude) return;

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
