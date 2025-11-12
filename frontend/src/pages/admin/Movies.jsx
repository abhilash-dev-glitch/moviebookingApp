import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: [],
    duration: 0,
    releaseDate: '',
    poster: '',
    trailer: '',
    status: 'upcoming',
    cast: [],
    director: '',
    language: '',
    rating: 0,
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    genre: '',
    sortBy: 'releaseDate',
    sortOrder: 'desc',
  });

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/movies');
      setMovies(data);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/movies/${editingId}`, formData);
      } else {
        await api.post('/movies', formData);
      }
      setFormData({
        title: '',
        description: '',
        genre: [],
        duration: 0,
        releaseDate: '',
        poster: '',
        trailer: '',
        status: 'upcoming',
        cast: [],
        director: '',
        language: '',
        rating: 0,
      });
      setEditingId(null);
      fetchMovies();
    } catch (error) {
      console.error('Error saving movie:', error);
    }
  };

  const handleEdit = (movie) => {
    setFormData({
      title: movie.title,
      description: movie.description,
      genre: movie.genre || [],
      duration: movie.duration,
      releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
      poster: movie.poster || '',
      trailer: movie.trailer || '',
      status: movie.status || 'upcoming',
      cast: movie.cast || [],
      director: movie.director || '',
      language: movie.language || '',
      rating: movie.rating || 0,
    });
    setEditingId(movie._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await api.delete(`/movies/${id}`);
        fetchMovies();
      } catch (error) {
        console.error('Error deleting movie:', error);
      }
    }
  };

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.director?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || movie.status === filters.status;
    const matchesGenre = !filters.genre || movie.genre?.includes(filters.genre);
    
    return matchesSearch && matchesStatus && matchesGenre;
  }).sort((a, b) => {
    if (filters.sortBy === 'title') {
      return filters.sortOrder === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (filters.sortBy === 'releaseDate') {
      return filters.sortOrder === 'asc'
        ? new Date(a.releaseDate) - new Date(b.releaseDate)
        : new Date(b.releaseDate) - new Date(a.releaseDate);
    } else if (filters.sortBy === 'rating') {
      return filters.sortOrder === 'asc' 
        ? (a.rating || 0) - (b.rating || 0)
        : (b.rating || 0) - (a.rating || 0);
    }
    return 0;
  });

  const allGenres = [...new Set(movies.flatMap(movie => movie.genre || []))];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Edit Movie' : 'Add New Movie'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Director</label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Release Date</label>
              <input
                type="date"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Poster URL</label>
              <input
                type="url"
                name="poster"
                value={formData.poster}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Trailer URL</label>
              <input
                type="url"
                name="trailer"
                value={formData.trailer}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Language</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="upcoming">Upcoming</option>
                <option value="now_showing">Now Showing</option>
                <option value="ended">Ended</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Cast (comma separated)</label>
              <input
                type="text"
                name="cast"
                value={formData.cast.join(', ')}
                onChange={(e) => {
                  const castArray = e.target.value.split(',').map(actor => actor.trim()).filter(Boolean);
                  setFormData(prev => ({ ...prev, cast: castArray }));
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Actor 1, Actor 2, Actor 3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Genres</label>
              <div className="mt-2 space-x-2">
                {['Action', 'Comedy', 'Drama', 'Thriller', 'Horror', 'Sci-Fi', 'Romance', 'Adventure'].map(genre => (
                  <label key={genre} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.genre.includes(genre)}
                      onChange={(e) => {
                        const newGenres = e.target.checked
                          ? [...formData.genre, genre]
                          : formData.genre.filter(g => g !== genre);
                        setFormData(prev => ({ ...prev, genre: newGenres }));
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{genre}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    genre: [],
                    duration: 0,
                    releaseDate: '',
                    poster: '',
                    trailer: '',
                    status: 'upcoming',
                    cast: [],
                    director: '',
                    language: '',
                    rating: 0,
                  });
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {editingId ? 'Update Movie' : 'Add Movie'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Manage Movies</h2>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="now_showing">Now Showing</option>
                <option value="ended">Ended</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Genre</label>
              <select
                value={filters.genre}
                onChange={(e) => setFilters({...filters, genre: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Genres</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="title">Title</option>
                <option value="releaseDate">Release Date</option>
                <option value="rating">Rating</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading movies...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poster
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Director
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Release Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMovies.length > 0 ? (
                  filteredMovies.map((movie) => (
                    <tr key={movie._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {movie.poster ? (
                          <img 
                            className="h-16 w-12 object-cover rounded" 
                            src={movie.poster} 
                            alt={movie.title} 
                          />
                        ) : (
                          <div className="h-16 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{movie.title}</div>
                        <div className="text-sm text-gray-500">
                          {movie.genre?.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movie.director}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          movie.status === 'now_showing' ? 'bg-green-100 text-green-800' :
                          movie.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {movie.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(movie.releaseDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(movie)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(movie._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No movies found. {searchTerm ? 'Try a different search term.' : 'Add a new movie to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;
