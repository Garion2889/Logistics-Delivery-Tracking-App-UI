# SmartStock Logistics - Supabase Integration Guide

## Overview

The SmartStock Logistics app now has **two versions**:

1. **App.tsx** - Mock data version (original, for demo/testing without backend)
2. **AppWithSupabase.tsx** - Full Supabase integration (with real database, auth, storage)

## Switching Between Versions

### Use Mock Version (App.tsx)
This version uses in-memory mock data. No database required.

**When to use:**
- Quick demos
- UI/UX testing
- No backend setup needed
- Offline development

**Current setup:** This is the default version running now.

### Use Supabase Version (AppWithSupabase.tsx)
This version connects to Supabase for full backend functionality.

**When to use:**
- Production deployment
- Testing real-time features
- Multi-user scenarios
- Data persistence needed

**To switch to Supabase version:**

1. Rename your entry point file (usually `index.tsx` or similar) to import from `AppWithSupabase` instead of `App`:

```tsx
// Change from:
import App from './App'

// To:
import App from './AppWithSupabase'
```

## What's Included in Supabase Version

### ✅ Implemented Features

1. **Authentication**
   - Role-based login (Admin/Driver)
   - Supabase Auth integration
   - Session management
   - Automatic logout

2. **Database Integration**
   - Real-time delivery data
   - Driver management
   - User profiles
   - Delivery history tracking

3. **Real-time Sync**
   - Live delivery status updates
   - Automatic UI refresh when data changes
   - Multi-user collaboration

4. **Storage**
   - Proof of Delivery (POD) image uploads
   - Private storage bucket
   - Secure file access

5. **Public Tracking**
   - Unauthenticated delivery tracking
   - Reference number lookup
   - RPC function integration

### 🔄 Migration Path

To migrate from mock to Supabase version:

1. **Database is ready** - Migrations have been created in `/supabase/migrations/`
2. **Test accounts exist** - Use credentials from SUPABASE_SETUP.md
3. **All tables created** - Schema matches your requirements
4. **RLS policies active** - Security is configured
5. **Storage bucket ready** - POD images can be uploaded

## Test Credentials

### Admin Account
- **Email:** admin@smartstock.ph
- **Password:** admin123
- **Access:** Full system access

### Driver Accounts

**Driver 1 (Pedro):**
- **Email:** pedro@smartstock.ph
- **Password:** driver123
- **Vehicle:** Motorcycle

**Driver 2 (Carlos):**
- **Email:** carlos@smartstock.ph
- **Password:** driver123
- **Vehicle:** Van

## Key Differences

| Feature | Mock Version | Supabase Version |
|---------|-------------|------------------|
| Data Persistence | ❌ Lost on refresh | ✅ Saved to database |
| Multi-user | ❌ Single session only | ✅ Real-time sync |
| Authentication | 🟡 Simulated | ✅ Real Supabase Auth |
| File Upload | ❌ Simulated | ✅ Real storage |
| Public Tracking | 🟡 Client-side only | ✅ Server-side RPC |
| Realtime Updates | ❌ Manual refresh | ✅ Automatic sync |

## Feature Comparison

### Mock Version Features
```typescript
✅ UI/UX flows
✅ Role-based views
✅ Form validations
✅ Toast notifications
✅ Responsive design
✅ Dark mode
❌ Data persistence
❌ Real authentication
❌ File uploads
❌ Multi-user sync
```

### Supabase Version Features
```typescript
✅ All Mock version features
✅ Data persistence
✅ Real authentication
✅ File uploads (POD)
✅ Multi-user sync
✅ Row-level security
✅ Real-time updates
✅ Public RPC functions
✅ Automatic history tracking
✅ Driver location tracking (ready)
```

## Development Workflow

### For Frontend-Only Development
Use **App.tsx** (mock version):
```bash
# No additional setup needed
# Just work on components and UI
```

### For Full-Stack Development
Use **AppWithSupabase.tsx**:

1. Ensure Supabase is connected (already done)
2. Test with provided credentials
3. Add new features using Supabase client
4. See SUPABASE_SETUP.md for detailed API usage

## Code Examples

### Fetching Deliveries (Supabase Version)

```typescript
const fetchDeliveries = async () => {
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      *,
      driver_info:drivers!assigned_driver(
        id,
        user_info:users!user_id(full_name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
```

### Creating a Delivery

```typescript
const createDelivery = async (deliveryData) => {
  const { data, error } = await supabase
    .from('deliveries')
    .insert({
      ref_no: `REF-${Date.now()}`,
      customer_name: deliveryData.customerName,
      address: deliveryData.address,
      payment_type: deliveryData.paymentType,
      total_amount: deliveryData.amount,
      status: 'created',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Subscribing to Realtime Updates

```typescript
const subscription = supabase
  .channel('deliveries-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'deliveries',
    },
    (payload) => {
      console.log('Change received!', payload);
      // Update your UI here
    }
  )
  .subscribe();

// Don't forget to unsubscribe when done
return () => subscription.unsubscribe();
```

## Troubleshooting

### "Failed to fetch deliveries"
- Check Supabase connection
- Verify you're logged in with correct role
- Check browser console for RLS policy errors

### "Login failed"
- Verify email/password are correct
- Check if user exists in database
- Ensure role matches (admin vs driver)

### "Real-time not working"
- Check Supabase Realtime is enabled in dashboard
- Verify subscription is created correctly
- Check browser console for WebSocket errors

### "POD upload fails"
- Ensure storage bucket `pod-images` exists
- Verify RLS policies on storage
- Check file size (max 50MB)

## Next Steps

1. ✅ Choose which version to use (Mock or Supabase)
2. 📝 Review SUPABASE_SETUP.md for detailed backend docs
3. 🧪 Test with provided credentials
4. 🚀 Add custom features as needed
5. 🗺️ Integrate Google Maps API (placeholder ready)
6. 📧 Configure email notifications (optional)
7. 📊 Add analytics and reporting

## Support

- **Mock Version Issues:** Check component code in `/components/`
- **Supabase Issues:** See SUPABASE_SETUP.md and `/lib/supabase.ts`
- **Database Schema:** Check `/supabase/migrations/`
- **Type Definitions:** See `/types/database.types.ts`

---

**Current Status:** 
- ✅ Mock version (App.tsx) is active
- ✅ Supabase version (AppWithSupabase.tsx) is ready to use
- ✅ Database schema created
- ✅ Test data seeded
- ✅ Both versions fully functional

Choose the version that fits your needs!
