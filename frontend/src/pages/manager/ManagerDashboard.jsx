import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { toast } from '../../lib/toast';
import { FiHome, FiFilm, FiCalendar, FiTrendingUp, FiLoader } from 'react-icons/fi';
import { format } from 'date-fns';

export default function ManagerDashboard() {
  const location = useLocation();
  const [myTheaters, setMyTheaters] = useState([]);
  const [movies, setMovies] = useState([]);
  const [allShows, setAllShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTheaters: 0,
    totalShows: 0,
    upcomingShows: 0,
    activeShows: 0,
  });
  const [bookings, setBookings] = useState([]);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    paidBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
  });

  // Fetch all data needed for the child components
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch the theaters this manager is assigned to
        const theaterRes = await api.get('/users/my-theaters');
        const theaters = theaterRes.data.data.theaters || [];
        setMyTheaters(theaters);

        // Fetch all movies for the "Add Show" dropdown
        const movieRes = await api.get('/movies');
        setMovies(movieRes.data.data.movies || []);

        // Fetch all showtimes for assigned theaters
        const allShowtimes = [];
        for (const theater of theaters) {
          try {
            const showRes = await api.get(`/theaters/${theater._id}/showtimes`);
            const showtimes = showRes.data.data.showtimes || [];
            allShowtimes.push(...showtimes.map(show => ({ ...show, theaterName: theater.name })));
          } catch (err) {
            console.error(`Error loading shows for theater ${theater._id}:`, err);
          }
        }
        setAllShows(allShowtimes);

        // Calculate stats
        const now = new Date();
        const upcomingShows = allShowtimes.filter(show => new Date(show.startTime) > now);
        const activeShows = allShowtimes.filter(show => {
          const start = new Date(show.startTime);
          const end = new Date(show.endTime);
          return start <= now && end >= now;
        });

        setStats({
          totalTheaters: theaters.length,
          totalShows: allShowtimes.length,
          upcomingShows: upcomingShows.length,
          activeShows: activeShows.length,
        });

        // Fetch bookings for managed theaters
        try {
          const bookingsRes = await api.get('/bookings/my-theaters-bookings');
          setBookings(bookingsRes.data.data.bookings || []);
          setBookingStats(bookingsRes.data.data.stats || {
            totalBookings: 0,
            totalRevenue: 0,
            paidBookings: 0,
            pendingBookings: 0,
            cancelledBookings: 0,
          });
        } catch (err) {
          console.error('Error loading bookings:', err);
        }
      } catch (err) {
        toast.error('Failed to load manager data', err.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const navItems = [
    { name: 'Overview', path: '/manager' },
    { name: 'My Theaters', path: '/manager/theaters' },
    { name: 'Movies', path: '/manager/movies' },
    { name: 'Screens', path: '/manager/screens' },
    { name: 'Manage Shows', path: '/manager/shows' },
    { name: 'Bookings', path: '/manager/bookings' },
    { name: 'Cancellations', path: '/manager/cancellations' },
  ];

  const isOverview = location.pathname === '/manager';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Manager Dashboard</h1>
        <p className="text-sm text-gray-300">
          Manage your assigned theaters and their showtimes.
        </p>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex space-x-2 mb-6 border-b border-gray-700">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-brand text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Nested Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <FiLoader className="animate-spin text-brand text-4xl" />
        </div>
      ) : isOverview ? (
        <DashboardOverview 
          theaters={myTheaters} 
          shows={allShows} 
          stats={stats}
          bookings={bookings}
          bookingStats={bookingStats}
        />
      ) : (
        <Outlet context={{ myTheaters, setMyTheaters, movies, allShows }} />
      )}
    </div>
  );
}

// Overview Component with Insights
function DashboardOverview({ theaters, shows, stats, bookings, bookingStats }) {
  const now = new Date();
  const upcomingShows = shows.filter(show => new Date(show.startTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 5);

  const activeShows = shows.filter(show => {
    const start = new Date(show.startTime);
    const end = new Date(show.endTime);
    return start <= now && end >= now;
  });

  const statsCards = [
    {
      title: 'Assigned Theaters',
      value: stats.totalTheaters,
      icon: <FiHome className="text-blue-500" size={24} />,
      color: 'blue',
    },
    {
      title: 'Total Shows',
      value: stats.totalShows,
      icon: <FiFilm className="text-purple-500" size={24} />,
      color: 'purple',
    },
    {
      title: 'Total Bookings',
      value: bookingStats.totalBookings,
      icon: <FiCalendar className="text-green-500" size={24} />,
      color: 'green',
    },
    {
      title: 'Total Revenue',
      value: `₹${bookingStats.totalRevenue.toLocaleString()}`,
      icon: <FiTrendingUp className="text-yellow-500" size={24} />,
      color: 'yellow',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-900 rounded-lg">
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Theaters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FiHome className="mr-2 text-blue-500" />
            Assigned Theaters
          </h2>
          {theaters.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No theaters assigned</p>
              <p className="text-sm mt-2">Contact an admin to get assigned to theaters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {theaters.map((theater) => {
                const theaterShows = shows.filter(s => s.theater?._id === theater._id || s.theater === theater._id);
                const activeTheaterShows = theaterShows.filter(s => {
                  const start = new Date(s.startTime);
                  const end = new Date(s.endTime);
                  return start <= now && end >= now;
                });
                
                // Calculate bookings for this theater
                const theaterBookings = bookings.filter(b => b.showtime?.theater?._id === theater._id);
                const theaterRevenue = theaterBookings
                  .filter(b => b.paymentStatus === 'paid')
                  .reduce((sum, b) => sum + b.totalAmount, 0);
                
                return (
                  <div
                    key={theater._id}
                    className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {theater.name}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {theater.city || 'Location not specified'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span>{theater.screens?.length || 0} Screens</span>
                          <span>{theaterShows.length} Total Shows</span>
                          <span className="text-green-400">{activeTheaterShows.length} Active Now</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs pt-2 border-t border-gray-700">
                          <span className="text-blue-400 font-semibold">{theaterBookings.length} Bookings</span>
                          <span className="text-green-400 font-semibold">₹{theaterRevenue.toLocaleString()} Revenue</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active & Upcoming Shows */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FiCalendar className="mr-2 text-green-500" />
            Active & Upcoming Shows
          </h2>
          {activeShows.length === 0 && upcomingShows.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No active or upcoming shows</p>
              <p className="text-sm mt-2">Create shows to see them here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {/* Active Shows */}
              {activeShows.length > 0 && (
                <>
                  <div className="text-sm font-medium text-green-400 mb-2">
                    Currently Running ({activeShows.length})
                  </div>
                  {activeShows.slice(0, 3).map((show) => (
                    <ShowCard key={show._id} show={show} isActive={true} bookings={bookings} />
                  ))}
                </>
              )}
              
              {/* Upcoming Shows */}
              {upcomingShows.length > 0 && (
                <>
                  <div className="text-sm font-medium text-yellow-400 mb-2 mt-4">
                    Upcoming ({upcomingShows.length})
                  </div>
                  {upcomingShows.map((show) => (
                    <ShowCard key={show._id} show={show} isActive={false} bookings={bookings} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings Section */}
      {bookings.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Recent Bookings
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {bookings.slice(0, 10).map((booking) => (
              <div
                key={booking._id}
                className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-sm font-semibold text-white">
                        {booking.showtime?.movie?.title || 'Unknown Movie'}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          booking.paymentStatus === 'paid'
                            ? 'bg-green-900/50 text-green-300 border border-green-700'
                            : booking.paymentStatus === 'pending'
                            ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                            : 'bg-red-900/50 text-red-300 border border-red-700'
                        }`}
                      >
                        {booking.paymentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">
                      {booking.showtime?.theater?.name || 'Theater'} • {booking.user?.name || 'User'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{format(new Date(booking.bookingDate), 'MMM dd, yyyy h:mm a')}</span>
                      <span>•</span>
                      <span>{booking.seats?.length || 0} seats</span>
                      <span>•</span>
                      <span className="text-green-400 font-semibold">₹{booking.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Show Card Component
function ShowCard({ show, isActive, bookings = [] }) {
  const movie = show.movie;
  const startTime = new Date(show.startTime);
  const endTime = new Date(show.endTime);
  
  // Calculate bookings for this show
  const showBookings = bookings.filter(b => b.showtime?._id === show._id);
  const bookedSeats = showBookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);
  const showRevenue = showBookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div
      className={`bg-gray-900 border rounded-lg p-3 ${
        isActive ? 'border-green-700' : 'border-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {movie?.poster && (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-12 h-16 object-cover rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">
            {movie?.title || 'Unknown Movie'}
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            {show.theaterName || show.theater?.name || 'Theater'}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{format(startTime, 'MMM dd, h:mm a')}</span>
            <span>•</span>
            <span>Screen: {show.screen}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs pt-2 border-t border-gray-700">
            <span className="text-blue-400">{showBookings.length} bookings</span>
            <span>•</span>
            <span className="text-yellow-400">{bookedSeats} seats booked</span>
            <span>•</span>
            <span className="text-green-400">₹{showRevenue.toLocaleString()}</span>
          </div>
        </div>
        {isActive && (
          <span className="px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded-full border border-green-700">
            Live
          </span>
        )}
      </div>
    </div>
  );
}

