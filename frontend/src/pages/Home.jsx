import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MoviesAPI } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { toast } from '../lib/toast';

// Event Card Component
const EventCard = ({ event, type = 'event' }) => {
  const badgeColors = {
    concert: 'bg-pink-500',
    theater: 'bg-purple-500',
    sports: 'bg-blue-500',
    default: 'bg-gray-500'
  };

  return (
    <div className={`event-card ${type} mx-3 flex-shrink-0`}>
      <div className="relative h-48 overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {event.badge && (
          <div className="event-badge text-white">
            {event.badge}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className={`inline-block px-3 py-1 text-xs font-semibold ${badgeColors[type] || badgeColors.default} text-white rounded-full`}>
            {event.type}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white line-clamp-2">{event.title}</h3>
          <span className="text-brand font-bold whitespace-nowrap ml-2">{event.price}</span>
        </div>
        <div className="flex items-center text-sm text-gray-400 mb-4">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.location}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-300">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{event.date}</span>
          </div>
          <button className="px-4 py-2 bg-brand hover:bg-brand/90 text-white text-sm font-medium rounded-lg transition-colors">
            Get Tickets
          </button>
        </div>
      </div>
    </div>
  );
};

// Memoized selectors
const selectMoviesState = (state) => state.movies;

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('all'); // 'all' | 'new' | 'upcoming'
  const carouselRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  // Redirect theater managers to their dashboard
  useEffect(() => {
    if (user?.role === 'theaterManager') {
      navigate('/manager', { replace: true });
    } else if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.8 
        : scrollLeft + clientWidth * 0.8;
      
      carouselRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  const fetchMovies = useCallback(async () => {
    if (!isMounted) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        ...(view === 'new' && { view: 'new' }),
        ...(view === 'all' && { view: 'all', sort: '-releasedAt' }),
        ...(view === 'upcoming' && { view: 'upcoming' }),
      };
      
      console.log('Fetching movies with params:', params);
      const data = await MoviesAPI.list(params);
      
      if (isMounted) {
        if (data && Array.isArray(data)) {
          setMovies(data);
        } else {
          console.error('Invalid data format received:', data);
          setMovies([]);
          setError('Invalid data received from server');
        }
      }
    } catch (e) {
      console.error('Error fetching movies:', e);
      if (isMounted) {
        setError('Failed to load movies. Please try again later.');
        toast.error('Error', 'Failed to load movies');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [view, isMounted]);

  // Set mounted state and fetch movies
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Handle hash navigation for smooth scrolling
  useEffect(() => {
    if (!isMounted) return;

    const handleHashScroll = () => {
      const hash = location.hash || window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          // Use a longer timeout when navigating from another page
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      }
    };

    // Handle hash on mount or when location changes
    handleHashScroll();

    // Also listen to hash changes in the URL
    const handleHashChange = () => {
      handleHashScroll();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [location.hash, location.pathname, isMounted]);

  // Fetch movies when view changes or component mounts
  useEffect(() => {
    if (isMounted) {
      fetchMovies();
    }
  }, [fetchMovies, isMounted]);

  // View options for movie filtering
  const viewOptions = [
    { id: 'all', label: 'All Movies' },
    { id: 'new', label: 'New Releases' },
    { id: 'upcoming', label: 'Coming Soon' },
  ];

  // Auto-scroll carousel
  useEffect(() => {
    if (!isMounted) return;
    
    const carousel = carouselRef.current;
    if (!carousel) return;

    let autoScroll = setInterval(() => {
      if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 10) {
        carousel.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      } else {
        carousel.scrollBy({
          left: 1,
          behavior: 'auto'
        });
      }
    }, 50);

    // Pause auto-scroll on hover
    const pauseAutoScroll = () => clearInterval(autoScroll);
    const resumeAutoScroll = () => {
      autoScroll = setInterval(() => {
        if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 10) {
          carousel.scrollTo({
            left: 0,
            behavior: 'smooth'
          });
        } else {
          carousel.scrollBy({
            left: 1,
            behavior: 'auto'
          });
        }
      }, 50);
    };

    carousel.addEventListener('mouseenter', pauseAutoScroll);
    carousel.addEventListener('touchstart', pauseAutoScroll);
    carousel.addEventListener('mouseleave', resumeAutoScroll);
    carousel.addEventListener('touchend', resumeAutoScroll);

    return () => {
      clearInterval(autoScroll);
      carousel.removeEventListener('mouseenter', pauseAutoScroll);
      carousel.removeEventListener('touchstart', pauseAutoScroll);
      carousel.removeEventListener('mouseleave', resumeAutoScroll);
      carousel.removeEventListener('touchend', resumeAutoScroll);
    };
  }, [isMounted]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-gray-900/95 to-red-900/90 z-10" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
          </div>
          {/* Cinema Pattern Overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        {/* Content */}
        <div className="relative z-20 h-full flex items-center py-20 md:py-0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto lg:mx-0">
              {/* Badge */}
              <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-4 sm:mb-6 animate-fade-in">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 mr-1.5 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-white text-xs sm:text-sm font-medium">Your Ultimate Movie Destination</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight animate-slide-up">
                Experience Cinema
                <span className="block bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent mt-1 sm:mt-2">
                  Like Never Before
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 mb-6 sm:mb-8 leading-relaxed animate-slide-up animation-delay-200 max-w-2xl">
                Book your favorite movies, reserve the best seats, and create unforgettable memories with CineGo.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-slide-up animation-delay-400 mb-8 sm:mb-12">
                <a 
                  href="#movies" 
                  className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm sm:text-base font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50"
                >
                  <span className="relative z-10 flex items-center">
                    Explore Movies
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </a>
                
                <a 
                  href="#events" 
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-white/20 hover:border-white/50 transition-all duration-300"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Browse Events
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 animate-fade-in animation-delay-600 max-w-2xl">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">500+</div>
                  <div className="text-xs sm:text-sm text-gray-300">Movies</div>
                </div>
                <div className="text-center border-x border-white/20">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">50+</div>
                  <div className="text-xs sm:text-sm text-gray-300">Theaters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">10K+</div>
                  <div className="text-xs sm:text-sm text-gray-300">Happy Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden sm:flex">
          <a href="#movies" className="flex flex-col items-center text-white/60 hover:text-white transition-colors">
            <span className="text-xs sm:text-sm mb-2">Scroll to explore</span>
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }
      `}</style>

      {/* Movies Section */}
      <section id="movies" className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-0">
              {view === 'new' ? 'New Releases' : 
               view === 'upcoming' ? 'Coming Soon' : 
               'Now Showing'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {viewOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setView(option.id)}
                  className={`px-4 py-2 rounded-lg text-sm md:text-base ${
                    view === option.id 
                      ? 'bg-brand text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchMovies}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Retry
              </button>
            </div>
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie._id || movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No movies found. Please check back later.
            </div>
          )}
        </div>
      </section>

      {/* Animated Events Carousel */}
      <section id="events" className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 text-sm font-medium bg-brand/20 text-brand rounded-full mb-3">UPCOMING EVENTS</span>
            <h2 className="text-4xl font-bold text-white mb-3">Don't Miss Out</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Experience the best in entertainment with our curated selection of upcoming events, concerts, and shows.</p>
          </div>

          {/* Categories */}
          <div className="flex justify-center gap-4 mb-8">
            {['All', 'Concerts', 'Theater', 'Sports', 'Comedy', 'Family'].map((category) => (
              <button 
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  category === 'All' 
                    ? 'bg-brand text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Animated Carousel */}
          <div className="relative group">
            <div className="carousel-container overflow-hidden">
              <div className="carousel-track flex gap-6 py-6">
                {/* Concerts */}
                {[
                  {
                    id: 1,
                    title: "Summer Music Festival",
                    type: "CONCERT",
                    date: "JUN 15, 2023",
                    location: "Central Park, NY",
                    price: "$49.99",
                    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
                    badge: "SELLING FAST"
                  },
                  {
                    id: 2,
                    title: "Jazz Night Under the Stars",
                    type: "CONCERT",
                    date: "JUN 22, 2023",
                    location: "Riverside Amphitheater",
                    price: "$35.00",
                    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                  },
                  {
                    id: 3,
                    title: "Indie Rock Festival",
                    type: "CONCERT",
                    date: "JUL 7-9, 2023",
                    location: "Downtown Festival Grounds",
                    price: "From $79.99",
                    image: "https://images.unsplash.com/photo-1501612780327-45045538702b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
                    badge: "3-DAY PASS"
                  }
                ].map((event) => (
                  <EventCard key={`concert-${event.id}`} event={event} type="concert" />
                ))}

                {/* Theater */}
                {[
                  {
                    id: 4,
                    title: "Romeo & Juliet",
                    type: "THEATER",
                    date: "JUN 18-25, 2023",
                    location: "Royal Theater",
                    price: "From $29.99",
                    image: "https://images.unsplash.com/photo-1507924538823-28d1f5ac0a9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                  },
                  {
                    id: 5,
                    title: "The Phantom of the Opera",
                    type: "THEATER",
                    date: "JUL 1-30, 2023",
                    location: "Majestic Theater",
                    price: "From $59.99",
                    image: "https://images.unsplash.com/photo-1518604666863-5dde8c9f2936?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
                    badge: "BROADWAY HIT"
                  }
                ].map((event) => (
                  <EventCard key={`theater-${event.id}`} event={event} type="theater" />
                ))}

                {/* Sports */}
                {[
                  {
                    id: 6,
                    title: "Championship Basketball",
                    type: "SPORTS",
                    date: "JUN 20, 2023",
                    location: "City Arena",
                    price: "From $45.00",
                    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1490&q=80"
                  },
                  {
                    id: 7,
                    title: "International Soccer Match",
                    type: "SPORTS",
                    date: "JUL 5, 2023",
                    location: "National Stadium",
                    price: "From $35.00",
                    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195d86?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1493&q=80",
                    badge: "LIMITED SEATS"
                  }
                ].map((event) => (
                  <EventCard key={`sport-${event.id}`} event={event} type="sports" />
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button 
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 w-12 h-12 rounded-full bg-gray-800/80 text-white flex items-center justify-center hover:bg-brand transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              onClick={() => scrollCarousel('left')}
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-6 w-12 h-12 rounded-full bg-gray-800/80 text-white flex items-center justify-center hover:bg-brand transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              onClick={() => scrollCarousel('right')}
              aria-label="Next slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* View All Button */}
          <div className="text-center mt-10">
            <button className="px-8 py-3 bg-transparent border-2 border-brand text-brand hover:bg-brand hover:text-white rounded-full font-medium transition-all duration-300 transform hover:-translate-y-1">
              View All Events
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-250px * 7)) }
          }
          
          .carousel-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
            overflow-x: auto;
            scroll-behavior: smooth;
          }
          
          .carousel-container::-webkit-scrollbar {
            display: none;
          }
          
          .carousel-track {
            display: flex;
            animation: scroll 30s linear infinite;
            width: calc(250px * 14);
          }
          
          .carousel-track:hover {
            animation-play-state: paused;
          }
          
          @media (max-width: 768px) {
            .carousel-track {
              animation: scroll 20s linear infinite;
            }
          }
        `}</style>
      </section>
      
      {/* Event Card Component */}
      <style jsx global>{`
        .event-card {
          flex: 0 0 auto;
          width: 300px;
          background: rgba(31, 41, 55, 0.7);
          border-radius: 1rem;
          overflow: hidden;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .event-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .event-card.concert {
          border-top: 3px solid #f43f5e; /* Red border for concerts */
        }
        
        .event-card.theater {
          border-top: 3px solid #8b5cf6; /* Purple border for theater */
        }
        
        .event-card.sports {
          border-top: 3px solid #3b82f6; /* Blue border for sports */
        }
        
        .event-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready for Your Next Adventure?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">Join thousands of entertainment lovers who trust us for their movie and event bookings. Never miss out on the best experiences in town.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/signup" className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-medium rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Create Free Account
            </a>
            <a href="#recommended" className="px-6 py-3 border border-white/20 hover:bg-white/5 text-white font-medium rounded-lg transition-all">
              Browse Movies & Events
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}