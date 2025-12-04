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

export function useGPSUploader(driverId: string | null, fallbackCoords?: GPSCoords) {
  const lastUpdateRef = useRef<number>(0);
  const fallbackCoordsRef = useRef(fallbackCoords);

  // By storing fallbackCoords in a ref, we prevent the main effect from re-running
  // if the parent component passes a new object identity on each render.
  useEffect(() => {
    fallbackCoordsRef.current = fallbackCoords;
  }, [fallbackCoords]);

  useEffect(() => {
    // 1. Don't start tracking until we have a valid Driver ID
    if (!driverId) {
      console.log("GPS: Waiting for Driver ID...");
      return;
    }

    console.log("GPS: Tracking started for Driver:", driverId);
    let watchId: number | null = null;

    const sendLocation = async (coords: GPSCoords) => {
      const now = Date.now();
      
      // 2. RESTORED THROTTLE: Only update every 5 seconds
      if (now - lastUpdateRef.current < 5000) return;
      lastUpdateRef.current = now;

      const { latitude, longitude, accuracy, speed, heading, altitude } = coords;
      if (!latitude || !longitude) return;

      console.log(`GPS: Sending Update -> [${latitude}, ${longitude}]`);

      const { error } = await supabase
        .from('drivers')
        .update({
          last_lat: latitude,
          last_lng: longitude,
          last_location_update: new Date().toISOString(),
        })
        .eq('id', driverId);

      if (error) {
        console.error("GPS RPC Error:", error.message);
      } else {
        console.log("GPS: Database updated successfully");
      }
    };

    const startTracking = async () => {
      // 3. Browser Permission Check
      if (!navigator.geolocation) {
        console.error("GPS: Geolocation not supported");
        // Use the ref to get the latest fallback coordinates
        if (fallbackCoordsRef.current) await sendLocation(fallbackCoordsRef.current);
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          // Success callback
          const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;
          await sendLocation({ latitude, longitude, accuracy, speed, heading, altitude });
        },
        async (err) => {
          // Error callback
          console.error("GPS Device Error:", err.message);
           // Use the ref to get the latest fallback coordinates
          if ((err.code === 2 || err.code === 3) && fallbackCoordsRef.current) {
            await sendLocation(fallbackCoordsRef.current);
          }
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 0, 
          timeout: 10000 
        }
      );
    };

    startTracking();

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [driverId]); // Only re-run when the driverId changes
}