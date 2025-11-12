# Setup Verification Checklist

Use this checklist to verify your Movie Booking Backend is properly set up.

## ✅ File Structure Verification

### Core Files
- [x] `server.js` - Server entry point
- [x] `app.js` - Express application setup
- [x] `package.json` - Dependencies and scripts
- [x] `.env` - Environment configuration
- [x] `.gitignore` - Git ignore rules
- [x] `seeder.js` - Database seeder

### Configuration Files
- [x] `config/db.js` - Database connection
- [x] `config/jwt.js` - JWT utilities

### Models (5 files)
- [x] `models/User.js` - User schema with authentication
- [x] `models/Movie.js` - Movie schema
- [x] `models/Theater.js` - Theater schema with geospatial
- [x] `models/Showtime.js` - Showtime schema
- [x] `models/Booking.js` - Booking schema

### Controllers (5 files)
- [x] `controllers/auth.controller.js` - Authentication logic
- [x] `controllers/movie.controller.js` - Movie operations
- [x] `controllers/theater.controller.js` - Theater operations
- [x] `controllers/showtime.controller.js` - Showtime operations
- [x] `controllers/booking.controller.js` - Booking operations

### Routes (5 files)
- [x] `routes/auth.routes.js` - Auth endpoints
- [x] `routes/movie.routes.js` - Movie endpoints
- [x] `routes/theater.routes.js` - Theater endpoints
- [x] `routes/showtime.routes.js` - Showtime endpoints
- [x] `routes/booking.routes.js` - Booking endpoints

### Middleware (2 files)
- [x] `middleware/auth.middleware.js` - Authentication & authorization
- [x] `middleware/error.middleware.js` - Error handling

### Utilities (2 files)
- [x] `utils/appError.js` - Custom error class
- [x] `utils/apiFeatures.js` - Query features

### Documentation (6 files)
- [x] `README.md` - Main documentation
- [x] `API_DOCUMENTATION.md` - Complete API reference
- [x] `QUICK_START.md` - Quick start guide
- [x] `TESTING_GUIDE.md` - Testing instructions
- [x] `PROJECT_SUMMARY.md` - Project overview
- [x] `SETUP_VERIFICATION.md` - This file

### Additional Files
- [x] `postman_collection.json` - Postman API collection

## 📦 Dependencies Verification

Run this command to verify all dependencies are installed:

```bash
npm list --depth=0
```

### Expected Production Dependencies:
- bcryptjs
- cors
- dotenv
- express
- express-validator
- jsonwebtoken
- mongoose
- validator

### Expected Dev Dependencies:
- nodemon

## 🔧 Environment Configuration

Check your `.env` file has these variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/movie_booking
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
NODE_ENV=development
```

### Security Check:
- [ ] JWT_SECRET is changed from default
- [ ] MongoDB URI is correct for your setup
- [ ] PORT is available (not in use)

## 🗄️ Database Verification

### 1. Check MongoDB is Running

**Windows:**
```powershell
Get-Service MongoDB
# or
mongosh --eval "db.version()"
```

**Linux/Mac:**
```bash
sudo systemctl status mongod
# or
mongosh --eval "db.version()"
```

### 2. Test Database Connection

Start the server and check for this message:
```
MongoDB Connected: localhost
```

### 3. Seed Sample Data

```bash
npm run seed:import
```

Expected output:
```
Users imported successfully
Movies imported successfully
Theaters imported successfully
Showtimes imported successfully
✅ Data imported successfully!
```

## 🚀 Server Verification

### 1. Start Development Server

```bash
npm run dev
```

Expected output:
```
[nodemon] starting `node server.js`
MongoDB Connected: localhost
Server running in development mode on port 3000
```

### 2. Health Check

Open browser or use curl:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 API Endpoint Verification

### Test 1: Public Endpoint (No Auth Required)

```bash
curl http://localhost:3000/api/v1/movies
```

✅ Should return: 200 status with array of movies

### Test 2: User Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "verify@example.com",
    "password": "test123456",
    "phone": "+1234567890"
  }'
```

✅ Should return: 201 status with user object and token

### Test 3: User Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

✅ Should return: 200 status with token

### Test 4: Protected Endpoint (Auth Required)

```bash
# First login and get token, then:
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

✅ Should return: 200 status with user details

### Test 5: Admin Endpoint

```bash
# Login as admin first, then:
curl -X POST http://localhost:3000/api/v1/movies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "Test Movie",
    "description": "Test",
    "duration": 120,
    "genre": ["Action"],
    "releaseDate": "2024-01-01",
    "director": "Test",
    "cast": ["Actor"],
    "language": "English",
    "rating": 7.5,
    "poster": "https://example.com/poster.jpg"
  }'
```

✅ Should return: 201 status with created movie

## 🔒 Security Verification

### 1. Password Hashing
- [ ] Passwords are hashed in database (not plain text)
- [ ] Password field is not returned in API responses

### 2. JWT Authentication
- [ ] Protected routes require valid token
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected

### 3. Authorization
- [ ] Regular users cannot access admin routes
- [ ] Users can only access their own bookings
- [ ] Admin can access all resources

### 4. Input Validation
- [ ] Invalid email format is rejected
- [ ] Short passwords are rejected
- [ ] Missing required fields are rejected

## 📊 Database Verification

After seeding, verify collections exist:

```bash
mongosh movie_booking --eval "db.getCollectionNames()"
```

Expected collections:
- users
- movies
- theaters
- showtimes
- bookings

### Verify Sample Data Counts:

```bash
mongosh movie_booking --eval "db.users.countDocuments()"
mongosh movie_booking --eval "db.movies.countDocuments()"
mongosh movie_booking --eval "db.theaters.countDocuments()"
mongosh movie_booking --eval "db.showtimes.countDocuments()"
```

Expected:
- Users: 2 (1 admin, 1 user)
- Movies: 3
- Theaters: 2
- Showtimes: 18+ (multiple per movie/theater)

## 🎯 Feature Verification

### Authentication Features
- [ ] User can register
- [ ] User can login
- [ ] User can view profile
- [ ] User can update details
- [ ] User can change password
- [ ] JWT token expires correctly

### Movie Features
- [ ] Can view all movies
- [ ] Can filter movies by genre
- [ ] Can filter movies by rating
- [ ] Can sort movies
- [ ] Can paginate results
- [ ] Admin can create movies
- [ ] Admin can update movies
- [ ] Admin can delete movies

### Theater Features
- [ ] Can view all theaters
- [ ] Can view theater details
- [ ] Can search nearby theaters
- [ ] Can view theater showtimes
- [ ] Admin can manage theaters

### Showtime Features
- [ ] Can view all showtimes
- [ ] Can view showtime details
- [ ] Can check seat availability
- [ ] Admin can create showtimes
- [ ] Prevents overlapping showtimes

### Booking Features
- [ ] User can create booking
- [ ] Prevents double-booking seats
- [ ] User can view booking history
- [ ] User can update payment status
- [ ] User can cancel booking
- [ ] Seats are released on cancellation
- [ ] Cannot cancel within 2 hours of showtime

## 🐛 Common Issues & Solutions

### Issue 1: MongoDB Connection Failed
**Solution:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify MongoDB port (default: 27017)

### Issue 2: Port Already in Use
**Solution:**
```powershell
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue 3: Module Not Found
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: JWT Token Invalid
**Solution:**
- Ensure JWT_SECRET is set in .env
- Check token format: "Bearer <token>"
- Token may have expired (login again)

### Issue 5: Validation Errors
**Solution:**
- Check all required fields are provided
- Verify data types match schema
- Check email format is valid

## ✨ Final Verification Steps

1. **Clean Start Test**
   ```bash
   npm run seed:delete
   npm run seed:import
   npm run dev
   ```

2. **Complete User Flow Test**
   - Register new user
   - Login
   - Browse movies
   - View showtimes
   - Create booking
   - View booking history
   - Cancel booking

3. **Admin Flow Test**
   - Login as admin
   - Create movie
   - Create theater
   - Create showtime
   - View all bookings

4. **Error Handling Test**
   - Try invalid login
   - Try accessing protected route without token
   - Try creating duplicate user
   - Try booking already booked seats

## 📈 Performance Check

Test API response times:

```bash
# Should respond in < 100ms for simple queries
curl -w "@-" -o /dev/null -s http://localhost:3000/api/v1/movies <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

## 🎉 Success Criteria

Your setup is complete when:

- ✅ All files are present
- ✅ Dependencies are installed
- ✅ MongoDB is connected
- ✅ Server starts without errors
- ✅ Health check returns success
- ✅ Sample data is seeded
- ✅ All API endpoints respond correctly
- ✅ Authentication works
- ✅ Authorization works
- ✅ Bookings can be created
- ✅ Error handling works

## 📚 Next Steps

1. Read the [API Documentation](./API_DOCUMENTATION.md)
2. Follow the [Testing Guide](./TESTING_GUIDE.md)
3. Import Postman collection for easy testing
4. Customize for your specific needs
5. Deploy to production

---

**Congratulations!** 🎊 Your Movie Booking Backend is ready to use!
