import { Link, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/signin', { replace: true });
  };

  const location = useLocation();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Mumbai');
  const [searchQuery, setSearchQuery] = useState('');
  
  const isAdmin = user?.role === 'admin';
  const isTheaterManager = user?.role === 'theaterManager';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navItems = (isAdmin || isTheaterManager)
    ? [] 
    : [
        { to: '/#movies', label: 'Movies' },
        { to: '/stream', label: 'Stream' },
        { to: '/#events', label: 'Events' },
        { to: '/plays', label: 'Plays' },
        { to: '/sports', label: 'Sports' },
        { to: '/activities', label: 'Activities' },
      ];

  const locations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Kochi'
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-surface/90 border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link 
              to={isAdmin ? '/admin' : isTheaterManager ? '/manager' : '/'} 
              className="flex items-center space-x-2 group transition-all duration-200"
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-white transform group-hover:rotate-12 transition-transform duration-300">
                🎬
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                <span className="text-brand">Cine</span>Go
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-1">
            <form onSubmit={handleSearch} className="relative w-80 mr-4">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, cinemas, events..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all duration-200"
              />
            </form>

            <nav className="flex space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Location Selector - Hidden for Admin and Theater Manager */}
          {!isAdmin && !isTheaterManager && (
            <div className="hidden md:flex items-center mr-4 relative">
              <button 
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 group bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
              >
                <svg 
                  className="w-4 h-4 mr-2 text-brand" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
                <span className="font-medium text-white">{currentLocation}</span>
                <svg 
                  className={`w-4 h-4 ml-1.5 text-gray-400 transition-transform duration-200 ${showLocationDropdown ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 9l-7 7-7-7" 
                  />
                </svg>
              </button>
              
              {/* Location Dropdown */}
              {showLocationDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 z-50 overflow-hidden">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs font-medium text-gray-400 border-b border-gray-700">
                      SELECT CITY
                    </div>
                    {locations.map((location) => (
                      <button
                        key={location}
                        onClick={() => {
                          setCurrentLocation(location);
                          setShowLocationDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          currentLocation === location 
                            ? 'bg-red-600 text-white' 
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Right side items */}
          <div className="flex items-center">
            {!user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white transition-colors duration-200"
                >
                  Sign Up
                </Link>
                <Link
                  to="/signin"
                  state={{ from: location.pathname + location.search }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand to-brand-dark text-sm font-medium text-white shadow-lg hover:shadow-brand/30 hover:scale-[1.02] transform transition-all duration-200"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="relative ml-3">
                <div className="flex items-center space-x-2">
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center space-x-2 max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/50 transition-all duration-200 group bg-red-600/20"
                      id="user-menu-button"
                      aria-expanded="false"
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full opacity-0 group-hover:opacity-100 blur transition duration-200 group-hover:duration-300"></div>
                        <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-700 border-2 border-red-500/80 overflow-hidden hover:border-red-300 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-500/20">
                          {user.profilePicture || user.photo ? (
                            <img
                              className="w-full h-full object-cover"
                              src={user.profilePicture || user.photo}
                              alt={user.name || 'User'}
                            />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {(user.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="hidden md:inline-block text-sm font-medium text-white group-hover:text-red-200 transition-colors duration-200 ml-2">
                        {user.name || 'Account'}
                      </span>
                      <svg
                        className="hidden md:block h-4 w-4 text-red-300 group-hover:text-white transition-colors duration-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown menu */}
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-gray-900 border border-red-500/20 backdrop-blur-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-50">
                      <div className="py-1.5 rounded-xl">
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm text-white/60">Signed in as</p>
                          <p className="text-sm font-medium text-white truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="px-1.5 py-1">
                          <Link
                            to={isAdmin ? '/admin' : isTheaterManager ? '/manager' : '/'}
                            className="flex items-center px-3 py-2 text-sm rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors duration-150 group"
                          >
                            <svg
                              className="mr-3 h-5 w-5 text-white/60 group-hover:text-brand transition-colors duration-200"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                            {isAdmin ? 'Dashboard' : isTheaterManager ? 'Manager Dashboard' : 'Home'}
                          </Link>
                          <Link
                            to="/profile"
                            className="flex items-center px-3 py-2 text-sm rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors duration-150 group"
                          >
                            <svg
                              className="mr-3 h-5 w-5 text-white/60 group-hover:text-brand transition-colors duration-200"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Your Profile
                          </Link>

                          {/* Conditional Links: Hide for Admin and Theater Manager */}
                          {!isAdmin && !isTheaterManager && (
                            <Link
                              to="/profile?tab=bookings"
                              className="flex items-center px-3 py-2 text-sm rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors duration-150 group"
                            >
                              <svg
                                className="mr-3 h-5 w-5 text-white/60 group-hover:text-brand transition-colors duration-200"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                              My Bookings
                            </Link>
                          )}
                        </div>
                        <div className="px-1.5 py-1 border-t border-white/5">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 py-2 text-sm rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150 group"
                          >
                            <svg
                              className="mr-3 h-5 w-5 text-red-500/80 group-hover:text-red-400 transition-colors duration-200"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand/50 transition-colors duration-200"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'text-white bg-white/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  )
}