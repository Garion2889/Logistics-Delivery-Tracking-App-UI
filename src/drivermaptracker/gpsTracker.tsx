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

    let watchId: number | null = null;

    const startTracking = async () => {
      // Check if geolocation is available and page is served securely
      const isSecureOrigin = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

      if (!navigator.geolocation) {
        console.warn("Geolocation not supported. Using fallback coords if available.");
        if (fallbackCoords) {
          await supabase.rpc("update_driver_location", {
            driver_id: driverId,
            lat: fallbackCoords.latitude,
            lng: fallbackCoords.longitude,
            accuracy: fallbackCoords.accuracy,
            speed: fallbackCoords.speed,
            heading: fallbackCoords.heading,
            altitude: fallbackCoords.altitude,
          });
        }
        return;
      }

      if (!isSecureOrigin) {
        console.warn("Geolocation requires HTTPS. Using fallback coords if available.");
        if (fallbackCoords) {
          await supabase.rpc("update_driver_location", {
            driver_id: driverId,
            lat: fallbackCoords.latitude,
            lng: fallbackCoords.longitude,
            accuracy: fallbackCoords.accuracy,
            speed: fallbackCoords.speed,
            heading: fallbackCoords.heading,
            altitude: fallbackCoords.altitude,
          });
        }
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;

          if (!latitude || !longitude) return;

          await supabase.rpc("update_driver_location", {
            driver_id: driverId,
            lat: latitude,
            lng: longitude,
            accuracy: accuracy,
            speed: speed,
            heading: heading,
            altitude: altitude,
          });
        },
        async (err) => {
          console.error("GPS error:", err);

          if ((err.code === 2 || err.code === 3) && fallbackCoords) {
            console.warn("Using fallback coordinates due to GPS error.");
            await supabase.rpc("update_driver_location", {
              driver_uuid: driverId,
              lat: fallbackCoords.latitude,
              lng: fallbackCoords.longitude,
              accuracy: fallbackCoords.accuracy,
              speed: fallbackCoords.speed,
              heading: fallbackCoords.heading,
              altitude: fallbackCoords.altitude,
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
