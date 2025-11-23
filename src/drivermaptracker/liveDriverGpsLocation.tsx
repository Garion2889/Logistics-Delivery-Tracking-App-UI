import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase/client";

export function useDriverLiveLocation(driverId: string) {
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!driverId) return;

    // Fetch initial location
    const fetchLocation = async () => {
      const { data } = await supabase
        .from("driver_locations")
        .select("latitude, longitude")
        .eq("driver_id", driverId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.latitude && data?.longitude) {
        setLocation([data.latitude, data.longitude]);
      }
    };

    fetchLocation();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("driver-location-" + driverId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "driver_locations",
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const { latitude, longitude } = payload.new;
          if (latitude && longitude) {
            setLocation([latitude, longitude]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  return location;
}
