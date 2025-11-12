# Testing Guide

Complete guide to test all endpoints of the Movie Booking API.

## Setup

1. Start MongoDB
2. Run `npm run seed:import` to load sample data
3. Start the server with `npm run dev`

## Test Credentials

After seeding, use these credentials:

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123456`

**Regular User:**
- Email: `john@example.com`
- Password: `password123`

---

## Test Flow

### 1. Authentication Flow

#### Test 1.1: Register New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "testpass123",
    "phone": "+9876543210"
  }'
```

**Expected:** 201 status, user object with token

#### Test 1.2: Register with Existing Email (Should Fail)
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "john@example.com",
    "password": "testpass123",
    "phone": "+9876543210"
  }'
```

**Expected:** 400 status, error message "User already exists"

#### Test 1.3: Login with Valid Credentials
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected:** 200 status, token in response
**Action:** Save the token as `USER_TOKEN`

#### Test 1.4: Login as Admin
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456"
  }'
```

**Expected:** 200 status, token in response
**Action:** Save the token as `ADMIN_TOKEN`

#### Test 1.5: Login with Invalid Credentials (Should Fail)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "wrongpassword"
  }'
```

**Expected:** 401 status, error message

#### Test 1.6: Get Current User Profile
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected:** 200 status, user details

#### Test 1.7: Access Protected Route Without Token (Should Fail)
```bash
curl http://localhost:3000/api/v1/auth/me
```

**Expected:** 401 status, "You are not logged in" message

---

### 2. Movie Endpoints

#### Test 2.1: Get All Movies
```bash
curl http://localhost:3000/api/v1/movies
```

**Expected:** 200 status, array of movies

#### Test 2.2: Filter Movies by Genre
```bash
curl "http://localhost:3000/api/v1/movies?genre=Action"
```

**Expected:** 200 status, filtered movies

#### Test 2.3: Filter Movies by Rating
```bash
curl "http://localhost:3000/api/v1/movies?rating[gte]=8.5"
```

**Expected:** 200 status, movies with rating >= 8.5

#### Test 2.4: Sort Movies by Rating (Descending)
```bash
curl "http://localhost:3000/api/v1/movies?sort=-rating"
```

**Expected:** 200 status, movies sorted by rating (highest first)

#### Test 2.5: Pagination
```bash
curl "http://localhost:3000/api/v1/movies?page=1&limit=2"
```

**Expected:** 200 status, maximum 2 movies

#### Test 2.6: Get Single Movie
```bash
# First, get a movie ID from the list
curl http://localhost:3000/api/v1/movies

# Then use that ID
curl http://localhost:3000/api/v1/movies/MOVIE_ID
```

**Expected:** 200 status, single movie details

#### Test 2.7: Get Movie Showtimes
```bash
curl http://localhost:3000/api/v1/movies/MOVIE_ID/showtimes
```

**Expected:** 200 status, array of showtimes for that movie

#### Test 2.8: Create Movie as User (Should Fail)
```bash
curl -X POST http://localhost:3000/api/v1/movies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "title": "New Movie",
    "description": "Test movie",
    "duration": 120,
    "genre": ["Action"],
    "releaseDate": "2024-06-01",
    "director": "Test Director",
    "cast": ["Actor 1"],
    "language": "English",
    "rating": 7.5,
    "poster": "https://example.com/poster.jpg"
  }'
```

**Expected:** 403 status, "You do not have permission" message

#### Test 2.9: Create Movie as Admin
```bash
curl -X POST http://localhost:3000/api/v1/movies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "Test Movie 2024",
    "description": "A test movie for API testing",
    "duration": 135,
    "genre": ["Drama", "Thriller"],
    "releaseDate": "2024-06-01",
    "director": "Test Director",
    "cast": ["Actor 1", "Actor 2"],
    "language": "English",
    "rating": 7.5,
    "poster": "https://example.com/test-poster.jpg"
  }'
```

**Expected:** 201 status, created movie object
**Action:** Save the movie ID as `NEW_MOVIE_ID`

#### Test 2.10: Update Movie as Admin
```bash
curl -X PATCH http://localhost:3000/api/v1/movies/NEW_MOVIE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "rating": 8.0,
    "isActive": true
  }'
```

**Expected:** 200 status, updated movie

---

### 3. Theater Endpoints

#### Test 3.1: Get All Theaters
```bash
curl http://localhost:3000/api/v1/theaters
```

**Expected:** 200 status, array of theaters

#### Test 3.2: Get Single Theater
```bash
curl http://localhost:3000/api/v1/theaters/THEATER_ID
```

**Expected:** 200 status, theater details with screens

#### Test 3.3: Get Theater Showtimes
```bash
curl http://localhost:3000/api/v1/theaters/THEATER_ID/showtimes
```

**Expected:** 200 status, showtimes for that theater

#### Test 3.4: Get Nearby Theaters
```bash
curl "http://localhost:3000/api/v1/theaters/nearby?lat=40.7306&lng=-73.9352&distance=10&unit=km"
```

**Expected:** 200 status, theaters within 10km

#### Test 3.5: Create Theater as Admin
```bash
curl -X POST http://localhost:3000/api/v1/theaters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Test Theater",
    "location": {
      "coordinates": [-73.935242, 40.73061],
      "address": "789 Test St, New York, NY",
      "description": "Test location"
    },
    "city": "New York",
    "screens": [
      {
        "name": "Screen 1",
        "capacity": 100,
        "seatLayout": [[10, 10, 10, 10, 10, 10, 10, 10, 10, 10]]
      }
    ],
    "facilities": ["Parking", "Food Court"],
    "contact": {
      "phone": "+1234567890",
      "email": "test@theater.com"
    }
  }'
```

**Expected:** 201 status, created theater

---

### 4. Showtime Endpoints

#### Test 4.1: Get All Showtimes
```bash
curl http://localhost:3000/api/v1/showtimes
```

**Expected:** 200 status, array of showtimes with movie and theater details

#### Test 4.2: Get Single Showtime
```bash
curl http://localhost:3000/api/v1/showtimes/SHOWTIME_ID
```

**Expected:** 200 status, showtime details
**Action:** Save a showtime ID as `TEST_SHOWTIME_ID`

#### Test 4.3: Get Available Seats
```bash
curl http://localhost:3000/api/v1/showtimes/TEST_SHOWTIME_ID/seats
```

**Expected:** 200 status, seat map with availability

#### Test 4.4: Create Showtime as Admin
```bash
# Use a future date/time
curl -X POST http://localhost:3000/api/v1/showtimes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "movie": "MOVIE_ID",
    "theater": "THEATER_ID",
    "screen": "Screen 1",
    "startTime": "2024-12-25T18:00:00.000Z",
    "endTime": "2024-12-25T20:30:00.000Z",
    "price": 15
  }'
```

**Expected:** 201 status, created showtime

---

### 5. Booking Endpoints

#### Test 5.1: Create Booking
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "showtime": "TEST_SHOWTIME_ID",
    "seats": [
      { "row": 3, "seat": 5 },
      { "row": 3, "seat": 6 }
    ],
    "paymentMethod": "credit_card"
  }'
```

**Expected:** 201 status, booking details with pending payment
**Action:** Save booking ID as `BOOKING_ID`

#### Test 5.2: Try to Book Same Seats (Should Fail)
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "showtime": "TEST_SHOWTIME_ID",
    "seats": [
      { "row": 3, "seat": 5 }
    ],
    "paymentMethod": "credit_card"
  }'
```

**Expected:** 400 status, "Seat already booked" error

#### Test 5.3: Get My Bookings
```bash
curl http://localhost:3000/api/v1/bookings/my-bookings \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected:** 200 status, array of user's bookings

#### Test 5.4: Get Single Booking
```bash
curl http://localhost:3000/api/v1/bookings/BOOKING_ID \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected:** 200 status, booking details

#### Test 5.5: Update Payment Status
```bash
curl -X PATCH http://localhost:3000/api/v1/bookings/BOOKING_ID/payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "paymentStatus": "paid",
    "paymentId": "pay_test123"
  }'
```

**Expected:** 200 status, updated booking with "paid" status

#### Test 5.6: Cancel Booking
```bash
curl -X DELETE http://localhost:3000/api/v1/bookings/BOOKING_ID \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected:** 200 status, booking cancelled, seats released

#### Test 5.7: Get All Bookings as Admin
```bash
curl http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** 200 status, all bookings in the system

#### Test 5.8: Try to Access Other User's Booking (Should Fail)
```bash
# Login as different user first, then try to access another user's booking
curl http://localhost:3000/api/v1/bookings/OTHER_USER_BOOKING_ID \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected:** 403 status, "You do not have permission" message

---

## Automated Testing Script

Save this as `test.sh` (Linux/Mac) or `test.ps1` (Windows):

### Bash Script (test.sh)
```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

echo "=== Testing Movie Booking API ==="

# Test 1: Health Check
echo -e "\n1. Health Check"
curl -s "$BASE_URL/../health" | jq

# Test 2: Register User
echo -e "\n2. Register User"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auto Test User",
    "email": "autotest@example.com",
    "password": "test123456",
    "phone": "+1234567890"
  }')
echo $REGISTER_RESPONSE | jq
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')

# Test 3: Login
echo -e "\n3. Login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }')
echo $LOGIN_RESPONSE | jq
USER_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

# Test 4: Get Movies
echo -e "\n4. Get All Movies"
curl -s "$BASE_URL/movies" | jq

# Test 5: Get Theaters
echo -e "\n5. Get All Theaters"
curl -s "$BASE_URL/theaters" | jq

# Test 6: Get Showtimes
echo -e "\n6. Get All Showtimes"
curl -s "$BASE_URL/showtimes" | jq

echo -e "\n=== Tests Complete ==="
```

### PowerShell Script (test.ps1)
```powershell
$BASE_URL = "http://localhost:3000/api/v1"

Write-Host "=== Testing Movie Booking API ===" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Health Check" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BASE_URL/../health" -Method Get | ConvertTo-Json

# Test 2: Get Movies
Write-Host "`n2. Get All Movies" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BASE_URL/movies" -Method Get | ConvertTo-Json

# Test 3: Get Theaters
Write-Host "`n3. Get All Theaters" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BASE_URL/theaters" -Method Get | ConvertTo-Json

Write-Host "`n=== Tests Complete ===" -ForegroundColor Green
```

---

## Testing Checklist

- [ ] User registration works
- [ ] User login returns valid JWT token
- [ ] Protected routes require authentication
- [ ] Admin-only routes reject regular users
- [ ] Movies can be filtered and sorted
- [ ] Theaters can be searched by location
- [ ] Showtimes show correct availability
- [ ] Bookings prevent double-booking seats
- [ ] Payment status can be updated
- [ ] Bookings can be cancelled (with time restrictions)
- [ ] Seat availability updates after booking
- [ ] Error messages are clear and helpful

---

## Performance Testing

Test with multiple concurrent requests:

```bash
# Install Apache Bench (ab) or use similar tool
ab -n 100 -c 10 http://localhost:3000/api/v1/movies
```

This sends 100 requests with 10 concurrent connections.

---

## Common Issues

1. **MongoDB Connection Error**: Ensure MongoDB is running
2. **Token Expired**: Login again to get a new token
3. **404 Errors**: Check if you're using correct IDs from seeded data
4. **403 Forbidden**: Ensure you're using admin token for admin routes
5. **Seat Already Booked**: Use different seat numbers or create new showtime

---

## Next Steps

1. Integrate with a frontend application
2. Add payment gateway integration
3. Implement email notifications
4. Add WebSocket for real-time seat updates
5. Create comprehensive unit and integration tests
