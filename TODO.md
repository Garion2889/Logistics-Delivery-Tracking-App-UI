# Fix OSRM API Timeout in RealTimeTrackingPage.tsx

## Completed Tasks
- [x] Modified auto-assign-routes function to upload estimated_delivery_time to database when assigning deliveries
- [x] Created assign-driver function to handle manual driver assignments with estimated_delivery_time calculation
- [x] Improved assign-driver function with better validation, error handling, and fallback for missing location data

## Pending Tasks
- [x] Add AbortController with 10-second timeout to OSRM fetch in first routing useEffect (~lines 450-520)
- [x] Enhance error handling in first useEffect to detect AbortError (timeout) and fallback to straight line
- [ ] Add AbortController with 10-second timeout to OSRM fetch in second routing useEffect (~lines 520-580)
- [ ] Enhance error handling in second useEffect to detect AbortError and fallback similarly
- [ ] Ensure timeout clearing after successful fetch to avoid memory leaks
- [ ] Test timeout behavior and fallback routing
