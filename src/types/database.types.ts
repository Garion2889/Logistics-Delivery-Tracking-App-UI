export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'driver'
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'admin' | 'driver'
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'driver'
          phone?: string | null
          created_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          user_id: string
          vehicle_type: string
          plate_number: string | null
          status: 'online' | 'offline' | 'on_delivery'
          last_lat: number | null
          last_lng: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_type: string
          plate_number?: string | null
          status?: 'online' | 'offline' | 'on_delivery'
          last_lat?: number | null
          last_lng?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_type?: string
          plate_number?: string | null
          status?: 'online' | 'offline' | 'on_delivery'
          last_lat?: number | null
          last_lng?: number | null
          created_at?: string
        }
      }
      deliveries: {
        Row: {
          id: string
          ref_no: string
          customer_name: string
          customer_phone: string | null
          address: string
          payment_type: 'cod' | 'gcash' | 'paid'
          total_amount: number | null
          status: 'created' | 'dispatched' | 'in_transit' | 'delivered' | 'returned'
          assigned_driver: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ref_no: string
          customer_name: string
          customer_phone?: string | null
          address: string
          payment_type: 'cod' | 'gcash' | 'paid'
          total_amount?: number | null
          status?: 'created' | 'dispatched' | 'in_transit' | 'delivered' | 'returned'
          assigned_driver?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ref_no?: string
          customer_name?: string
          customer_phone?: string | null
          address?: string
          payment_type?: 'cod' | 'gcash' | 'paid'
          total_amount?: number | null
          status?: 'created' | 'dispatched' | 'in_transit' | 'delivered' | 'returned'
          assigned_driver?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      delivery_history: {
        Row: {
          id: string
          delivery_id: string
          status: string
          note: string | null
          changed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          delivery_id: string
          status: string
          note?: string | null
          changed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          delivery_id?: string
          status?: string
          note?: string | null
          changed_by?: string | null
          created_at?: string
        }
      }
      pod_images: {
        Row: {
          id: string
          delivery_id: string
          storage_path: string
          uploaded_by: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          delivery_id: string
          storage_path: string
          uploaded_by?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          delivery_id?: string
          storage_path?: string
          uploaded_by?: string | null
          uploaded_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      track_delivery: {
        Args: {
          ref_no_input: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
