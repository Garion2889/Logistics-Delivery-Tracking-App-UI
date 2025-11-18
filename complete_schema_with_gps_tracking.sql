-- =====================================================
-- Logistics Delivery Tracking System - Complete Schema
-- =====================================================
-- This schema includes all necessary tables for a comprehensive
-- delivery tracking system with real-time GPS tracking capabilities

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE USER MANAGEMENT TABLES
-- =====================================================

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
  phone TEXT,
  email TEXT, -- Redundant with auth.users but useful for queries
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DRIVER MANAGEMENT TABLES
-- =====================================================

-- Create drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('motorcycle', 'car', 'van', 'truck')),
  plate_number TEXT,
  license_number TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'on_delivery', 'maintenance')),
  last_lat FLOAT8,
  last_lng FLOAT8,
  last_location_update TIMESTAMPTZ,
  current_battery_level INTEGER CHECK (current_battery_level >= 0 AND current_battery_level <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REAL-TIME GPS TRACKING TABLES
-- =====================================================

-- GPS tracking table for historical location data
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  accuracy FLOAT8, -- GPS accuracy in meters
  speed FLOAT8, -- Speed in m/s
  heading FLOAT8, -- Direction in degrees (0-360)
  altitude FLOAT8, -- Altitude in meters
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  is_moving BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver activity log for tracking online/offline status
CREATE TABLE driver_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'status_change', 'location_update')),
  old_status TEXT,
  new_status TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DELIVERY MANAGEMENT TABLES
-- =====================================================

-- Create deliveries table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_no TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  address TEXT NOT NULL,
  latitude FLOAT8, -- Delivery location coordinates
  longitude FLOAT8,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cod', 'gcash', 'paid', 'card')),
  total_amount NUMERIC(10, 2),
  delivery_fee NUMERIC(8, 2) DEFAULT 0,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'assigned', 'picked_up', 'in_transit', 'delivered', 'returned', 'cancelled')),
  assigned_driver UUID REFERENCES drivers(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery waypoints for route optimization
CREATE TABLE delivery_waypoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  address TEXT,
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'arrived', 'departed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create delivery_history table
CREATE TABLE delivery_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  latitude FLOAT8, -- Location when status changed
  longitude FLOAT8,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROOF OF DELIVERY TABLES
-- =====================================================

-- Create pod_images table (Proof of Delivery)
CREATE TABLE pod_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  image_type TEXT DEFAULT 'signature' CHECK (image_type IN ('signature', 'package', 'damage', 'location')),
  latitude FLOAT8,
  longitude FLOAT8,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery signatures/receipts
CREATE TABLE delivery_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  recipient_name TEXT,
  recipient_signature TEXT, -- Base64 encoded signature
  recipient_photo_path TEXT, -- Storage path for recipient photo
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION SYSTEM TABLES
-- =====================================================

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('delivery_assigned', 'delivery_completed', 'delivery_delayed', 'driver_offline', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS AND REPORTING TABLES
-- =====================================================

-- Daily delivery statistics
CREATE TABLE daily_delivery_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_deliveries INTEGER DEFAULT 0,
  completed_deliveries INTEGER DEFAULT 0,
  returned_deliveries INTEGER DEFAULT 0,
  cancelled_deliveries INTEGER DEFAULT 0,
  total_revenue NUMERIC(12, 2) DEFAULT 0,
  average_delivery_time INTERVAL,
  on_time_delivery_rate NUMERIC(5, 2), -- Percentage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver performance metrics
CREATE TABLE driver_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  deliveries_completed INTEGER DEFAULT 0,
  deliveries_returned INTEGER DEFAULT 0,
  total_distance_km NUMERIC(8, 2) DEFAULT 0,
  total_time_online INTERVAL,
  average_rating NUMERIC(3, 2),
  customer_satisfaction_score NUMERIC(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core delivery indexes
CREATE INDEX idx_deliveries_ref_no ON deliveries(ref_no);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_assigned_driver ON deliveries(assigned_driver);
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at);
CREATE INDEX idx_deliveries_priority ON deliveries(priority);

-- GPS tracking indexes
CREATE INDEX idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX idx_driver_locations_recorded_at ON driver_locations(recorded_at);
CREATE INDEX idx_driver_locations_lat_lng ON driver_locations(latitude, longitude);

-- Activity log indexes
CREATE INDEX idx_driver_activity_log_driver_id ON driver_activity_log(driver_id);
CREATE INDEX idx_driver_activity_log_created_at ON driver_activity_log(created_at);

-- History indexes
CREATE INDEX idx_delivery_history_delivery_id ON delivery_history(delivery_id);
CREATE INDEX idx_delivery_history_created_at ON delivery_history(created_at);

-- POD indexes
CREATE INDEX idx_pod_images_delivery_id ON pod_images(delivery_id);
CREATE INDEX idx_pod_images_uploaded_at ON pod_images(uploaded_at);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create delivery history on status change
CREATE OR REPLACE FUNCTION create_delivery_history()
RETURNS TRIGGER AS $$
DECLARE
  driver_location RECORD;
BEGIN
  -- Only create history if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    -- Get driver's current location if available
    SELECT latitude, longitude INTO driver_location
    FROM driver_locations
    WHERE driver_id = NEW.assigned_driver
    ORDER BY recorded_at DESC
    LIMIT 1;

    INSERT INTO delivery_history (
      delivery_id,
      old_status,
      new_status,
      changed_by,
      latitude,
      longitude
    ) VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      NEW.status,
      auth.uid(),
      driver_location.latitude,
      driver_location.longitude
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create history on delivery status change
CREATE TRIGGER track_delivery_status_changes
  AFTER INSERT OR UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION create_delivery_history();

-- Function to update driver location
CREATE OR REPLACE FUNCTION update_driver_location(
  driver_uuid UUID,
  lat FLOAT8,
  lng FLOAT8,
  accuracy FLOAT8 DEFAULT NULL,
  speed FLOAT8 DEFAULT NULL,
  heading FLOAT8 DEFAULT NULL,
  altitude FLOAT8 DEFAULT NULL,
  battery INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  is_driver_moving BOOLEAN := false;
  last_location RECORD;
BEGIN
  -- Check if driver is moving (speed > 1 km/h)
  IF speed IS NOT NULL AND speed > 0.2778 THEN -- 1 km/h in m/s
    is_driver_moving := true;
  END IF;

  -- Insert new location record
  INSERT INTO driver_locations (
    driver_id, latitude, longitude, accuracy, speed,
    heading, altitude, battery_level, is_moving
  ) VALUES (
    driver_uuid, lat, lng, accuracy, speed,
    heading, altitude, battery, is_driver_moving
  );

  -- Update driver's last known location
  UPDATE drivers
  SET
    last_lat = lat,
    last_lng = lng,
    last_location_update = NOW()
  WHERE id = driver_uuid;

  -- Log activity if this is the first location update in a while
  SELECT * INTO last_location
  FROM driver_locations
  WHERE driver_id = driver_uuid
  ORDER BY recorded_at DESC
  OFFSET 1
  LIMIT 1;

  -- If no recent location updates, log as location_update activity
  IF last_location IS NULL OR
     EXTRACT(EPOCH FROM (NOW() - last_location.recorded_at)) > 300 THEN -- 5 minutes
    INSERT INTO driver_activity_log (
      driver_id, activity_type, latitude, longitude, notes
    ) VALUES (
      driver_uuid, 'location_update', lat, lng, 'GPS location updated'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 FLOAT8, lng1 FLOAT8, lat2 FLOAT8, lng2 FLOAT8)
RETURNS FLOAT8 AS $$
DECLARE
  dlat FLOAT8;
  dlng FLOAT8;
  a FLOAT8;
  c FLOAT8;
  earth_radius_km FLOAT8 := 6371;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlng := RADIANS(lng2 - lng1);

  a := SIN(dlat/2) * SIN(dlat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dlng/2) * SIN(dlng/2);

  c := 2 * ATAN2(SQRT(a), SQRT(1-a));

  RETURN earth_radius_km * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- RPC FUNCTIONS FOR PUBLIC ACCESS
-- =====================================================

-- RPC function for public tracking (no auth required)
CREATE OR REPLACE FUNCTION track_delivery(ref_no_input TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'ref_no', d.ref_no,
    'customer_name', d.customer_name,
    'customer_phone', d.customer_phone,
    'address', d.address,
    'status', d.status,
    'payment_type', d.payment_type,
    'total_amount', d.total_amount,
    'estimated_delivery_time', d.estimated_delivery_time,
    'created_at', d.created_at,
    'updated_at', d.updated_at,
    'driver', CASE
      WHEN dr.id IS NOT NULL THEN json_build_object(
        'name', u.full_name,
        'phone', u.phone,
        'vehicle_type', dr.vehicle_type,
        'status', dr.status,
        'last_lat', dr.last_lat,
        'last_lng', dr.last_lng,
        'last_location_update', dr.last_location_update
      )
      ELSE NULL
    END,
    'history', (
      SELECT json_agg(
        json_build_object(
          'old_status', dh.old_status,
          'new_status', dh.new_status,
          'changed_at', dh.created_at,
          'latitude', dh.latitude,
          'longitude', dh.longitude,
          'notes', dh.notes
        ) ORDER BY dh.created_at ASC
      )
      FROM delivery_history dh
      WHERE dh.delivery_id = d.id
    ),
    'waypoints', (
      SELECT json_agg(
        json_build_object(
          'sequence', dw.sequence_number,
          'latitude', dw.latitude,
          'longitude', dw.longitude,
          'address', dw.address,
          'status', dw.status,
          'estimated_arrival', dw.estimated_arrival,
          'actual_arrival', dw.actual_arrival
        ) ORDER BY dw.sequence_number ASC
      )
      FROM delivery_waypoints dw
      WHERE dw.delivery_id = d.id
    )
  ) INTO result
  FROM deliveries d
  LEFT JOIN drivers dr ON d.assigned_driver = dr.id
  LEFT JOIN users u ON dr.user_id = u.id
  WHERE d.ref_no = ref_no_input;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Delivery not found';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to get driver locations for real-time tracking
CREATE OR REPLACE FUNCTION get_driver_locations()
RETURNS TABLE(
  driver_id UUID,
  driver_name TEXT,
  vehicle_type TEXT,
  status TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  last_update TIMESTAMPTZ,
  battery_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    u.full_name,
    d.vehicle_type,
    d.status,
    d.last_lat,
    d.last_lng,
    d.last_location_update,
    d.current_battery_level
  FROM drivers d
  JOIN users u ON d.user_id = u.id
  WHERE d.is_active = true
    AND d.last_location_update > NOW() - INTERVAL '30 minutes'; -- Only recent locations
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_delivery_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for drivers table
CREATE POLICY "Drivers can view their own profile"
  ON drivers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND id = drivers.user_id
    )
  );

CREATE POLICY "Admins can view all drivers"
  ON drivers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage drivers"
  ON drivers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Drivers can update their own status and location"
  ON drivers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND id = drivers.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND id = drivers.user_id
    )
  );

-- RLS Policies for driver_locations table
CREATE POLICY "Drivers can insert their own locations"
  ON driver_locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers WHERE id = driver_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view their own locations"
  ON driver_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM drivers WHERE id = driver_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all driver locations"
  ON driver_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for deliveries table
CREATE POLICY "Admins can view all deliveries"
  ON deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Drivers can view assigned deliveries"
  ON deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM drivers d
      INNER JOIN users u ON d.user_id = u.id
      WHERE u.id = auth.uid() AND d.id = deliveries.assigned_driver
    )
  );

CREATE POLICY "Admins can manage deliveries"
  ON deliveries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Drivers can update assigned deliveries"
  ON deliveries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM drivers d
      INNER JOIN users u ON d.user_id = u.id
      WHERE u.id = auth.uid() AND d.id = deliveries.assigned_driver
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers d
      INNER JOIN users u ON d.user_id = u.id
      WHERE u.id = auth.uid() AND d.id = deliveries.assigned_driver
    )
  );

-- RLS Policies for delivery_history table
CREATE POLICY "Admins can view all history"
  ON delivery_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Drivers can view history for assigned deliveries"
  ON delivery_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      INNER JOIN drivers dr ON d.assigned_driver = dr.id
      INNER JOIN users u ON dr.user_id = u.id
      WHERE u.id = auth.uid() AND d.id = delivery_history.delivery_id
    )
  );

CREATE POLICY "System can insert history"
  ON delivery_history FOR INSERT
  WITH CHECK (true);

-- RLS Policies for pod_images table
CREATE POLICY "Admins can view all POD images"
  ON pod_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Drivers can view POD for assigned deliveries"
  ON pod_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      INNER JOIN drivers dr ON d.assigned_driver = dr.id
      INNER JOIN users u ON dr.user_id = u.id
      WHERE u.id = auth.uid() AND d.id = pod_images.delivery_id
    )
  );

CREATE POLICY "Drivers can upload POD for assigned deliveries"
  ON pod_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deliveries d
      INNER JOIN drivers dr ON d.assigned_driver = dr.id
      INNER JOIN users u ON dr.user_id = u.id
      WHERE u.id = auth.uid() AND d.id = pod_images.delivery_id
    )
  );

CREATE POLICY "Admins can manage POD images"
  ON pod_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for analytics tables (admin only)
CREATE POLICY "Admins can view delivery stats"
  ON daily_delivery_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view driver performance"
  ON driver_performance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- INITIAL DATA SEEDING (Optional)
-- =====================================================

-- Insert sample admin user (you would typically create this through Supabase Auth)
-- Note: This would need to be done after setting up authentication

-- Insert sample delivery statuses for reference
-- This is handled by the CHECK constraints, but good to document

COMMENT ON TABLE users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE drivers IS 'Driver profiles with vehicle and status information';
COMMENT ON TABLE driver_locations IS 'Historical GPS location data for drivers';
COMMENT ON TABLE driver_activity_log IS 'Activity log for driver status changes';
COMMENT ON TABLE deliveries IS 'Core delivery orders with customer and logistics information';
COMMENT ON TABLE delivery_waypoints IS 'Route waypoints for delivery optimization';
COMMENT ON TABLE delivery_history IS 'Audit trail of delivery status changes';
COMMENT ON TABLE pod_images IS 'Proof of delivery images and documents';
COMMENT ON TABLE delivery_receipts IS 'Digital signatures and delivery confirmations';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE daily_delivery_stats IS 'Aggregated daily delivery statistics';
COMMENT ON TABLE driver_performance IS 'Driver performance metrics and analytics';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
