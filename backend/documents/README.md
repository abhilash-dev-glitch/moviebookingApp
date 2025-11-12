# Movie Ticket Booking Backend API

A comprehensive RESTful API for a movie ticket booking application built with Express.js, MongoDB, and JWT authentication.

> 📚 **New to this project?** Start with [INDEX.md](./INDEX.md) for a complete navigation guide to all documentation.

> 🚀 **Want to get started quickly?** Jump to [QUICK_START.md](./QUICK_START.md) for a 5-minute setup guide.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Secure password hashing with bcrypt
  - User registration and login

- **Movie Management**
  - CRUD operations for movies
  - Movie search and filtering
  - Movie details with cast, director, genre, etc.

- **Theater Management**
  - CRUD operations for theaters
  - Multiple screens per theater
  - Location-based theater search
  - Seat layout management

- **Showtime Management**
  - Create and manage movie showtimes
  - Prevent overlapping showtimes
  - Real-time seat availability

- **Booking System**
  - Book tickets for specific showtimes
  - Seat selection and validation
  - Payment status tracking
  - Booking cancellation with refund logic
  - View booking history

- **Payment Integration** 💳 **NEW**
  - Multiple payment gateways (Stripe, Razorpay, Mock)
  - Secure payment processing
  - Automatic refund handling
  - Webhook support for real-time updates
  - Transaction tracking and history
  - Time-based refund policy

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation
- **Stripe** - Payment gateway (International)
- **Razorpay** - Payment gateway (India)
- **Crypto** - Payment security

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd movie-booking-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory and add:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/movie_booking
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
NODE_ENV=development
```

4. Start MongoDB:
Make sure MongoDB is running on your system.

5. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/register` | Register a new user | Public |
| POST | `/api/v1/auth/login` | Login user | Public |
| GET | `/api/v1/auth/me` | Get current user | Private |
| PUT | `/api/v1/auth/updatedetails` | Update user details | Private |
| PUT | `/api/v1/auth/updatepassword` | Update password | Private |

### Movies

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/movies` | Get all movies | Public |
| GET | `/api/v1/movies/:id` | Get single movie | Public |
| GET | `/api/v1/movies/:id/showtimes` | Get movie showtimes | Public |
| POST | `/api/v1/movies` | Create movie | Admin |
| PATCH | `/api/v1/movies/:id` | Update movie | Admin |
| DELETE | `/api/v1/movies/:id` | Delete movie | Admin |

### Theaters

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/theaters` | Get all theaters | Public |
| GET | `/api/v1/theaters/nearby` | Get nearby theaters | Public |
| GET | `/api/v1/theaters/:id` | Get single theater | Public |
| GET | `/api/v1/theaters/:id/showtimes` | Get theater showtimes | Public |
| POST | `/api/v1/theaters` | Create theater | Admin |
| PATCH | `/api/v1/theaters/:id` | Update theater | Admin |
| DELETE | `/api/v1/theaters/:id` | Delete theater | Admin |

### Showtimes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/showtimes` | Get all showtimes | Public |
| GET | `/api/v1/showtimes/:id` | Get single showtime | Public |
| GET | `/api/v1/showtimes/:id/seats` | Get available seats | Public |
| POST | `/api/v1/showtimes` | Create showtime | Admin |
| PATCH | `/api/v1/showtimes/:id` | Update showtime | Admin |
| DELETE | `/api/v1/showtimes/:id` | Delete showtime | Admin |

### Bookings

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/bookings` | Get all bookings | Admin |
| GET | `/api/v1/bookings/my-bookings` | Get user bookings | Private |
| GET | `/api/v1/bookings/:id` | Get single booking | Private |
| POST | `/api/v1/bookings` | Create booking | Private |
| PATCH | `/api/v1/bookings/:id/payment` | Update payment status | Private |
| DELETE | `/api/v1/bookings/:id` | Cancel booking | Private |

## Request Examples

### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Movie (Admin)
```bash
POST /api/v1/movies
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Inception",
  "description": "A thief who steals corporate secrets...",
  "duration": 148,
  "genre": ["Action", "Sci-Fi", "Thriller"],
  "releaseDate": "2010-07-16",
  "director": "Christopher Nolan",
  "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
  "language": "English",
  "rating": 8.8,
  "poster": "https://example.com/inception-poster.jpg"
}
```

### Create Theater (Admin)
```bash
POST /api/v1/theaters
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Cineplex Downtown",
  "location": {
    "coordinates": [-73.935242, 40.730610],
    "address": "123 Main St, New York, NY",
    "description": "Downtown location"
  },
  "city": "New York",
  "screens": [
    {
      "name": "Screen 1",
      "capacity": 150,
      "seatLayout": [[10, 10, 10, 10, 10]]
    }
  ],
  "facilities": ["Parking", "Food Court", "3D"],
  "contact": {
    "phone": "+1234567890",
    "email": "info@cineplex.com"
  }
}
```

### Create Booking
```bash
POST /api/v1/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "showtime": "64f8a1b2c3d4e5f6a7b8c9d0",
  "seats": [
    { "row": 5, "seat": 10 },
    { "row": 5, "seat": 11 }
  ],
  "paymentMethod": "credit_card"
}
```

## Query Parameters

### Filtering
```bash
GET /api/v1/movies?genre=Action&rating[gte]=8
```

### Sorting
```bash
GET /api/v1/movies?sort=-rating,releaseDate
```

### Field Limiting
```bash
GET /api/v1/movies?fields=title,duration,rating
```

### Pagination
```bash
GET /api/v1/movies?page=2&limit=10
```

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error Response Format:
```json
{
  "status": "fail",
  "message": "Error message here"
}
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- Input validation and sanitization
- MongoDB injection prevention
- CORS enabled

## Project Structure

```
movie-booking-backend/
├── config/
│   ├── db.js              # Database configuration
│   └── jwt.js             # JWT utilities
├── controllers/
│   ├── auth.controller.js
│   ├── booking.controller.js
│   ├── movie.controller.js
│   ├── showtime.controller.js
│   └── theater.controller.js
├── middleware/
│   ├── auth.middleware.js # Authentication & authorization
│   └── error.middleware.js # Error handling
├── models/
│   ├── Booking.js
│   ├── Movie.js
│   ├── Showtime.js
│   ├── Theater.js
│   └── User.js
├── routes/
│   ├── auth.routes.js
│   ├── booking.routes.js
│   ├── movie.routes.js
│   ├── showtime.routes.js
│   └── theater.routes.js
├── utils/
│   ├── apiFeatures.js     # Query features
│   └── appError.js        # Custom error class
├── .env                   # Environment variables
├── app.js                 # Express app setup
├── server.js              # Server entry point
└── package.json
```

## License

ISC

## Author

Your Name

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
