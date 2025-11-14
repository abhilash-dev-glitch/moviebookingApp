import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FiMonitor, FiFilm, FiClock, FiCalendar, FiUsers, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { format, isAfter, isBefore } from 'date-fns';

export default function ManagerScreens() {
  const { myTheaters, allShows } = useOutletContext();
  const [selectedTheaterId, setSelectedTheaterId] = useState('');
  const [expandedScreens, setExpandedScreens] = useState(new Set());

  // Set initial theater
  useEffect(() => {
    if (myTheaters.length > 0 && !selectedTheaterId) {
      setSelectedTheaterId(myTheaters[0]._id);
    }
  }, [myTheaters, selectedTheaterId]);

  const selectedTheater = useMemo(() => 
    myTheaters.find(t => t._id === selectedTheaterId),
    [myTheaters, selectedTheaterId]
  );

  // Group shows by screen for the selected theater
  const screenData = useMemo(() => {
    if (!selectedTheater) return [];

    const screens = selectedTheater.screens || [];
    const now = new Date();

    return screens.map(screen => {
      // Find all shows for this screen
      // Check both theater ID and screen ID/name matching
      const screenShows = allShows.filter(show => {
        const showTheaterId = typeof show.theater === 'object' ? show.theater._id : show.theater;
        const showScreenId = show.screen;
        
        // Match theater and screen (screen can be stored as ID or name)
        return showTheaterId === selectedTheaterId && 
               (showScreenId === screen._id || showScreenId === screen.name);
      });

      // Categorize shows
      const activeShows = screenShows.filter(show => {
        const start = new Date(show.startTime);
        const end = new Date(show.endTime);
        return isBefore(start, now) && isAfter(end, now);
      });

      const upcomingShows = screenShows.filter(show => 
        isAfter(new Date(show.startTime), now)
      ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      const pastShows = screenShows.filter(show => 
        isBefore(new Date(show.endTime), now)
      );

      // Get unique movies
      const movies = new Map();
      screenShows.forEach(show => {
        if (show.movie) {
          const movieId = typeof show.movie === 'object' ? show.movie._id : show.movie;
          const movieData = typeof show.movie === 'object' ? show.movie : null;
          if (movieData && !movies.has(movieId)) {
            movies.set(movieId, movieData);
          }
        }
      });

      return {
        ...screen,
        totalShows: screenShows.length,
        activeShows: activeShows.length,
        upcomingShows: upcomingShows.length,
        pastShows: pastShows.length,
        shows: screenShows,
        upcomingShowsList: upcomingShows,
        activeShowsList: activeShows,
        movies: Array.from(movies.values()),
      };
    });
  }, [selectedTheater, allShows, selectedTheaterId]);

  const toggleScreen = (screenId) => {
    setExpandedScreens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(screenId)) {
        newSet.delete(screenId);
      } else {
        newSet.add(screenId);
      }
      return newSet;
    });
  };

  const getStatusColor = (screen) => {
    if (screen.activeShows > 0) return 'bg-green-500/20 border-green-500/50 text-green-400';
    if (screen.upcomingShows > 0) return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
  };

  const getStatusText = (screen) => {
    if (screen.activeShows > 0) return 'Active Now';
    if (screen.upcomingShows > 0) return 'Scheduled';
    return 'Idle';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-red-900">Screen Management</h2>
          <p className="text-sm text-white/60">
            View screens and their running shows
          </p>
        </div>
      </div>

      {/* Theater Selector */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <label className="block text-sm font-medium mb-2">Select Theater</label>
        <select
          value={selectedTheaterId}
          onChange={(e) => setSelectedTheaterId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition"
        >
          {myTheaters.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} - {t.city}
            </option>
          ))}
        </select>
      </div>

      {/* Screens Overview */}
      {selectedTheater && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Screens</p>
                <p className="text-2xl font-bold text-white">{screenData.length}</p>
              </div>
              <FiMonitor className="h-8 w-8 text-brand" />
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Shows</p>
                <p className="text-2xl font-bold text-green-400">
                  {screenData.reduce((sum, s) => sum + s.activeShows, 0)}
                </p>
              </div>
              <FiFilm className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Upcoming Shows</p>
                <p className="text-2xl font-bold text-blue-400">
                  {screenData.reduce((sum, s) => sum + s.upcomingShows, 0)}
                </p>
              </div>
              <FiCalendar className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (remove in production) */}
      {selectedTheater && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs">
          <p className="text-blue-300">
            <strong>Debug:</strong> Theater: {selectedTheater.name} | 
            Screens: {selectedTheater.screens?.length || 0} | 
            Total Shows: {allShows.length} | 
            Filtered Shows: {allShows.filter(s => {
              const tid = typeof s.theater === 'object' ? s.theater._id : s.theater;
              return tid === selectedTheaterId;
            }).length}
          </p>
        </div>
      )}

      {/* Screens List */}
      {!selectedTheater ? (
        <div className="text-center py-12 bg-white/5 rounded-xl">
          <FiMonitor className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No theater selected</h3>
          <p className="mt-1 text-sm text-gray-400">
            Select a theater to view its screens
          </p>
        </div>
      ) : screenData.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl">
          <FiMonitor className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No screens found</h3>
          <p className="mt-1 text-sm text-gray-400">
            This theater has no screens configured
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {screenData.map((screen) => {
            const isExpanded = expandedScreens.has(screen._id);
            
            return (
              <div 
                key={screen._id} 
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
              >
                {/* Screen Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleScreen(screen._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center">
                          <FiMonitor className="h-6 w-6 text-brand" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-white">{screen.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(screen)}`}>
                            {getStatusText(screen)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
                          <span className="flex items-center">
                            <FiUsers className="mr-1.5 h-4 w-4" />
                            {screen.capacity} seats
                          </span>
                          <span>•</span>
                          <span>{screen.totalShows} total shows</span>
                          {screen.movies.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{screen.movies.length} movie{screen.movies.length > 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm text-gray-400">Shows</div>
                        <div className="flex items-center space-x-2 text-sm">
                          {screen.activeShows > 0 && (
                            <span className="text-green-400">{screen.activeShows} active</span>
                          )}
                          {screen.upcomingShows > 0 && (
                            <span className="text-blue-400">{screen.upcomingShows} upcoming</span>
                          )}
                          {screen.activeShows === 0 && screen.upcomingShows === 0 && (
                            <span className="text-gray-400">No shows</span>
                          )}
                        </div>
                      </div>
                      
                      <button className="text-gray-400 hover:text-white transition-colors">
                        {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-white/10">
                    {/* Movies in this screen */}
                    {screen.movies.length > 0 && (
                      <div className="p-4 bg-white/5">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Movies Showing</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {screen.movies.map((movie) => (
                            <div key={movie._id} className="flex items-center space-x-2 bg-white/5 rounded-lg p-2">
                              <div className="flex-shrink-0 w-10 h-14 bg-gray-700 rounded overflow-hidden">
                                {movie.poster ? (
                                  <img 
                                    src={movie.poster} 
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FiFilm className="h-4 w-4 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">{movie.title}</p>
                                <p className="text-xs text-gray-400">{movie.language}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Shows */}
                    {screen.activeShowsList.length > 0 && (
                      <div className="p-4 border-t border-white/10">
                        <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                          Active Shows ({screen.activeShowsList.length})
                        </h4>
                        <div className="space-y-2">
                          {screen.activeShowsList.map((show) => (
                            <div key={show._id} className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-white">{show.movie?.title || 'Unknown Movie'}</p>
                                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-300">
                                    <span className="flex items-center">
                                      <FiClock className="mr-1 h-3 w-3" />
                                      {format(new Date(show.startTime), 'h:mm a')} - {format(new Date(show.endTime), 'h:mm a')}
                                    </span>
                                    <span>•</span>
                                    <span>₹{show.price}</span>
                                  </div>
                                </div>
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                                  Now Playing
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upcoming Shows */}
                    {screen.upcomingShowsList.length > 0 && (
                      <div className="p-4 border-t border-white/10">
                        <h4 className="text-sm font-medium text-blue-400 mb-3">
                          Upcoming Shows ({screen.upcomingShowsList.length})
                        </h4>
                        <div className="space-y-2">
                          {screen.upcomingShowsList.slice(0, 5).map((show) => (
                            <div key={show._id} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-white">{show.movie?.title || 'Unknown Movie'}</p>
                                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                                    <span className="flex items-center">
                                      <FiCalendar className="mr-1 h-3 w-3" />
                                      {format(new Date(show.startTime), 'MMM d, yyyy')}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center">
                                      <FiClock className="mr-1 h-3 w-3" />
                                      {format(new Date(show.startTime), 'h:mm a')}
                                    </span>
                                    <span>•</span>
                                    <span>₹{show.price}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {screen.upcomingShowsList.length > 5 && (
                            <p className="text-xs text-gray-400 text-center pt-2">
                              + {screen.upcomingShowsList.length - 5} more shows
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* No Shows */}
                    {screen.totalShows === 0 && (
                      <div className="p-8 text-center">
                        <FiFilm className="mx-auto h-8 w-8 text-gray-500 mb-2" />
                        <p className="text-sm text-gray-400">No shows scheduled for this screen</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
