# Movie Booking API - Complete Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 Register User
**POST** `/auth/register`

**Access:** Public

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "user" // optional, defaults to "user"
}
```

**Response (201):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 1.2 Login User
**POST** `/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

### 1.3 Get Current User
**GET** `/auth/me`

**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "user"
    }
  }
}
```

### 1.4 Update User Details
**PUT** `/auth/updatedetails`

**Access:** Private

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "johnupdated@example.com",
  "phone": "+9876543210"
}
```

### 1.5 Update Password
**PUT** `/auth/updatepassword`

**Access:** Private

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

---

## 2. Movie Endpoints

### 2.1 Get All Movies
**GET** `/movies`

**Access:** Public

**Query Parameters:**
- `genre` - Filter by genre (e.g., `?genre=Action`)
- `language` - Filter by language
- `rating[gte]` - Filter by minimum rating (e.g., `?rating[gte]=8`)
- `sort` - Sort results (e.g., `?sort=-rating,releaseDate`)
- `fields` - Limit fields (e.g., `?fields=title,duration,rating`)
- `page` - Page number (e.g., `?page=2`)
- `limit` - Results per page (e.g., `?limit=10`)

**Example Request:**
```
GET /movies?genre=Action&rating[gte]=8&sort=-rating&limit=10
```

**Response (200):**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "movies": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "title": "Inception",
        "description": "A thief who steals corporate secrets...",
        "duration": 148,
        "genre": ["Action", "Sci-Fi", "Thriller"],
        "releaseDate": "2010-07-16T00:00:00.000Z",
        "director": "Christopher Nolan",
        "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
        "language": "English",
        "rating": 8.8,
        "poster": "https://example.com/inception-poster.jpg",
        "trailer": "https://example.com/inception-trailer.mp4",
        "isActive": true
      }
    ]
  }
}
```

### 2.2 Get Single Movie
**GET** `/movies/:id`

**Access:** Public

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "movie": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Inception",
      "description": "A thief who steals corporate secrets...",
      "duration": 148,
      "genre": ["Action", "Sci-Fi", "Thriller"],
      "releaseDate": "2010-07-16T00:00:00.000Z",
      "director": "Christopher Nolan",
      "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
      "language": "English",
      "rating": 8.8,
      "poster": "https://example.com/inception-poster.jpg"
    }
  }
}
```

### 2.3 Get Movie Showtimes
**GET** `/movies/:id/showtimes`

**Access:** Public

**Response (200):**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "showtimes": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "movie": "64f8a1b2c3d4e5f6a7b8c9d0",
        "theater": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
          "name": "Cineplex Downtown",
          "location": {
            "city": "New York"
          }
        },
        "screen": "Screen 1",
        "startTime": "2024-01-15T18:00:00.000Z",
        "endTime": "2024-01-15T20:28:00.000Z",
        "price": 12,
        "availableSeats": 150
      }
    ]
  }
}
```

### 2.4 Create Movie
**POST** `/movies`

**Access:** Private/Admin

**Request Body:**
```json
{
  "title": "New Movie",
  "description": "Movie description here",
  "duration": 120,
  "genre": ["Action", "Drama"],
  "releaseDate": "2024-01-01",
  "director": "Director Name",
  "cast": ["Actor 1", "Actor 2"],
  "language": "English",
  "rating": 8.0,
  "poster": "https://example.com/poster.jpg",
  "trailer": "https://example.com/trailer.mp4"
}
```

### 2.5 Update Movie
**PATCH** `/movies/:id`

**Access:** Private/Admin

**Request Body:** (any fields to update)
```json
{
  "rating": 8.5,
  "isActive": true
}
```

### 2.6 Delete Movie
**DELETE** `/movies/:id`

**Access:** Private/Admin

**Response (204):** No content

---

## 3. Theater Endpoints

### 3.1 Get All Theaters
**GET** `/theaters`

**Access:** Public

**Query Parameters:** Same as movies (filter, sort, paginate)

**Response (200):**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "theaters": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Cineplex Downtown",
        "location": {
          "type": "Point",
          "coordinates": [-73.935242, 40.73061],
          "address": "123 Main St, New York, NY 10001",
          "description": "Downtown location"
        },
        "city": "New York",
        "screens": [
          {
            "name": "Screen 1",
            "capacity": 150,
            "seatLayout": [[15, 15, 15, 15, 15]]
          }
        ],
        "facilities": ["Parking", "Food Court", "3D", "IMAX"],
        "contact": {
          "phone": "+1234567890",
          "email": "downtown@cineplex.com"
        }
      }
    ]
  }
}
```

### 3.2 Get Single Theater
**GET** `/theaters/:id`

**Access:** Public

### 3.3 Get Theater Showtimes
**GET** `/theaters/:id/showtimes`

**Access:** Public

### 3.4 Get Nearby Theaters
**GET** `/theaters/nearby`

**Access:** Public

**Query Parameters:**
- `lat` - Latitude (required)
- `lng` - Longitude (required)
- `distance` - Distance in km or miles (required)
- `unit` - Unit of distance: 'km' or 'mi' (default: 'km')

**Example:**
```
GET /theaters/nearby?lat=40.7306&lng=-73.9352&distance=5&unit=km
```

### 3.5 Create Theater
**POST** `/theaters`

**Access:** Private/Admin

**Request Body:**
```json
{
  "name": "New Theater",
  "location": {
    "coordinates": [-73.935242, 40.73061],
    "address": "123 Main St, New York, NY",
    "description": "Downtown location"
  },
  "city": "New York",
  "screens": [
    {
      "name": "Screen 1",
      "capacity": 150,
      "seatLayout": [[15, 15, 15, 15, 15]]
    }
  ],
  "facilities": ["Parking", "Food Court"],
  "contact": {
    "phone": "+1234567890",
    "email": "info@theater.com"
  }
}
```

### 3.6 Update Theater
**PATCH** `/theaters/:id`

**Access:** Private/Admin

### 3.7 Delete Theater
**DELETE** `/theaters/:id`

**Access:** Private/Admin

---

## 4. Showtime Endpoints

### 4.1 Get All Showtimes
**GET** `/showtimes`

**Access:** Public

**Response (200):**
```json
{
  "status": "success",
  "results": 10,
  "data": {
    "showtimes": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "movie": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "title": "Inception",
          "duration": 148,
          "poster": "https://example.com/poster.jpg"
        },
        "theater": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
          "name": "Cineplex Downtown",
          "location": {
            "city": "New York"
          }
        },
        "screen": "Screen 1",
        "startTime": "2024-01-15T18:00:00.000Z",
        "endTime": "2024-01-15T20:28:00.000Z",
        "price": 12,
        "availableSeats": 150
      }
    ]
  }
}
```

### 4.2 Get Single Showtime
**GET** `/showtimes/:id`

**Access:** Public

### 4.3 Get Available Seats
**GET** `/showtimes/:id/seats`

**Access:** Public

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "showtime": "64f8a1b2c3d4e5f6a7b8c9d3",
    "screen": "Screen 1",
    "totalSeats": 150,
    "availableSeats": 145,
    "seatMap": [
      [
        { "row": 0, "seat": 0, "status": "available", "price": 12 },
        { "row": 0, "seat": 1, "status": "booked", "price": 12 },
        { "row": 0, "seat": 2, "status": "available", "price": 12 }
      ]
    ]
  }
}
```

### 4.4 Create Showtime
**POST** `/showtimes`

**Access:** Private/Admin

**Request Body:**
```json
{
  "movie": "64f8a1b2c3d4e5f6a7b8c9d0",
  "theater": "64f8a1b2c3d4e5f6a7b8c9d2",
  "screen": "Screen 1",
  "startTime": "2024-01-15T18:00:00.000Z",
  "endTime": "2024-01-15T20:28:00.000Z",
  "price": 12
}
```

### 4.5 Update Showtime
**PATCH** `/showtimes/:id`

**Access:** Private/Admin

### 4.6 Delete Showtime
**DELETE** `/showtimes/:id`

**Access:** Private/Admin

---

## 5. Booking Endpoints

### 5.1 Get All Bookings
**GET** `/bookings`

**Access:** Private/Admin

### 5.2 Get My Bookings
**GET** `/bookings/my-bookings`

**Access:** Private

**Response (200):**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "bookings": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "user": "64f8a1b2c3d4e5f6a7b8c9d0",
        "showtime": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
          "movie": {
            "title": "Inception",
            "poster": "https://example.com/poster.jpg"
          },
          "theater": {
            "name": "Cineplex Downtown"
          },
          "startTime": "2024-01-15T18:00:00.000Z"
        },
        "seats": [
          { "row": 5, "seat": 10, "price": 12 },
          { "row": 5, "seat": 11, "price": 12 }
        ],
        "totalAmount": 24,
        "paymentStatus": "paid",
        "paymentMethod": "credit_card",
        "bookingDate": "2024-01-10T10:00:00.000Z"
      }
    ]
  }
}
```

### 5.3 Get Single Booking
**GET** `/bookings/:id`

**Access:** Private (Owner or Admin)

### 5.4 Create Booking
**POST** `/bookings`

**Access:** Private

**Request Body:**
```json
{
  "showtime": "64f8a1b2c3d4e5f6a7b8c9d3",
  "seats": [
    { "row": 5, "seat": 10 },
    { "row": 5, "seat": 11 }
  ],
  "paymentMethod": "credit_card"
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "booking": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "user": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "showtime": {
        "movie": {
          "title": "Inception"
        },
        "theater": {
          "name": "Cineplex Downtown"
        },
        "startTime": "2024-01-15T18:00:00.000Z"
      },
      "seats": [
        { "row": 5, "seat": 10, "price": 12 },
        { "row": 5, "seat": 11, "price": 12 }
      ],
      "totalAmount": 24,
      "paymentStatus": "pending",
      "paymentMethod": "credit_card"
    }
  }
}
```

### 5.5 Update Payment Status
**PATCH** `/bookings/:id/payment`

**Access:** Private (Owner or Admin)

**Request Body:**
```json
{
  "paymentStatus": "paid",
  "paymentId": "pay_abc123xyz"
}
```

### 5.6 Cancel Booking
**DELETE** `/bookings/:id`

**Access:** Private (Owner or Admin)

**Note:** Bookings can only be cancelled at least 2 hours before showtime.

**Response (200):**
```json
{
  "status": "success",
  "message": "Booking cancelled successfully",
  "data": {
    "booking": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "paymentStatus": "cancelled"
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "status": "fail",
  "message": "Invalid input data. Please provide valid information."
}
```

### 401 Unauthorized
```json
{
  "status": "fail",
  "message": "You are not logged in! Please log in to get access."
}
```

### 403 Forbidden
```json
{
  "status": "fail",
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "status": "fail",
  "message": "No resource found with that ID"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Something went very wrong!"
}
```

---

## Payment Status Values
- `pending` - Payment not yet completed
- `paid` - Payment successful
- `failed` - Payment failed
- `cancelled` - Booking cancelled by user
- `refunded` - Payment refunded

## Payment Methods
- `credit_card`
- `debit_card`
- `net_banking`
- `upi`
- `wallet`

---

## Notes

1. All timestamps are in ISO 8601 format
2. Dates should be provided in ISO format: `YYYY-MM-DDTHH:mm:ss.sssZ`
3. Coordinates are in [longitude, latitude] format
4. Seat layout is a 2D array where each element represents the number of seats in that section
5. Pagination defaults: page=1, limit=100
6. Sort format: `-field` for descending, `field` for ascending
