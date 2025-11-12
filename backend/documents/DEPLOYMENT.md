# Deployment Guide

Guide for deploying the Movie Booking Backend to production.

## 🚀 Deployment Options

### Option 1: Heroku

#### Prerequisites
- Heroku account
- Heroku CLI installed

#### Steps

1. **Create Heroku App**
```bash
heroku create movie-booking-api
```

2. **Add MongoDB Atlas**
```bash
heroku addons:create mongolab:sandbox
```

3. **Set Environment Variables**
```bash
heroku config:set JWT_SECRET=your_production_secret_key
heroku config:set JWT_EXPIRE=30d
heroku config:set NODE_ENV=production
```

4. **Deploy**
```bash
git push heroku main
```

5. **Seed Data (Optional)**
```bash
heroku run npm run seed:import
```

### Option 2: AWS EC2

#### Prerequisites
- AWS account
- EC2 instance running
- MongoDB installed or MongoDB Atlas

#### Steps

1. **Connect to EC2**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

2. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clone Repository**
```bash
git clone your-repo-url
cd movie-booking-backend
```

4. **Install Dependencies**
```bash
npm install --production
```

5. **Configure Environment**
```bash
nano .env
# Add production values
```

6. **Install PM2**
```bash
sudo npm install -g pm2
```

7. **Start Application**
```bash
pm2 start server.js --name movie-booking-api
pm2 save
pm2 startup
```

### Option 3: DigitalOcean

#### Prerequisites
- DigitalOcean account
- Droplet created

#### Steps

1. **SSH into Droplet**
```bash
ssh root@your-droplet-ip
```

2. **Install Node.js & MongoDB**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs mongodb
```

3. **Setup Application**
```bash
git clone your-repo-url
cd movie-booking-backend
npm install --production
```

4. **Configure Nginx (Optional)**
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/movie-booking
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/movie-booking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Start with PM2**
```bash
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

### Option 4: Docker

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/movie_booking
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRE=30d
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

#### Deploy with Docker
```bash
docker-compose up -d
```

## 🔐 Production Security Checklist

### Environment Variables
- [ ] Change JWT_SECRET to a strong random string
- [ ] Set NODE_ENV to 'production'
- [ ] Use MongoDB Atlas or secure MongoDB instance
- [ ] Never commit .env file

### Database Security
- [ ] Enable MongoDB authentication
- [ ] Use strong database passwords
- [ ] Whitelist IP addresses
- [ ] Enable SSL/TLS for MongoDB connections
- [ ] Regular backups configured

### Application Security
- [ ] Enable CORS with specific origins
- [ ] Add rate limiting
- [ ] Add helmet.js for security headers
- [ ] Enable HTTPS/SSL
- [ ] Implement request logging
- [ ] Add input sanitization

### Monitoring
- [ ] Setup error logging (Sentry, LogRocket)
- [ ] Setup performance monitoring
- [ ] Configure uptime monitoring
- [ ] Setup alerts for errors

## 📦 Production Dependencies

Add these for production:

```bash
npm install helmet express-rate-limit compression morgan
```

### Update app.js for Production

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// CORS - specify allowed origins
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "your-app-name"
        heroku_email: "your-email@example.com"
```

## 📊 Database Migration

### MongoDB Atlas Setup

1. **Create Cluster**
   - Go to MongoDB Atlas
   - Create new cluster
   - Choose region closest to your users

2. **Configure Network Access**
   - Add IP whitelist (0.0.0.0/0 for all, or specific IPs)

3. **Create Database User**
   - Create user with read/write permissions
   - Save credentials securely

4. **Get Connection String**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace <password> and <dbname>

5. **Update Environment**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/movie_booking?retryWrites=true&w=majority
```

## 🧪 Pre-Deployment Testing

### 1. Run Tests
```bash
npm test
```

### 2. Check for Security Vulnerabilities
```bash
npm audit
npm audit fix
```

### 3. Test Production Build
```bash
NODE_ENV=production npm start
```

### 4. Load Testing
```bash
# Install Apache Bench
ab -n 1000 -c 100 http://localhost:3000/api/v1/movies
```

## 📈 Performance Optimization

### 1. Enable Compression
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Add Caching
```javascript
const apicache = require('apicache');
let cache = apicache.middleware;
app.use(cache('5 minutes'));
```

### 3. Database Indexing
Already implemented in models:
- User: email (unique)
- Showtime: movie + theater + startTime (unique)
- Theater: location (2dsphere)
- Booking: user + showtime

### 4. Enable Clustering
```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Start server
}
```

## 🔍 Monitoring & Logging

### Setup Sentry for Error Tracking

```bash
npm install @sentry/node
```

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Add before routes
app.use(Sentry.Handlers.requestHandler());

// Add before error handlers
app.use(Sentry.Handlers.errorHandler());
```

### Setup Winston for Logging

```bash
npm install winston
```

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔄 Backup Strategy

### Automated MongoDB Backups

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/backup_$DATE"

# Add to crontab for daily backups
0 2 * * * /path/to/backup-script.sh
```

## 📱 Health Checks

Already implemented at `/health` endpoint.

For production, add more detailed checks:

```javascript
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: 'connected'
  };
  
  try {
    await mongoose.connection.db.admin().ping();
  } catch (error) {
    health.database = 'disconnected';
    health.message = 'ERROR';
    return res.status(503).json(health);
  }
  
  res.json(health);
});
```

## 🎯 Post-Deployment Checklist

- [ ] Application is running
- [ ] Database is connected
- [ ] All endpoints are accessible
- [ ] SSL/HTTPS is enabled
- [ ] Environment variables are set
- [ ] Monitoring is active
- [ ] Backups are configured
- [ ] Error tracking is working
- [ ] Logs are being collected
- [ ] Performance is acceptable
- [ ] Security headers are set
- [ ] Rate limiting is active
- [ ] CORS is configured correctly

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Check error logs
   - Review performance metrics
   - Check disk space

2. **Monthly**
   - Update dependencies
   - Review security advisories
   - Optimize database
   - Review and archive old bookings

3. **Quarterly**
   - Security audit
   - Performance optimization
   - Backup restoration test
   - Disaster recovery drill

---

**Your application is now ready for production deployment!** 🚀
