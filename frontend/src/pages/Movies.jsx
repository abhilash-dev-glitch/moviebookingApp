import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MoviesAPI } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { toast } from '../lib/toast';

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get filter, search query, and page from URL
  const filter = searchParams.get('filter') || 'now-showing';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  // Pagination settings
  const moviesPerPage = 10;
  const [totalMovies, setTotalMovies] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Define API parameters based on the selected filter
    let params = {};
    switch(filter) {
      case 'now-showing':
        params = { view: 'active', sort: '-releasedAt' };
        break;
      case 'coming-soon':
        params = { view: 'upcoming', sort: 'releasedAt' };
        break;
      case 'top-rated':
        params = { view: 'all', sort: '-rating', limit: 10 };
        break;
      default:
        params = { view: 'active', sort: '-releasedAt' };
    }

    // Fetch movies based on the selected filter
    MoviesAPI.list(params)
      .then(moviesData => {
        if (!moviesData || !Array.isArray(moviesData)) {
          console.error('Invalid movies data received:', moviesData);
          setError('Invalid data received from server');
          return;
        }
        
        // Filter out any invalid movie objects
        let validMovies = moviesData.filter(movie => 
          movie && 
          (movie.title || movie.name) && 
          (movie.poster || movie.image)
        );

        // Apply search filter if search query exists
        if (searchQuery) {
          validMovies = validMovies.filter(movie => {
            const title = (movie.title || movie.name || '').toLowerCase();
            const description = (movie.description || '').toLowerCase();
            const genres = Array.isArray(movie.genre) ? movie.genre.join(' ').toLowerCase() : '';
            const query = searchQuery.toLowerCase();
            
            return title.includes(query) || description.includes(query) || genres.includes(query);
          });
        }
        
        if (validMovies.length === 0 && moviesData.length > 0) {
          console.warn('No valid movies found in response:', moviesData);
        }
        
        // Set total movies for pagination
        setTotalMovies(validMovies.length);
        
        // Apply pagination
        const startIndex = (currentPage - 1) * moviesPerPage;
        const endIndex = startIndex + moviesPerPage;
        const paginatedMovies = validMovies.slice(startIndex, endIndex);
        
        setMovies(paginatedMovies);
      })
      .catch(err => {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
        toast.error('Error', 'Failed to load movies');
        setMovies([]); // Ensure movies is always an array
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filter, searchQuery, currentPage]);

  // Filter buttons configuration
  const filters = [
    { id: 'now-showing', label: 'Now Showing' },
    { id: 'coming-soon', label: 'Coming Soon' },
    { id: 'top-rated', label: 'Top Rated' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {searchQuery 
              ? `Search Results for "${searchQuery}"` 
              : filter === 'now-showing' ? 'Now Showing' 
              : filter === 'coming-soon' ? 'Coming Soon' 
              : 'Top Rated Movies'}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {filter === 'now-showing' 
              ? 'Book your tickets for the latest blockbusters in theaters now!'
              : filter === 'coming-soon' 
                ? 'Get ready for these exciting upcoming releases.'
                : 'Highest rated movies based on audience reviews.'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {filters.map((f) => (
            <Link
              key={f.id}
              to={`/movies?filter=${f.id}`}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-brand text-white shadow-lg shadow-brand/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-[2/3] bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-700 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand text-white rounded hover:bg-brand-dark transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Movies Grid */}
        {!loading && !error && (
          <>
            {movies.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {movies.map((movie) => (
                    <MovieCard key={movie._id || movie.id} movie={movie} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalMovies > moviesPerPage && (
                  <div className="mt-12 flex justify-center items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('page', Math.max(1, currentPage - 1).toString());
                        setSearchParams(newParams);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    {(() => {
                      const totalPages = Math.ceil(totalMovies / moviesPerPage);
                      const pages = [];
                      
                      // Show max 5 page numbers
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, startPage + 4);
                      
                      if (endPage - startPage < 4) {
                        startPage = Math.max(1, endPage - 4);
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => {
                              const newParams = new URLSearchParams(searchParams);
                              newParams.set('page', i.toString());
                              setSearchParams(newParams);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              currentPage === i
                                ? 'bg-brand text-white'
                                : 'bg-gray-800 text-white hover:bg-gray-700'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}
                    
                    {/* Next Button */}
                    <button
                      onClick={() => {
                        const totalPages = Math.ceil(totalMovies / moviesPerPage);
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('page', Math.min(totalPages, currentPage + 1).toString());
                        setSearchParams(newParams);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage >= Math.ceil(totalMovies / moviesPerPage)}
                      className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                    
                    {/* Page Info */}
                    <span className="ml-4 text-sm text-gray-400">
                      Page {currentPage} of {Math.ceil(totalMovies / moviesPerPage)} ({totalMovies} movies)
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {searchQuery 
                    ? `No movies found matching "${searchQuery}". Try different keywords.`
                    : filter === 'now-showing' 
                    ? 'No movies currently showing. Please check back soon!'
                    : filter === 'coming-soon'
                      ? 'No upcoming movies announced yet.'
                      : 'No top-rated movies found.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
