-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  plate_number TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'on_delivery')),
  last_lat FLOAT8,
  last_lng FLOAT8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deliveries table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_no TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  address TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cod', 'gcash', 'paid')),
  total_amount NUMERIC(10, 2),
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'dispatched', 'in_transit', 'delivered', 'returned')),
  assigned_driver UUID REFERENCES drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create delivery_history table
CREATE TABLE delivery_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pod_images table
CREATE TABLE pod_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_deliveries_ref_no ON deliveries(ref_no);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_assigned_driver ON deliveries(assigned_driver);
CREATE INDEX idx_delivery_history_delivery_id ON delivery_history(delivery_id);
CREATE INDEX idx_pod_images_delivery_id ON pod_images(delivery_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create delivery history on status change
CREATE OR REPLACE FUNCTION create_delivery_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO delivery_history (delivery_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create history on delivery status change
CREATE TRIGGER track_delivery_status_changes
  AFTER INSERT OR UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION create_delivery_history();

-- RPC function for public tracking (no auth required)
CREATE OR REPLACE FUNCTION track_delivery(ref_no_input TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'ref_no', d.ref_no,
    'customer_name', d.customer_name,
    'address', d.address,
    'status', d.status,
    'payment_type', d.payment_type,
    'total_amount', d.total_amount,
    'created_at', d.created_at,
    'updated_at', d.updated_at,
    'driver', CASE
      WHEN dr.id IS NOT NULL THEN json_build_object(
        'name', u.full_name,
        'phone', u.phone,
        'vehicle_type', dr.vehicle_type,
        'status', dr.status,
        'last_lat', dr.last_lat,
        'last_lng', dr.last_lng
      )
      ELSE NULL
    END,
    'history', (
      SELECT json_agg(
        json_build_object(
          'status', dh.status,
          'note', dh.note,
          'created_at', dh.created_at
        ) ORDER BY dh.created_at ASC
      )
      FROM delivery_history dh
      WHERE dh.delivery_id = d.id
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_images ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
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
