const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Theater = require('./models/Theater');
const Showtime = require('./models/Showtime');
const Booking = require('./models/Booking');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123456',
    phone: '+1234567890',
    role: 'admin',
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+1234567891',
    role: 'endUser',
  },
  {
    name: 'Theater Manager',
    email: 'manager@example.com',
    password: 'manager123456',
    phone: '+1234567892',
    role: 'theaterManager',
    managedTheaters: [], // Will be populated after theaters are created
  },
];

const movies = [
  {
    title: 'Inception',
    description:
      'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    duration: 148,
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    releaseDate: new Date('2010-07-16'),
    director: 'Christopher Nolan',
    cast: [
      'Leonardo DiCaprio',
      'Joseph Gordon-Levitt',
      'Ellen Page',
      'Tom Hardy',
    ],
    language: 'English',
    rating: 8.8,
    poster: 'https://example.com/inception-poster.jpg',
    trailer: 'https://example.com/inception-trailer.mp4',
  },
  {
    title: 'The Dark Knight',
    description:
      'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    duration: 152,
    genre: ['Action', 'Crime', 'Drama'],
    releaseDate: new Date('2008-07-18'),
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine'],
    language: 'English',
    rating: 9.0,
    poster: 'https://example.com/dark-knight-poster.jpg',
    trailer: 'https://example.com/dark-knight-trailer.mp4',
  },
  {
    title: 'Interstellar',
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    duration: 169,
    genre: ['Adventure', 'Drama', 'Sci-Fi'],
    releaseDate: new Date('2014-11-07'),
    director: 'Christopher Nolan',
    cast: [
      'Matthew McConaughey',
      'Anne Hathaway',
      'Jessica Chastain',
      'Michael Caine',
    ],
    language: 'English',
    rating: 8.6,
    poster: 'https://example.com/interstellar-poster.jpg',
    trailer: 'https://example.com/interstellar-trailer.mp4',
  },
];

const theaters = [
  {
    name: 'Cineplex Downtown',
    location: {
      type: 'Point',
      coordinates: [-73.935242, 40.73061],
      address: '123 Main St, New York, NY 10001',
      description: 'Downtown location with easy access',
    },
    city: 'New York',
    screens: [
      {
        name: 'Screen 1',
        capacity: 150,
        seatLayout: [[15, 15, 15, 15, 15, 15, 15, 15, 15, 15]],
      },
      {
        name: 'Screen 2',
        capacity: 200,
        seatLayout: [[20, 20, 20, 20, 20, 20, 20, 20, 20, 20]],
      },
    ],
    facilities: ['Parking', 'Food Court', '3D', 'IMAX'],
    contact: {
      phone: '+1234567890',
      email: 'downtown@cineplex.com',
    },
  },
  {
    name: 'Multiplex Mall',
    location: {
      type: 'Point',
      coordinates: [-73.985428, 40.748817],
      address: '456 Mall Ave, New York, NY 10002',
      description: 'Inside the shopping mall',
    },
    city: 'New York',
    screens: [
      {
        name: 'Screen 1',
        capacity: 120,
        seatLayout: [[12, 12, 12, 12, 12, 12, 12, 12, 12, 12]],
      },
      {
        name: 'Screen 2',
        capacity: 180,
        seatLayout: [[18, 18, 18, 18, 18, 18, 18, 18, 18, 18]],
      },
      {
        name: 'Screen 3',
        capacity: 100,
        seatLayout: [[10, 10, 10, 10, 10, 10, 10, 10, 10, 10]],
      },
    ],
    facilities: ['Parking', 'Food Court', '3D', 'Dolby Atmos'],
    contact: {
      phone: '+1234567891',
      email: 'mall@multiplex.com',
    },
  },
];

// Import into DB
const importData = async () => {
  try {
    console.log('Importing data...');

    // Clear existing data
    await User.deleteMany();
    await Movie.deleteMany();
    await Theater.deleteMany();
    await Showtime.deleteMany();
    await Booking.deleteMany();

    // Import users
    const createdUsers = await User.create(users);
    console.log('Users imported successfully');

    // Import movies
    const createdMovies = await Movie.create(movies);
    console.log('Movies imported successfully');

    // Import theaters
    const createdTheaters = await Theater.create(theaters);
    console.log('Theaters imported successfully');

    // Assign first theater to theater manager
    const theaterManager = createdUsers.find(user => user.role === 'theaterManager');
    if (theaterManager && createdTheaters.length > 0) {
      theaterManager.managedTheaters = [createdTheaters[0]._id];
      await theaterManager.save();
      console.log('Theater assigned to manager');
    }

    // Create sample showtimes
    const today = new Date();
    const showtimes = [];

    createdMovies.forEach((movie, index) => {
      createdTheaters.forEach((theater) => {
        theater.screens.forEach((screen, screenIndex) => {
          // Create 3 showtimes per screen
          for (let i = 0; i < 3; i++) {
            const startTime = new Date(today);
            startTime.setDate(today.getDate() + i);
            startTime.setHours(10 + screenIndex * 3 + i * 2, 0, 0, 0);

            const endTime = new Date(startTime);
            endTime.setMinutes(startTime.getMinutes() + movie.duration);

            showtimes.push({
              movie: movie._id,
              theater: theater._id,
              screen: screen.name,
              startTime,
              endTime,
              price: 10 + index * 2,
              availableSeats: screen.capacity,
            });
          }
        });
      });
    });

    await Showtime.create(showtimes);
    console.log('Showtimes imported successfully');

    console.log('\n✅ Data imported successfully!');
    console.log('\nSample credentials:');
    console.log('Admin - Email: admin@example.com, Password: admin123456');
    console.log('End User - Email: john@example.com, Password: password123');
    console.log('Theater Manager - Email: manager@example.com, Password: manager123456');

    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Delete data from DB
const deleteData = async () => {
  try {
    console.log('Deleting data...');

    await User.deleteMany();
    await Movie.deleteMany();
    await Theater.deleteMany();
    await Showtime.deleteMany();
    await Booking.deleteMany();

    console.log('✅ Data deleted successfully!');
    process.exit();
  } catch (error) {
    console.error('Error deleting data:', error);
    process.exit(1);
  }
};

// Run based on command line argument
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please use -i to import data or -d to delete data');
  process.exit();
}
