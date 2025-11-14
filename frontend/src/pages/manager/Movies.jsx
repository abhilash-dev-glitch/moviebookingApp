import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FiFilm, FiClock, FiMapPin, FiCalendar, FiStar } from 'react-icons/fi';
import { format } from 'date-fns';

export default function ManagerMovies() {
  const { myTheaters, allShows } = useOutletContext();
  const [selectedTheater, setSelectedTheater] = useState('all');

  // Extract unique movies from shows
  const moviesInTheaters = useMemo(() => {
    const movieMap = new Map();
    
    allShows.forEach(show => {
      if (!show.movie) return;
      
      const movieId = typeof show.movie === 'object' ? show.movie._id : show.movie;
      const movieData = typeof show.movie === 'object' ? show.movie : null;
      
      if (!movieData) return;
      
      if (!movieMap.has(movieId)) {
        movieMap.set(movieId, {
          ...movieData,
          theaters: new Set(),
          shows: [],
          totalShows: 0,
        });
      }
      
      const movie = movieMap.get(movieId);
      movie.theaters.add(show.theaterName || 'Unknown Theater');
      movie.shows.push(show);
      movie.totalShows++;
    });
    
    // Convert Set to Array for theaters
    return Array.from(movieMap.values()).map(movie => ({
      ...movie,
      theaters: Array.from(movie.theaters),
    }));
  }, [allShows]);

  // Filter movies by selected theater
  const filteredMovies = useMemo(() => {
    if (selectedTheater === 'all') {
      return moviesInTheaters;
    }
    
    return moviesInTheaters.filter(movie => 
      movie.shows.some(show => show.theaterName === selectedTheater)
    );
  }, [moviesInTheaters, selectedTheater]);

  // Get shows for a specific movie and theater
  const getMovieShows = (movie) => {
    if (selectedTheater === 'all') {
      return movie.shows;
    }
    return movie.shows.filter(show => show.theaterName === selectedTheater);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-red-900">Movies in My Theaters</h2>
          <p className="text-sm text-white/60">
            View all movies currently showing in your assigned theaters
          </p>
        </div>
      </div>

      {/* Theater Filter */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <label className="block text-sm font-medium mb-2">Filter by Theater</label>
        <select
          value={selectedTheater}
          onChange={(e) => setSelectedTheater(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition"
        >
          <option value="all">All Theaters ({myTheaters.length})</option>
          {myTheaters.map((theater) => (
            <option key={theater._id} value={theater.name}>
              {theater.name} - {theater.city}
            </option>
          ))}
        </select>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl">
          <FiFilm className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No movies found</h3>
          <p className="mt-1 text-sm text-gray-400">
            {selectedTheater === 'all' 
              ? 'No movies are currently showing in your theaters'
              : `No movies are currently showing in ${selectedTheater}`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMovies.map((movie) => {
            const movieShows = getMovieShows(movie);
            const upcomingShows = movieShows.filter(show => new Date(show.startTime) > new Date());
            
            return (
              <div key={movie._id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-brand/50 transition-all">
                <div className="flex">
                  {/* Movie Poster */}
                  <div className="flex-shrink-0 w-32 h-48 bg-gray-700">
                    {movie.poster ? (
                      <img 
                        src={movie.poster} 
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiFilm className="h-12 w-12 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Movie Details */}
                  <div className="flex-1 p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{movie.title}</h3>
                    
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <FiClock className="h-4 w-4 text-gray-400" />
                        <span>{movie.duration} mins</span>
                        <span>•</span>
                        <span>{movie.language}</span>
                      </div>
                      
                      {movie.ratingsAverage > 0 && (
                        <div className="flex items-center space-x-2">
                          <FiStar className="h-4 w-4 text-yellow-400" />
                          <span>{movie.ratingsAverage.toFixed(1)}/10</span>
                          <span className="text-gray-400">({movie.ratingsCount} reviews)</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <FiMapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {selectedTheater === 'all' 
                            ? `${movie.theaters.length} theater${movie.theaters.length > 1 ? 's' : ''}`
                            : selectedTheater
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <FiCalendar className="h-4 w-4 text-gray-400" />
                        <span>{movieShows.length} total shows</span>
                        {upcomingShows.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-green-400">{upcomingShows.length} upcoming</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Genre Tags */}
                    {movie.genre && movie.genre.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {movie.genre.slice(0, 3).map((g, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-brand/20 text-brand text-xs rounded-full"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Theater List (when showing all theaters) */}
                {selectedTheater === 'all' && movie.theaters.length > 0 && (
                  <div className="px-4 py-3 bg-white/5 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Showing in:</p>
                    <div className="flex flex-wrap gap-2">
                      {movie.theaters.map((theaterName, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                        >
                          {theaterName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Show Info */}
                {upcomingShows.length > 0 && (
                  <div className="px-4 py-3 bg-brand/10 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Next show:</p>
                    <p className="text-sm text-white">
                      {format(new Date(upcomingShows[0].startTime), 'MMM d, yyyy • h:mm a')}
                      {upcomingShows[0].theaterName && selectedTheater === 'all' && (
                        <span className="text-gray-400"> • {upcomingShows[0].theaterName}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {filteredMovies.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-brand">{filteredMovies.length}</p>
              <p className="text-sm text-gray-400">Movies</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand">
                {filteredMovies.reduce((sum, m) => sum + m.totalShows, 0)}
              </p>
              <p className="text-sm text-gray-400">Total Shows</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand">
                {filteredMovies.reduce((sum, m) => sum + m.shows.filter(s => new Date(s.startTime) > new Date()).length, 0)}
              </p>
              <p className="text-sm text-gray-400">Upcoming Shows</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand">
                {selectedTheater === 'all' ? myTheaters.length : 1}
              </p>
              <p className="text-sm text-gray-400">Theater{selectedTheater === 'all' && myTheaters.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
