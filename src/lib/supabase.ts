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
  },  
  );

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
      name,              
      vehicle_type,
      status,
      is_active,
      users (
        full_name,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;


  return (data ?? []).map((d: any) => ({
    id: d.id,
    name: d.users?.full_name || d.name || "Unknown",
    email: d.users?.email || "",
    phone: d.users?.phone || "",
    vehicle: d.vehicle_type,
    status: d.status ?? "offline",
    activeDeliveries: 0,
  }));
}

// Order management helper functions
// ============================================
// CREATE ORDER WITH ITEMS
// ============================================
export async function createOrderWithItems(orderData: {
  ref_no: string;
  customer_name: string;
  address: string;
  customer_phone?: string;
  customer_email?: string;
  latitude?: number;
  longitude?: number;
  total_amount?: number;
  delivery_fee?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  items?: Array<{
    product_name: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    weight_kg?: number;
    dimensions?: string;
    notes?: string;
  }>;
}) {
  const { data, error } = await supabase.rpc('create_order_with_items', {
    p_ref_no: orderData.ref_no,
    p_customer_name: orderData.customer_name,
    p_address: orderData.address,
    p_customer_phone: orderData.customer_phone || null,
    p_customer_email: orderData.customer_email || null,
    p_latitude: orderData.latitude || null,
    p_longitude: orderData.longitude || null,
    p_total_amount: orderData.total_amount || null,
    p_delivery_fee: orderData.delivery_fee || 0,
    p_priority: orderData.priority || 'normal',
    p_notes: orderData.notes || null,
    p_items: orderData.items ?? [],
  });

  if (error) throw error;
  return data; // Returns delivery_id (UUID)
}

// ============================================
// UPDATE ORDER STATUS
// ============================================
export async function updateOrderStatus(
  deliveryId: string,
  newStatus: 'created' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'returned' | 'cancelled',
  notes?: string,
  latitude?: number,
  longitude?: number
) {
  const { data, error } = await supabase.rpc('update_order_status', {
    p_delivery_id: deliveryId,
    p_new_status: newStatus,
    p_notes: notes || null,
    p_latitude: latitude || null,
    p_longitude: longitude || null,
  });

  if (error) throw error;
  return data; // Returns true
}

// ============================================
// VALIDATE ORDER
// ============================================
export async function validateOrder(deliveryId: string) {
  const { data, error } = await supabase.rpc('validate_order', {
    p_delivery_id: deliveryId,
  });

  if (error) throw error;
  return data; // Returns { is_valid: boolean, errors: string[] }
}

// ============================================
// GET ORDER PROCESSING STATUS
// ============================================
export async function getOrderProcessingStatus(deliveryId: string) {
  const { data, error } = await supabase.rpc('get_order_processing_status', {
    p_delivery_id: deliveryId,
  });

  if (error) throw error;
  return data; // Returns processing status and milestones
}

// ============================================
// COMPLETE MILESTONE
// ============================================
export async function completeMilestone(
  deliveryId: string,
  milestoneType: string,
  notes?: string
) {
  const { data, error } = await supabase.rpc('complete_milestone', {
    p_delivery_id: deliveryId,
    p_milestone_type: milestoneType,
    p_notes: notes || null,
  });

  if (error) throw error;
  return data; // Returns true
}

// ============================================
// GET ORDER ITEMS
// ============================================
export async function getOrderItems(deliveryId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('delivery_id', deliveryId)
    .order('created_at');

  if (error) throw error;
  return data;
}

// ============================================
// GET ORDER MILESTONES
// ============================================
export async function getOrderMilestones(deliveryId: string) {
  const { data, error } = await supabase
    .from('order_milestones')
    .select('*')
    .eq('delivery_id', deliveryId)
    .order('created_at');

  if (error) throw error;
  return data;
}

// ============================================
// SUBSCRIBE TO ORDER UPDATES (REAL-TIME)
// ============================================
export function subscribeToOrderUpdates(
  deliveryId: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`order-${deliveryId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'deliveries',
        filter: `id=eq.${deliveryId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

// ============================================
// SUBSCRIBE TO MILESTONE UPDATES (REAL-TIME)
// ============================================
export function subscribeToMilestoneUpdates(
  deliveryId: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`milestones-${deliveryId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_milestones',
        filter: `delivery_id=eq.${deliveryId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
}

// ============================================
// GET COMPLETE ORDER WITH DETAILS
// ============================================
export async function getOrderWithDetails(deliveryId: string) {
  // Fetch delivery
  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .select('*')
    .eq('id', deliveryId)
    .single();

  if (deliveryError) throw deliveryError;

  // Fetch items
  const items = await getOrderItems(deliveryId);

  // Fetch milestones
  const milestones = await getOrderMilestones(deliveryId);

  // Fetch processing status
  const processingStatus = await getOrderProcessingStatus(deliveryId);

  return {
    delivery,
    items,
    milestones,
    processingStatus,
  };
}

// ============================================
// RUN AUTO ASSIGN FUNCTION
// ============================================
export async function autoAssignRoutes() {
  const { data, error } = await supabase.functions.invoke(
    "auto-assign-routes",
    {
      method: "POST",
    }
  );

  if (error) throw error;
  return data;
}

