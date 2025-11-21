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
      const isSecureOrigin = window.location.protocol === "https:" || window.location.hostname === "localhost";

      if (!navigator.geolocation) {
        console.warn("Geolocation not supported. Using fallback coords if available.");
        if (fallbackCoords) {
          await supabase
            .from("driver_locations")
            .update({
              latitude: fallbackCoords.latitude,
              longitude: fallbackCoords.longitude,
              accuracy: fallbackCoords.accuracy,
              speed: fallbackCoords.speed,
              heading: fallbackCoords.heading,
              altitude: fallbackCoords.altitude,
            })
            .eq("driver_uuid", driverId);
        }
        return;
      }

      if (!isSecureOrigin) {
        console.warn("Geolocation requires HTTPS. Using fallback coords if available.");
        if (fallbackCoords) {
          await supabase
            .from("driver_locations")
            .update({
              latitude: fallbackCoords.latitude,
              longitude: fallbackCoords.longitude,
              accuracy: fallbackCoords.accuracy,
              speed: fallbackCoords.speed,
              heading: fallbackCoords.heading,
              altitude: fallbackCoords.altitude,
            })
            .eq("driver_uuid", driverId);
        }
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;
          if (!latitude || !longitude) return;

          await supabase
            .from("driver_locations")
            .update({ latitude, longitude, accuracy, speed, heading, altitude })
            .eq("driver_uuid", driverId);
        },
        async (err) => {
          console.error("GPS error:", err);

          if ((err.code === 2 || err.code === 3) && fallbackCoords) {
            console.warn("Using fallback coordinates due to GPS error.");
            await supabase
              .from("driver_locations")
              .update({
                latitude: fallbackCoords.latitude,
                longitude: fallbackCoords.longitude,
                accuracy: fallbackCoords.accuracy,
                speed: fallbackCoords.speed,
                heading: fallbackCoords.heading,
                altitude: fallbackCoords.altitude,
              })
              .eq("driver_uuid", driverId);
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
