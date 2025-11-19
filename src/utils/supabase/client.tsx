// client.tsx
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

if (!projectId || !publicAnonKey) {
  throw new Error(
    "Supabase projectId or publicAnonKey is missing. Check info.tsx."
  );
}

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
