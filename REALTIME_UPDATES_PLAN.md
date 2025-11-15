# 🔄 Real-Time WebSocket Updates Implementation Plan

## ✅ Completed
- [x] AdminDashboard - Already has WebSocket for real-time stats
- [x] Created reusable `useWebSocket` hook

## 📋 Pages to Implement

### Admin Pages
1. **Shows** (`/admin/shows`)
   - Listen for: `NEW_SHOW`, `SHOW_UPDATED`, `SHOW_DELETED`
   - Action: Refresh show list

2. **Bookings** (`/admin/bookings`)
   - Listen for: `NEW_BOOKING`, `BOOKING_PAID`, `BOOKING_CANCELLED`
   - Action: Refresh booking list, update counts

3. **Users** (`/admin/users`)
   - Listen for: `NEW_USER`, `USER_UPDATED`
   - Action: Refresh user list

4. **Movies** (`/admin/movies`)
   - Listen for: `NEW_MOVIE`, `MOVIE_UPDATED`, `MOVIE_DELETED`
   - Action: Refresh movie list

5. **Theaters** (`/admin/theaters`)
   - Listen for: `NEW_THEATER`, `THEATER_UPDATED`, `THEATER_DELETED`
   - Action: Refresh theater list

6. **Managers** (`/admin/managers`)
   - Listen for: `MANAGER_ASSIGNED`, `MANAGER_REMOVED`
   - Action: Refresh manager list

7. **Cancellations** (`/admin/cancellations`)
   - Listen for: `BOOKING_CANCELLED`
   - Action: Refresh cancellation list

### Manager Pages
1. **ManagerDashboard** (`/manager`)
   - Listen for: `NEW_BOOKING`, `BOOKING_CANCELLED`, `NEW_SHOW`
   - Action: Refresh stats and recent bookings

2. **ManageShows** (`/manager/shows`)
   - Listen for: `NEW_SHOW`, `SHOW_UPDATED`, `SHOW_DELETED`
   - Action: Refresh show list (filtered by manager's theaters)

3. **ManageBookings** (`/manager/bookings`)
   - Listen for: `NEW_BOOKING`, `BOOKING_PAID`, `BOOKING_CANCELLED`
   - Action: Refresh booking list (filtered by manager's theaters)

4. **ManageCancellations** (`/manager/cancellations`)
   - Listen for: `BOOKING_CANCELLED`
   - Action: Refresh cancellation list

## 🎯 Implementation Strategy

### Phase 1: High Priority (User-Facing)
- Bookings pages (Admin & Manager)
- Shows pages (Admin & Manager)
- Dashboards (already done for Admin)

### Phase 2: Medium Priority
- Cancellations pages
- Manager Dashboard

### Phase 3: Low Priority
- Users, Movies, Theaters, Managers pages

## 📝 Implementation Pattern

For each page:

```javascript
import { useWebSocket } from '../../hooks/useWebSocket';

// Inside component
const handleWebSocketMessage = (message) => {
  switch (message.type) {
    case 'NEW_BOOKING':
      // Refresh data or update state
      fetchData();
      toast.info('New booking received!');
      break;
    case 'BOOKING_CANCELLED':
      // Update state
      fetchData();
      break;
    // ... other cases
  }
};

useWebSocket(handleWebSocketMessage, []);
```

## 🔔 Toast Notifications

Show toast notifications for:
- ✅ New bookings
- ⚠️  Cancellations
- 📝 Updates to current view
- ❌ Deletions

## 🎨 Visual Indicators

Add visual feedback:
- Pulse animation on new items
- Badge with "New" label
- Highlight row briefly
- Update counters in real-time

## ⚡ Performance Considerations

- Debounce rapid updates (max 1 refresh per 2 seconds)
- Only refresh if page is visible (use Page Visibility API)
- Batch multiple updates together
- Use optimistic UI updates where possible

## 🧪 Testing Checklist

For each page:
- [ ] WebSocket connects successfully
- [ ] Receives relevant messages
- [ ] Updates UI correctly
- [ ] Shows toast notifications
- [ ] Handles disconnection gracefully
- [ ] Reconnects automatically
- [ ] No memory leaks on unmount

## 📊 Backend Events to Emit

Ensure backend emits these WebSocket events:
- `NEW_USER` - When user signs up
- `NEW_BOOKING` - When booking is created
- `BOOKING_PAID` - When payment is confirmed
- `BOOKING_CANCELLED` - When booking is cancelled
- `NEW_SHOW` - When show is created
- `SHOW_UPDATED` - When show is updated
- `SHOW_DELETED` - When show is deleted
- `NEW_MOVIE` - When movie is added
- `MOVIE_UPDATED` - When movie is updated
- `MOVIE_DELETED` - When movie is deleted
- `NEW_THEATER` - When theater is added
- `THEATER_UPDATED` - When theater is updated
- `THEATER_DELETED` - When theater is deleted
- `MANAGER_ASSIGNED` - When manager is assigned to theater
- `MANAGER_REMOVED` - When manager is removed from theater

---

**Status:** Ready to implement
**Priority:** High for booking-related pages
**Estimated Time:** 2-3 hours for all pages
