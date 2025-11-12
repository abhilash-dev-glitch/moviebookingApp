import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MoviesAPI } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { toast } from '../lib/toast';

export default function Movies() {
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get filter from URL or default to 'now-showing'
  const filter = searchParams.get('filter') || 'now-showing';

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
      .then(data => {
        setMovies(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
        toast.error('Error', 'Failed to load movies');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filter]);

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
            {filter === 'now-showing' ? 'Now Showing' : 
             filter === 'coming-soon' ? 'Coming Soon' : 'Top Rated Movies'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {movies.map((movie) => (
                  <MovieCard key={movie._id || movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {filter === 'now-showing' 
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
