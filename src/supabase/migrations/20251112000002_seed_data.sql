-- Seed data for testing
-- Note: This creates test users. In production, use Supabase Auth signup

-- Insert admin user (placeholder - will be created via Supabase Auth)
-- Password for testing: admin123
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@smartstock.ph',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, full_name, role, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin',
  '+63 912 000 0001'
) ON CONFLICT (id) DO NOTHING;

-- Insert driver users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    'pedro@smartstock.ph',
    crypt('driver123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'carlos@smartstock.ph',
    crypt('driver123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, full_name, role, phone)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    'Pedro Reyes',
    'driver',
    '+63 912 111 2222'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Carlos Mendoza',
    'driver',
    '+63 912 333 4444'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert drivers
INSERT INTO drivers (id, user_id, vehicle_type, plate_number, status, last_lat, last_lng)
VALUES 
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Motorcycle',
    'ABC-1234',
    'online',
    14.5995,
    120.9842
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'Van',
    'XYZ-5678',
    'online',
    14.5547,
    121.0244
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample deliveries
INSERT INTO deliveries (id, ref_no, customer_name, customer_phone, address, payment_type, total_amount, status, assigned_driver)
VALUES 
  (
    '20000000-0000-0000-0000-000000000001',
    'REF-001',
    'Maria Santos',
    '+63 912 345 6789',
    '123 Rizal St, Makati City, Metro Manila',
    'cod',
    2500.00,
    'created',
    NULL
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'REF-002',
    'Juan Dela Cruz',
    '+63 912 456 7890',
    '456 Bonifacio Ave, Taguig City, Metro Manila',
    'gcash',
    3200.00,
    'dispatched',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'REF-003',
    'Ana Mercado',
    '+63 912 567 8901',
    '789 EDSA, Quezon City, Metro Manila',
    'cod',
    1800.00,
    'in_transit',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'REF-004',
    'Jose Garcia',
    '+63 912 678 9012',
    '321 Ortigas Ave, Pasig City, Metro Manila',
    'paid',
    4500.00,
    'delivered',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'REF-005',
    'Rosa Torres',
    '+63 912 789 0123',
    '654 Shaw Blvd, Mandaluyong City, Metro Manila',
    'cod',
    2100.00,
    'created',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Note: delivery_history will be automatically created by the trigger
