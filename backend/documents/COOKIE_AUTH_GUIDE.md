# Secure Cookie-Based Authentication Guide

Complete guide for secure cookie-based authentication in the Movie Booking Backend.

---

## 🔐 Overview

The system now supports **secure HTTP-only cookie authentication** in addition to traditional Bearer token authentication. This provides enhanced security for web applications.

---

## 🎯 Key Features

✅ **HTTP-Only Cookies** - Prevents XSS attacks
✅ **Secure Flag** - HTTPS only in production
✅ **SameSite Protection** - CSRF protection
✅ **Dual Authentication** - Supports both cookies and Bearer tokens
✅ **Automatic Cookie Management** - Set on login, cleared on logout
✅ **CORS Configured** - Credentials support enabled

---

## 🔧 Configuration

### Environment Variables

Add to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Cookie Settings

```javascript
{
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  httpOnly: true,        // Cannot be accessed by JavaScript
  secure: production,    // HTTPS only in production
  sameSite: 'strict'     // CSRF protection
}
```

---

## 🚀 How It Works

### Authentication Flow

```
1. User logs in
   ↓
2. Server generates JWT token
   ↓
3. Token sent in TWO ways:
   - HTTP-only cookie (for browsers)
   - Response body (for mobile apps)
   ↓
4. Browser automatically sends cookie with requests
   ↓
5. Server validates token from cookie or header
```

---

## 📊 API Endpoints

### 1. Register (with Cookie)

**POST** `/api/v1/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "endUser"
    }
  }
}
```

**Cookie Set:**
```
Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; 
            Path=/; 
            Expires=Sat, 12 Nov 2024 10:00:00 GMT; 
            HttpOnly; 
            Secure; 
            SameSite=Strict
```

---

### 2. Login (with Cookie)

**POST** `/api/v1/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "endUser"
    }
  }
}
```

**Cookie Set:** Same as register

---

### 3. Logout (Clear Cookie)

**POST** `/api/v1/auth/logout`

**Access:** Private

**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully",
  "data": null
}
```

**Cookie Cleared:**
```
Set-Cookie: token=none; 
            Path=/; 
            Expires=Thu, 01 Jan 1970 00:00:00 GMT; 
            HttpOnly
```

---

### 4. Get Current User (Using Cookie)

**GET** `/api/v1/auth/me`

**Access:** Private

**No Authorization header needed if cookie is set**

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "endUser"
    }
  }
}
```

---

## 🎨 Frontend Integration

### Web Application (Using Cookies)

#### Login
```javascript
// Login with cookies
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // IMPORTANT: Send cookies
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (data.status === 'success') {
    // Cookie is automatically set by browser
    // No need to manually store token
    console.log('Logged in successfully');
  }
};
```

#### Make Authenticated Requests
```javascript
// No need to manually add Authorization header
const getMyBookings = async () => {
  const response = await fetch('http://localhost:3000/api/v1/bookings/my-bookings', {
    credentials: 'include', // IMPORTANT: Send cookies
  });

  const data = await response.json();
  return data.data.bookings;
};
```

#### Logout
```javascript
const logout = async () => {
  const response = await fetch('http://localhost:3000/api/v1/auth/logout', {
    method: 'POST',
    credentials: 'include', // IMPORTANT: Send cookies
  });

  const data = await response.json();
  
  if (data.status === 'success') {
    // Cookie is automatically cleared
    console.log('Logged out successfully');
    window.location.href = '/login';
  }
};
```

---

### React Example

```javascript
import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.data.user);
        }
      } catch (error) {
        console.error('Not authenticated');
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (email, password) => {
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      setUser(data.data.user);
    }
  };

  const handleLogout = async () => {
    await fetch('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.name}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}
```

---

### Mobile Application (Using Bearer Token)

Mobile apps should use the token from response body:

```javascript
// Login and store token
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (data.status === 'success') {
    // Store token in secure storage
    await AsyncStorage.setItem('token', data.token);
  }
};

// Make authenticated requests
const getMyBookings = async () => {
  const token = await AsyncStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/v1/bookings/my-bookings', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.data.bookings;
};
```

---

## 🔒 Security Features

### 1. HTTP-Only Cookies

**Protection:** XSS (Cross-Site Scripting)

```javascript
httpOnly: true
```

- Cookie cannot be accessed by JavaScript
- Prevents `document.cookie` access
- Protects against XSS attacks

### 2. Secure Flag

**Protection:** Man-in-the-Middle attacks

```javascript
secure: process.env.NODE_ENV === 'production'
```

- Cookie only sent over HTTPS in production
- Prevents interception over HTTP
- Disabled in development for testing

### 3. SameSite Attribute

**Protection:** CSRF (Cross-Site Request Forgery)

```javascript
sameSite: 'strict'
```

- Cookie only sent to same-site requests
- Prevents CSRF attacks
- Blocks third-party cookie usage

### 4. CORS Configuration

**Protection:** Unauthorized origins

```javascript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
})
```

- Only allows specified frontend origin
- Enables credential sharing
- Prevents unauthorized access

---

## 🧪 Testing

### Test with cURL

#### Login with Cookie
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}' \
  -c cookies.txt
```

#### Use Cookie for Authenticated Request
```bash
curl http://localhost:3000/api/v1/auth/me \
  -b cookies.txt
```

#### Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -b cookies.txt
```

---

### Test with Postman

1. **Login:**
   - POST to `/api/v1/auth/login`
   - Check "Cookies" tab to see cookie set

2. **Make Request:**
   - GET to `/api/v1/auth/me`
   - Cookie automatically sent

3. **Logout:**
   - POST to `/api/v1/auth/logout`
   - Cookie cleared

---

### Test with Browser DevTools

1. **Login via fetch:**
```javascript
fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log);
```

2. **Check cookie:**
   - Open DevTools → Application → Cookies
   - See `token` cookie with HttpOnly flag

3. **Make authenticated request:**
```javascript
fetch('http://localhost:3000/api/v1/auth/me', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

---

## 🔄 Authentication Methods Comparison

| Feature | Cookie-Based | Bearer Token |
|---------|-------------|--------------|
| **Storage** | Browser cookie | localStorage/sessionStorage |
| **Security** | HTTP-only, Secure | Vulnerable to XSS |
| **CSRF Protection** | SameSite attribute | Not needed |
| **Mobile Apps** | Not ideal | Perfect |
| **Web Apps** | Perfect | Works but less secure |
| **Auto-send** | Yes | No (manual header) |
| **JavaScript Access** | No | Yes |

---

## 🚀 Production Deployment

### 1. Environment Variables

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=your_very_secure_secret_key
JWT_COOKIE_EXPIRE=30
```

### 2. HTTPS Required

- Cookie `secure` flag automatically enabled in production
- Requires valid SSL certificate
- Use services like Let's Encrypt

### 3. CORS Configuration

```javascript
cors({
  origin: 'https://yourdomain.com',
  credentials: true
})
```

### 4. Cookie Domain (Optional)

For subdomain support:

```javascript
{
  domain: '.yourdomain.com', // Works for all subdomains
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
}
```

---

## 🐛 Troubleshooting

### Issue 1: Cookie Not Being Set

**Cause:** Missing `credentials: 'include'` in fetch

**Solution:**
```javascript
fetch(url, {
  credentials: 'include' // Add this
})
```

### Issue 2: Cookie Not Sent with Requests

**Cause:** CORS not configured properly

**Solution:** Check backend CORS settings:
```javascript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true // Must be true
})
```

### Issue 3: Cookie Works Locally but Not in Production

**Cause:** `secure` flag requires HTTPS

**Solution:** Ensure production uses HTTPS

### Issue 4: "SameSite" Warning

**Cause:** Browser security policy

**Solution:** Already handled with `sameSite: 'strict'`

---

## 📋 Best Practices

### For Web Applications

✅ **Use cookie-based authentication**
✅ **Always set `credentials: 'include'`**
✅ **Don't store token in localStorage**
✅ **Let browser handle cookies**
✅ **Use HTTPS in production**

### For Mobile Applications

✅ **Use Bearer token authentication**
✅ **Store token in secure storage**
✅ **Add token to Authorization header**
✅ **Implement token refresh**
✅ **Clear token on logout**

### For APIs

✅ **Support both authentication methods**
✅ **Check header first, then cookie**
✅ **Set secure flags in production**
✅ **Configure CORS properly**
✅ **Use strong JWT secrets**

---

## 📊 Cookie Attributes Explained

```
Set-Cookie: token=VALUE; Path=/; Expires=DATE; HttpOnly; Secure; SameSite=Strict
```

| Attribute | Purpose | Value |
|-----------|---------|-------|
| **token** | Cookie name | JWT token |
| **Path** | Cookie scope | `/` (entire site) |
| **Expires** | Expiration date | 30 days from now |
| **HttpOnly** | JavaScript access | Blocked |
| **Secure** | HTTPS only | Production only |
| **SameSite** | CSRF protection | Strict |

---

## ✅ Implementation Checklist

- [x] Cookie parser middleware added
- [x] Cookie helper functions created
- [x] Auth controller updated
- [x] Login sets cookie
- [x] Register sets cookie
- [x] Logout clears cookie
- [x] Middleware reads from cookie
- [x] CORS configured for credentials
- [x] Secure flags set properly
- [x] Documentation complete

---

## 🎉 Summary

Your Movie Booking Backend now supports **secure cookie-based authentication** with:

- ✅ HTTP-only cookies for XSS protection
- ✅ Secure flag for HTTPS-only transmission
- ✅ SameSite attribute for CSRF protection
- ✅ Dual authentication support (cookies + Bearer tokens)
- ✅ Automatic cookie management
- ✅ Production-ready security

**Perfect for modern web applications!** 🔐✨

---

**Created**: 2025-10-13
**Status**: ✅ Complete
**Version**: 1.0.0
**Security**: Production-Ready
