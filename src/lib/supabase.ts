import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Helper function to get user profile with role
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

// Helper function to sign in
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Get user profile to check role
  const profile = await getUserProfile(data.user.id);
  
  return { user: data.user, session: data.session, profile };
}

// Helper function to sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Helper function to create driver account (admin only)
export async function createDriverAccount(driverData: {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  plate_number?: string;
}) {
  // First create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: driverData.email,
    password: driverData.password,
    options: {
      data: {
        full_name: driverData.full_name,
        role: 'driver',
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Failed to create user');

  // Create user profile
  const { error: userError } = await supabase.from('users').insert({
    id: authData.user.id,
    full_name: driverData.full_name,
    role: 'driver',
    phone: driverData.phone,
  });

  if (userError) throw userError;

  // Create driver profile
  const { data: driverProfile, error: driverError } = await supabase
    .from('drivers')
    .insert({
      user_id: authData.user.id,
      vehicle_type: driverData.vehicle_type,
      plate_number: driverData.plate_number,
      status: 'offline',
    })
    .select()
    .single();

  if (driverError) throw driverError;

  return { user: authData.user, driver: driverProfile };
}

// Helper function to track delivery (public)
export async function trackDelivery(refNo: string) {
  const { data, error } = await supabase.rpc('track_delivery', {
    ref_no_input: refNo,
  });

  if (error) throw error;
  return data;
}

// Helper function to upload POD image
export async function uploadPODImage(file: File, deliveryId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${deliveryId}-${Date.now()}.${fileExt}`;
  const filePath = `${deliveryId}/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('pod-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Create database record
  const { data, error: dbError } = await supabase
    .from('pod_images')
    .insert({
      delivery_id: deliveryId,
      storage_path: filePath,
    })
    .select()
    .single();

  if (dbError) throw dbError;

  return data;
}

// Helper function to get POD image URL
export async function getPODImageUrl(storagePath: string) {
  const { data } = await supabase.storage
    .from('pod-images')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  return data?.signedUrl;
}

// Helper function to subscribe to delivery updates
export function subscribeToDeliveries(
  callback: (payload: any) => void,
  driverId?: string
) {
  let query = supabase
    .channel('deliveries-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'deliveries',
      },
      callback
    );

  return query.subscribe();
}

// Helper function to update driver location
export async function updateDriverLocation(
  driverId: string,
  lat: number,
  lng: number
) {
  const { error } = await supabase
    .from('drivers')
    .update({
      last_lat: lat,
      last_lng: lng,
    })
    .eq('id', driverId);

  if (error) throw error;
}

// Helper function to update driver status
export async function updateDriverStatus(
  driverId: string,
  status: 'online' | 'offline' | 'on_delivery'
) {
  const { error } = await supabase
    .from('drivers')
    .update({ status })
    .eq('id', driverId);

  if (error) throw error;
}
// Fetch all drivers (join users + drivers tables)
export async function fetchAllDrivers() {
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      id,
      user_id,
      vehicle_type,
      status,
      is_active,
      users (
        id,
        full_name,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((d: any) => ({
    id: d.user_id, // use user_id as the driver id
    name: d.users?.full_name ?? "Unknown",
    email: d.users?.email ?? "",
    phone: d.users?.phone ?? "",
    vehicle: d.vehicle_type ?? "",
    status: d.status ?? "offline",
    activeDeliveries: 0,
  }));
}
