# SmartStock Logistics - Supabase Backend Setup

## Overview

This document explains how to set up and use the Supabase backend for SmartStock Logistics.

## Database Schema

### Tables

1. **users** - User profiles linked to Supabase Auth
   - `id` (UUID, PK, references auth.users)
   - `full_name` (text)
   - `role` (text: 'admin' or 'driver')
   - `phone` (text)
   - `created_at` (timestamp)

2. **drivers** - Driver-specific information
   - `id` (UUID, PK)
   - `user_id` (UUID, FK → users.id)
   - `vehicle_type` (text)
   - `plate_number` (text)
   - `status` (text: 'online', 'offline', 'on_delivery')
   - `last_lat`, `last_lng` (float8) - for GPS tracking
   - `created_at` (timestamp)

3. **deliveries** - Delivery records
   - `id` (UUID, PK)
   - `ref_no` (text, unique) - Public tracking number
   - `customer_name`, `customer_phone`, `address` (text)
   - `payment_type` (text: 'cod', 'gcash', 'paid')
   - `total_amount` (numeric)
   - `status` (text: 'created', 'dispatched', 'in_transit', 'delivered', 'returned')
   - `assigned_driver` (UUID, FK → drivers.id)
   - `created_at`, `updated_at` (timestamp)

4. **delivery_history** - Automatic status change tracking
   - `id` (UUID, PK)
   - `delivery_id` (UUID, FK → deliveries.id)
   - `status` (text)
   - `note` (text)
   - `changed_by` (UUID, FK → users.id)
   - `created_at` (timestamp)

5. **pod_images** - Proof of Delivery images
   - `id` (UUID, PK)
   - `delivery_id` (UUID, FK → deliveries.id)
   - `storage_path` (text) - Path in Supabase Storage
   - `uploaded_by` (UUID, FK → users.id)
   - `uploaded_at` (timestamp)

## Storage

### Buckets

- **pod-images** (private) - Stores proof of delivery photos uploaded by drivers

## Row Level Security (RLS)

### Admins can:
- View, create, update, and delete all records
- Manage all deliveries, drivers, and users
- View all POD images

### Drivers can:
- View and update their own profile
- View deliveries assigned to them
- Update status of assigned deliveries
- Upload POD images for assigned deliveries
- Update their own location and status

### Public (unauthenticated):
- Use `track_delivery(ref_no)` RPC to track deliveries by reference number

## Realtime Subscriptions

The app uses Supabase Realtime to sync delivery status changes between Admin and Driver portals in real-time.

### Example Usage:
```typescript
import { subscribeToDeliveries } from './lib/supabase';

// Subscribe to all delivery changes
const subscription = subscribeToDeliveries((payload) => {
  console.log('Delivery updated:', payload);
  // Update your UI here
});

// Unsubscribe when done
subscription.unsubscribe();
```

## RPC Functions

### track_delivery(ref_no_input: text)

Public function that returns delivery information without authentication.

**Returns:**
```json
{
  "ref_no": "REF-001",
  "customer_name": "Maria Santos",
  "address": "123 Rizal St, Makati City",
  "status": "in_transit",
  "payment_type": "cod",
  "total_amount": 2500.00,
  "created_at": "2025-11-12T09:00:00Z",
  "updated_at": "2025-11-12T10:30:00Z",
  "driver": {
    "name": "Pedro Reyes",
    "phone": "+63 912 111 2222",
    "vehicle_type": "Motorcycle",
    "status": "on_delivery",
    "last_lat": 14.5995,
    "last_lng": 120.9842
  },
  "history": [
    {
      "status": "created",
      "note": null,
      "created_at": "2025-11-12T09:00:00Z"
    },
    {
      "status": "dispatched",
      "note": null,
      "created_at": "2025-11-12T10:30:00Z"
    },
    {
      "status": "in_transit",
      "note": null,
      "created_at": "2025-11-12T11:15:00Z"
    }
  ]
}
```

## Setup Instructions

### 1. Environment Variables

The Supabase connection is already configured. The following environment variables are automatically set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 2. Run Migrations

Migrations are automatically applied when you connect to Supabase. The following will be created:
- All database tables with proper relationships
- Row Level Security policies
- Triggers for automatic history tracking
- Storage bucket for POD images
- RPC function for public tracking
- Seed data with test accounts

### 3. Test Accounts

The following test accounts are created with the seed data:

**Admin:**
- Email: `admin@smartstock.ph`
- Password: `admin123`
- Role: Admin

**Drivers:**
- Email: `pedro@smartstock.ph`
- Password: `driver123`
- Role: Driver
- Vehicle: Motorcycle

- Email: `carlos@smartstock.ph`
- Password: `driver123`
- Role: Driver
- Vehicle: Van

**Test Deliveries:**
- REF-001, REF-002, REF-003, REF-004, REF-005

### 4. Usage Examples

#### Sign In
```typescript
import { signIn } from './lib/supabase';

const { user, profile } = await signIn('admin@smartstock.ph', 'admin123');
console.log('Role:', profile.role); // 'admin' or 'driver'
```

#### Create Driver Account (Admin only)
```typescript
import { createDriverAccount } from './lib/supabase';

await createDriverAccount({
  email: 'newdriver@smartstock.ph',
  password: 'secure123',
  full_name: 'New Driver',
  phone: '+63 912 999 9999',
  vehicle_type: 'Motorcycle',
  plate_number: 'NEW-123',
});
```

#### Track Delivery (Public)
```typescript
import { trackDelivery } from './lib/supabase';

const deliveryInfo = await trackDelivery('REF-001');
console.log(deliveryInfo);
```

#### Upload POD Image
```typescript
import { uploadPODImage } from './lib/supabase';

const file = ...; // File from input
await uploadPODImage(file, deliveryId);
```

#### Update Delivery Status
```typescript
import { supabase } from './lib/supabase';

await supabase
  .from('deliveries')
  .update({ status: 'in_transit' })
  .eq('id', deliveryId);

// History is automatically created via trigger
```

#### Update Driver Location
```typescript
import { updateDriverLocation } from './lib/supabase';

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(async (position) => {
    await updateDriverLocation(
      driverId,
      position.coords.latitude,
      position.coords.longitude
    );
  });
}
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Production Deployment**: Figma Make is designed for prototyping. For production use with real customer data and PII, deploy to your own infrastructure.

2. **Password Security**: The seed data includes test passwords. In production:
   - Use strong passwords
   - Enable email confirmation
   - Implement password reset flows
   - Consider adding 2FA

3. **RLS Policies**: All tables have Row Level Security enabled. Verify policies match your business requirements before going to production.

4. **Storage Security**: POD images bucket is private. Access is controlled via RLS policies and signed URLs with 1-hour expiry.

5. **API Keys**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend. Only use `SUPABASE_ANON_KEY`.

## Troubleshooting

### Cannot access data
- Check if RLS policies are correctly set
- Verify user is authenticated
- Check user role matches required permissions

### Realtime not working
- Ensure Realtime is enabled in Supabase dashboard
- Check if subscription channel is properly created
- Verify network connection

### Upload fails
- Check file size limits (max 50MB by default)
- Verify storage policies allow the operation
- Ensure bucket exists and is properly configured

## Next Steps

1. ✅ Database schema created
2. ✅ RLS policies configured
3. ✅ Storage bucket set up
4. ✅ RPC functions defined
5. ✅ Seed data loaded
6. 🔄 Integrate with React components (in progress)
7. 📱 Add real-time sync to UI
8. 📸 Implement POD upload with camera
9. 🗺️ Integrate Google Maps API
10. 📊 Add analytics and reporting

## Support

For Supabase-specific issues, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
