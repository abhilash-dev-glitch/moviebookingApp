# Role-Based Authorization Guide

Complete guide for the three-tier role system in the Movie Booking Backend.

---

## 🎭 Overview

The system implements three distinct roles with different permissions:

1. **endUser** - Regular customers who book tickets
2. **theaterManager** - Manages specific theaters and their showtimes
3. **admin** - Full system access and user management

---

## 👥 Role Descriptions

### 1. End User (endUser)

**Purpose:** Regular customers who use the platform to book movie tickets

**Permissions:**
- ✅ Browse movies, theaters, and showtimes
- ✅ Create bookings
- ✅ Make payments
- ✅ View own bookings
- ✅ Cancel own bookings
- ✅ View own payment history
- ✅ Update own profile

**Restrictions:**
- ❌ Cannot manage movies
- ❌ Cannot manage theaters
- ❌ Cannot manage showtimes
- ❌ Cannot view other users' data
- ❌ Cannot access admin functions

---

### 2. Theater Manager (theaterManager)

**Purpose:** Manages specific theaters and their operations

**Permissions:**
- ✅ View all movies (public)
- ✅ Update assigned theaters
- ✅ Create showtimes for assigned theaters
- ✅ Update showtimes for assigned theaters
- ✅ Delete showtimes for assigned theaters
- ✅ View bookings for their theaters
- ✅ View available seats
- ✅ Update own profile

**Restrictions:**
- ❌ Cannot create new theaters
- ❌ Cannot delete theaters
- ❌ Cannot manage other theaters
- ❌ Cannot create/edit/delete movies
- ❌ Cannot manage users
- ❌ Cannot access admin functions
- ❌ Cannot view system-wide reports

**Special Features:**
- Assigned specific theaters by admin
- Can manage multiple theaters
- Real-time access to theater operations

---

### 3. Admin (admin)

**Purpose:** Full system administration and management

**Permissions:**
- ✅ **Full access to everything**
- ✅ Create/update/delete movies
- ✅ Create/update/delete theaters
- ✅ Create/update/delete showtimes
- ✅ View all bookings
- ✅ View all payments
- ✅ Create theater managers
- ✅ Assign theaters to managers
- ✅ Update user roles
- ✅ Deactivate/activate users
- ✅ View all system data

---

## 🔐 Permission Matrix

| Feature | endUser | theaterManager | admin |
|---------|---------|----------------|-------|
| **Movies** |
| View movies | ✅ | ✅ | ✅ |
| Create movies | ❌ | ❌ | ✅ |
| Update movies | ❌ | ❌ | ✅ |
| Delete movies | ❌ | ❌ | ✅ |
| **Theaters** |
| View theaters | ✅ | ✅ | ✅ |
| Create theaters | ❌ | ❌ | ✅ |
| Update own theaters | ❌ | ✅ | ✅ |
| Update any theater | ❌ | ❌ | ✅ |
| Delete theaters | ❌ | ❌ | ✅ |
| **Showtimes** |
| View showtimes | ✅ | ✅ | ✅ |
| Create showtimes | ❌ | ✅* | ✅ |
| Update showtimes | ❌ | ✅* | ✅ |
| Delete showtimes | ❌ | ✅* | ✅ |
| **Bookings** |
| Create bookings | ✅ | ✅ | ✅ |
| View own bookings | ✅ | ✅ | ✅ |
| View all bookings | ❌ | ❌ | ✅ |
| Cancel own bookings | ✅ | ✅ | ✅ |
| **Payments** |
| Make payments | ✅ | ✅ | ✅ |
| View own payments | ✅ | ✅ | ✅ |
| View all payments | ❌ | ❌ | ✅ |
| Process refunds | ✅** | ✅** | ✅ |
| **User Management** |
| Update own profile | ✅ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Create theater managers | ❌ | ❌ | ✅ |
| Assign theaters | ❌ | ❌ | ✅ |
| Update user roles | ❌ | ❌ | ✅ |
| Deactivate users | ❌ | ❌ | ✅ |

\* Only for assigned theaters  
\** Only own bookings

---

## 📋 API Endpoints by Role

### End User Endpoints

```bash
# Authentication
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
PUT    /api/v1/auth/updatedetails
PUT    /api/v1/auth/updatepassword

# Browse
GET    /api/v1/movies
GET    /api/v1/movies/:id
GET    /api/v1/theaters
GET    /api/v1/theaters/:id
GET    /api/v1/showtimes
GET    /api/v1/showtimes/:id/seats

# Bookings
POST   /api/v1/bookings
GET    /api/v1/bookings/my-bookings
GET    /api/v1/bookings/:id
DELETE /api/v1/bookings/:id

# Payments
POST   /api/v1/payments/create
POST   /api/v1/payments/verify
GET    /api/v1/payments/my-payments
GET    /api/v1/payments/:id
POST   /api/v1/payments/:id/refund
```

### Theater Manager Endpoints

**All End User endpoints PLUS:**

```bash
# Theater Management
PATCH  /api/v1/theaters/:id              # Only assigned theaters
GET    /api/v1/users/my-theaters

# Showtime Management
POST   /api/v1/showtimes                 # Only for assigned theaters
PATCH  /api/v1/showtimes/:id             # Only for assigned theaters
DELETE /api/v1/showtimes/:id             # Only for assigned theaters
```

### Admin Endpoints

**All previous endpoints PLUS:**

```bash
# Movie Management
POST   /api/v1/movies
PATCH  /api/v1/movies/:id
DELETE /api/v1/movies/:id

# Theater Management
POST   /api/v1/theaters
DELETE /api/v1/theaters/:id

# User Management
GET    /api/v1/users
GET    /api/v1/users/:id
GET    /api/v1/users/theater-managers
POST   /api/v1/users/theater-manager
PATCH  /api/v1/users/:id/role
PATCH  /api/v1/users/:id/assign-theaters
DELETE /api/v1/users/:id/theaters/:theaterId
PATCH  /api/v1/users/:id/deactivate
PATCH  /api/v1/users/:id/activate

# System Access
GET    /api/v1/bookings                  # All bookings
GET    /api/v1/payments                  # All payments
```

---

## 🔧 Implementation Examples

### 1. Register as End User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Customer",
    "email": "customer@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

**Note:** Role defaults to `endUser`

### 2. Create Theater Manager (Admin)

```bash
curl -X POST http://localhost:3000/api/v1/users/theater-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Theater Manager",
    "email": "manager@theater.com",
    "password": "manager123",
    "phone": "+1234567891",
    "managedTheaters": ["THEATER_ID_1", "THEATER_ID_2"]
  }'
```

### 3. Assign Theaters to Manager (Admin)

```bash
curl -X PATCH http://localhost:3000/api/v1/users/USER_ID/assign-theaters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "theaterIds": ["THEATER_ID_1", "THEATER_ID_2"]
  }'
```

### 4. Theater Manager Creates Showtime

```bash
curl -X POST http://localhost:3000/api/v1/showtimes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -d '{
    "movie": "MOVIE_ID",
    "theater": "ASSIGNED_THEATER_ID",
    "screen": "Screen 1",
    "startTime": "2024-12-25T18:00:00Z",
    "endTime": "2024-12-25T20:30:00Z",
    "price": 15
  }'
```

### 5. Update User Role (Admin)

```bash
curl -X PATCH http://localhost:3000/api/v1/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "role": "theaterManager"
  }'
```

### 6. Get My Managed Theaters (Theater Manager)

```bash
curl http://localhost:3000/api/v1/users/my-theaters \
  -H "Authorization: Bearer MANAGER_TOKEN"
```

---

## 🛡️ Security Features

### 1. Role Verification

Every protected route checks:
- User is authenticated (valid JWT token)
- User account is active
- User has required role
- User has specific resource access (for theater managers)

### 2. Theater Access Control

Theater managers can only access theaters assigned to them:

```javascript
// Middleware checks
1. Is user authenticated?
2. Is user a theater manager or admin?
3. Does manager have access to this theater?
4. If yes, proceed; if no, return 403 Forbidden
```

### 3. Showtime Access Control

Theater managers can only manage showtimes for their theaters:

```javascript
// Middleware checks
1. Is user authenticated?
2. Is user a theater manager or admin?
3. Does the showtime belong to manager's theater?
4. If yes, proceed; if no, return 403 Forbidden
```

---

## 🧪 Testing Role-Based Access

### Test 1: End User Cannot Create Movies

```bash
# Login as end user
curl -X POST http://localhost:3000/api/v1/auth/login \
  -d '{"email": "john@example.com", "password": "password123"}'

# Try to create movie (should fail with 403)
curl -X POST http://localhost:3000/api/v1/movies \
  -H "Authorization: Bearer END_USER_TOKEN" \
  -d '{...movie data...}'

# Expected: 403 Forbidden
```

### Test 2: Theater Manager Can Only Update Assigned Theaters

```bash
# Login as theater manager
curl -X POST http://localhost:3000/api/v1/auth/login \
  -d '{"email": "manager@example.com", "password": "manager123456"}'

# Try to update assigned theater (should succeed)
curl -X PATCH http://localhost:3000/api/v1/theaters/ASSIGNED_THEATER_ID \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -d '{...theater data...}'

# Try to update non-assigned theater (should fail with 403)
curl -X PATCH http://localhost:3000/api/v1/theaters/OTHER_THEATER_ID \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -d '{...theater data...}'

# Expected: First succeeds, second returns 403
```

### Test 3: Admin Has Full Access

```bash
# Login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -d '{"email": "admin@example.com", "password": "admin123456"}'

# Can do everything
curl -X POST http://localhost:3000/api/v1/movies \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{...movie data...}'

curl -X POST http://localhost:3000/api/v1/theaters \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{...theater data...}'

# All should succeed
```

---

## 📊 User Model Schema

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: {
    type: String,
    enum: ['endUser', 'admin', 'theaterManager'],
    default: 'endUser'
  },
  phone: String,
  managedTheaters: [ObjectId], // Only for theaterManager
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Role Transition Workflows

### Promote End User to Theater Manager

```bash
# 1. Admin updates role
PATCH /api/v1/users/:id/role
{ "role": "theaterManager" }

# 2. Admin assigns theaters
PATCH /api/v1/users/:id/assign-theaters
{ "theaterIds": ["theater1", "theater2"] }

# 3. User can now manage assigned theaters
```

### Demote Theater Manager to End User

```bash
# 1. Admin removes theaters
PATCH /api/v1/users/:id/assign-theaters
{ "theaterIds": [] }

# 2. Admin updates role
PATCH /api/v1/users/:id/role
{ "role": "endUser" }
```

### Deactivate User

```bash
# Admin deactivates account
PATCH /api/v1/users/:id/deactivate

# User cannot login anymore
# Returns: "Your account has been deactivated"
```

---

## 🚨 Error Responses

### 401 Unauthorized
```json
{
  "status": "fail",
  "message": "You are not logged in! Please log in to get access."
}
```

### 403 Forbidden (Wrong Role)
```json
{
  "status": "fail",
  "message": "You do not have permission to perform this action"
}
```

### 403 Forbidden (No Theater Access)
```json
{
  "status": "fail",
  "message": "You do not have access to manage this theater"
}
```

### 403 Forbidden (Account Deactivated)
```json
{
  "status": "fail",
  "message": "Your account has been deactivated. Please contact support."
}
```

---

## 📈 Best Practices

### For Admins

1. **Create theater managers** for each theater location
2. **Assign specific theaters** to each manager
3. **Monitor activity** through system logs
4. **Deactivate accounts** instead of deleting
5. **Regular audits** of user permissions

### For Theater Managers

1. **Only manage assigned theaters**
2. **Keep showtime schedules** up to date
3. **Monitor seat availability**
4. **Report issues** to admin
5. **Don't share credentials**

### For End Users

1. **Book tickets** in advance
2. **Check cancellation policy** before booking
3. **Keep booking confirmations**
4. **Update profile** information
5. **Contact support** for issues

---

## 🔍 Troubleshooting

### Issue: "You do not have permission"

**Cause:** User doesn't have required role  
**Solution:** Check user role and endpoint requirements

### Issue: "You do not have access to manage this theater"

**Cause:** Theater manager trying to access non-assigned theater  
**Solution:** Admin needs to assign theater to manager

### Issue: "Your account has been deactivated"

**Cause:** Account was deactivated by admin  
**Solution:** Contact support to reactivate

---

## 📝 Sample Credentials (After Seeding)

```
Admin:
  Email: admin@example.com
  Password: admin123456
  Role: admin

End User:
  Email: john@example.com
  Password: password123
  Role: endUser

Theater Manager:
  Email: manager@example.com
  Password: manager123456
  Role: theaterManager
  Assigned: First theater in database
```

---

## ✅ Production Checklist

- [ ] All roles properly configured
- [ ] Theater managers assigned to theaters
- [ ] Access control tested for all roles
- [ ] Error messages are clear
- [ ] Audit logging enabled
- [ ] User deactivation works
- [ ] Role transitions tested
- [ ] Documentation updated

---

**Role-based authorization is complete and production-ready!** 🎭✨
