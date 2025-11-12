# Quick Start Guide

Get your Movie Booking API up and running in 5 minutes!

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Update the `.env` file with your settings:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/movie_booking
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d
NODE_ENV=development
```

**Important:** Change `JWT_SECRET` to a secure random string in production!

## Step 3: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod
```

## Step 4: Seed Sample Data (Optional)

Load sample movies, theaters, and showtimes:

```bash
npm run seed:import
```

This creates:
- 2 sample users (1 admin, 1 regular user)
- 3 movies
- 2 theaters with multiple screens
- Multiple showtimes

**Sample Credentials:**
- Admin: `admin@example.com` / `admin123456`
- User: `john@example.com` / `password123`

## Step 5: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
MongoDB Connected: localhost
Server running in development mode on port 3000
```

## Step 6: Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Register a New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the token from the response!

### Get All Movies
```bash
curl http://localhost:3000/api/v1/movies
```

### Get All Theaters
```bash
curl http://localhost:3000/api/v1/theaters
```

### Get Showtimes
```bash
curl http://localhost:3000/api/v1/showtimes
```

### Create a Booking (Authenticated)
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "showtime": "SHOWTIME_ID_HERE",
    "seats": [
      { "row": 5, "seat": 10 },
      { "row": 5, "seat": 11 }
    ],
    "paymentMethod": "credit_card"
  }'
```

## Common Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Import sample data
npm run seed:import

# Delete all data
npm run seed:delete
```

## Testing with Postman

1. Import the `postman_collection.json` file into Postman
2. Set the `base_url` variable to `http://localhost:3000/api/v1`
3. Login to get a token
4. Set the `token` variable with your JWT token
5. Start testing all endpoints!

## Project Structure Overview

```
movie-booking-backend/
├── models/          # Database schemas
├── controllers/     # Business logic
├── routes/          # API routes
├── middleware/      # Auth & error handling
├── config/          # Configuration files
├── utils/           # Helper functions
├── app.js           # Express app setup
└── server.js        # Server entry point
```

## Next Steps

1. Read the full [API Documentation](./API_DOCUMENTATION.md)
2. Explore the [README](./README.md) for detailed features
3. Customize the models for your specific needs
4. Add payment gateway integration
5. Implement email notifications
6. Add more advanced features

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check the `MONGODB_URI` in `.env`
- Verify MongoDB is accessible on the specified port

### Port Already in Use
- Change the `PORT` in `.env` file
- Or kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:3000 | xargs kill -9
  ```

### JWT Token Errors
- Ensure you're sending the token in the correct format: `Bearer <token>`
- Check if the token has expired (default: 30 days)
- Verify `JWT_SECRET` is set in `.env`

## Support

For issues or questions:
1. Check the API documentation
2. Review error messages carefully
3. Ensure all dependencies are installed
4. Verify environment variables are set correctly

Happy coding! 🎬🍿
