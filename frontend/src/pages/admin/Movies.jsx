import { useState, useEffect, Fragment } from 'react';
import { adminService } from '../../services/adminService.js';
import { toast } from '../../lib/toast.js';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiLoader,
  FiFilm,
  FiAlertCircle,
  FiUpload,
  FiX,
  FiCalendar,
  FiHome,
  FiClock,
  FiVideo,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi';

// Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-2 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>
        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// Reusable Form Input
const FormInput = ({ label, name, value, onChange, type = 'text', required = false, as = 'input', placeholder = '', children }) => {
  const commonProps = {
    name,
    id: name,
    value: value || '',
    onChange,
    required,
    placeholder,
    className:
      'w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all duration-200',
  };

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea {...commonProps} rows={4} />
      ) : as === 'select' ? (
        <select {...commonProps}>{children}</select>
      ) : (
        <input {...commonProps} type={type} />
      )}
    </div>
  );
};

export default function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load all movies on component mount
  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getMovies();
      // Check the actual response structure and adjust accordingly
      if (response && response.data) {
        // If response.data is an array, use it directly
        if (Array.isArray(response.data)) {
          setMovies(response.data);
        } 
        // If response.data has a movies property, use that
        else if (response.data.movies) {
          setMovies(response.data.movies);
        }
        // If response.data is an object with data property
        else if (response.data.data && response.data.data.movies) {
          setMovies(response.data.data.movies);
        } else {
          console.log('Unexpected API response structure:', response);
          setMovies([]);
        }
      } else {
        console.error('Invalid response format:', response);
        setMovies([]);
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to load movies.');
      toast.error('Failed to load movies', err.message);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // --- Handlers ---

  const handleOpenModal = (movie = null) => {
    if (movie) {
      // Format for date input
      const formattedMovie = {
        ...movie,
        releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '',
        genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : '',
        cast: Array.isArray(movie.cast) ? movie.cast.join(', ') : '',
        status: movie.status || 'upcoming', // Default to upcoming if not set
      };
      setCurrentMovie(formattedMovie);
    } else {
      setCurrentMovie({ status: 'upcoming' }); // Clear for new movie, default to upcoming
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentMovie(null);
    setIsUploading(false);
  };

  const handleDelete = async (movieId) => {
    if (window.confirm('Are you sure you want to delete this movie? This will also delete all associated showtimes.')) {
      try {
        await adminService.deleteMovie(movieId);
        toast.success('Movie deleted successfully');
        fetchMovies(); // Refresh list
      } catch (err) {
        console.error('Error deleting movie:', err);
        toast.error('Failed to delete movie', err.message);
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentMovie((prev) => ({ ...prev, [name]: value }));
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!currentMovie?._id) {
      toast.error('Please save the movie first', 'You must create and save the movie before uploading a poster.');
      return;
    }
    
    setIsUploading(true);
    try {
      const data = await adminService.uploadPoster(currentMovie._id, file);
      // Update current movie in modal and the main list
      setCurrentMovie((prev) => ({ ...prev, poster: data.poster, posterPublicId: data.posterPublicId }));
      setMovies(prevMovies => prevMovies.map(m => m._id === currentMovie._id ? { ...m, poster: data.poster, posterPublicId: data.posterPublicId } : m));
      toast.success('Poster uploaded successfully!');
    } catch (err) {
      console.error('Error uploading poster:', err);
      toast.error('Poster upload failed', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMovie) return;
  
    // Prepare data for API (convert comma-separated strings to arrays)
    const movieData = {
      ...currentMovie,
      genre: currentMovie.genre?.split(',').map(g => g.trim()).filter(Boolean) || [],
      cast: currentMovie.cast?.split(',').map(c => c.trim()).filter(Boolean) || [],
      duration: Number(currentMovie.duration) || 0,
      ratingsAverage: Number(currentMovie.ratingsAverage) || 0,
      status: currentMovie.status || 'upcoming', // Send the new status field
    };
    
    // Delete the old isActive field if it exists
    delete movieData.isActive;
  
    // Don't send poster/posterPublicId unless they exist
    if (!movieData.poster) delete movieData.poster;
    if (!movieData.posterPublicId) delete movieData.posterPublicId;
  
    try {
      if (currentMovie._id) {
        // Update existing movie
        const response = await adminService.updateMovie(currentMovie._id, movieData);
        toast.success('Movie updated successfully');
        fetchMovies(); // Refresh the list
        handleCloseModal();
      } else {
        // Create new movie
        const response = await adminService.createMovie(movieData);
        // Handle different response structures
        const newMovie = response.data?.movie || response;
        toast.success('Movie created successfully');
        fetchMovies(); // Refresh the list
        
        // If there's a poster to upload, keep the modal open for poster upload
        if (currentMovie.posterFile) {
          setCurrentMovie({ ...newMovie, posterFile: currentMovie.posterFile });
        } else {
          handleCloseModal();
        }
      }
    } catch (err) {
      console.error('Error saving movie:', err);
      toast.error('Failed to save movie', err.response?.data?.message || err.message);
    }
  };
  
  // --- Render Functions ---

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <FiLoader className="animate-spin text-brand text-4xl" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-red-900/20 border border-red-700 rounded-lg text-red-300">
          <FiAlertCircle className="text-4xl mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchMovies}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (movies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/30 border-2 border-dashed border-gray-700 rounded-lg text-gray-300">
          <FiFilm className="text-5xl mb-3" />
          <h3 className="text-xl font-semibold text-white">No Movies Found</h3>
          <p className="mt-1">Get started by adding a new movie.</p>
          <p className="text-sm mt-1">(If you just started, try running the backend seeder: `npm run seed:import`)</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider"
                >
                  Movie
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider"
                >
                  Stats
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider"
                >
                  Insights
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/50 divide-y divide-gray-700">
              {movies.map((movie) => {
                // Calculate insights from populated data
                const theaters = [...new Set((movie.showtimes || []).map(s => s.theater?.name).filter(Boolean))];
                const totalBookings = (movie.showtimes || []).reduce((acc, show) => acc + (show.bookingCount || 0), 0);
                
                return (
                  <tr key={movie._id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-24 w-16">
                          <img
                            className="h-24 w-16 rounded-md object-cover border border-gray-700"
                            src={movie.poster || 'https://placehold.co/128x176/1f2937/9ca3af?text=No+Poster'}
                            alt={movie.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{movie.title}</div>
                          <div className="text-sm text-gray-300">{movie.director}</div>
                          <div className="text-xs text-gray-300 mt-1">{movie.language}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowGrap">
                       <div className="flex items-center text-sm text-gray-300 mb-1" title="Duration">
                        <FiClock className="w-4 h-4 mr-2 text-gray-400" />
                        {movie.duration} mins
                      </div>
                      <div className="flex items-center text-sm text-gray-300" title="Rating">
                        <FiStar className="w-4 h-4 mr-2 text-yellow-500" />
                        {movie.ratingsAverage?.toFixed(1) || 'N/A'} ({movie.ratingsCount || 0})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-300 mb-1" title="Active Shows">
                        <FiVideo className="w-4 h-4 mr-2 text-blue-400" />
                        {(movie.showtimes || []).length} Active Show
                        {(movie.showtimes || []).length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center text-sm text-gray-300 mb-1" title="Total Bookings on Active Shows">
                        <FiTrendingUp className="w-4 h-4 mr-2 text-green-500" />
                        {totalBookings} Booking{totalBookings !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center text-sm text-gray-300" title="Theaters Running This Movie">
                        <FiHome className="w-4 h-4 mr-2 text-purple-400" />
                        {theaters.length} Theater{theaters.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* --- UPDATED: Show status with 3 colors --- */}
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          movie.status === 'active'
                            ? 'bg-green-900/50 text-green-300 border border-green-700'
                            : movie.status === 'upcoming'
                            ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                            : 'bg-red-900/50 text-red-300 border border-red-700'
                        }`}
                      >
                        {movie.status ? (movie.status.charAt(0).toUpperCase() + movie.status.slice(1)) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleOpenModal(movie)}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors p-1"
                        title="Edit Movie"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(movie._id)}
                        className="text-red-500 hover:text-red-400 transition-colors p-1"
                        title="Delete Movie"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-red-900">Movie Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-medium rounded-lg shadow-lg hover:shadow-brand/30 transition-all duration-200"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Add New Movie
        </button>
      </div>

      {renderContent()}

      {/* Add/Edit Movie Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentMovie?._id ? 'Edit Movie' : 'Add New Movie'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Title" name="title" value={currentMovie?.title} onChange={handleFormChange} required />
            <FormInput label="Director" name="director" value={currentMovie?.director} onChange={handleFormChange} required />
          </div>

          <FormInput label="Description" name="description" value={currentMovie?.description} onChange={handleFormChange} as="textarea" required />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FormInput label="Duration (minutes)" name="duration" type="number" value={currentMovie?.duration} onChange={handleFormChange} required />
            <FormInput label="Language" name="language" value={currentMovie?.language} onChange={handleFormChange} required />
            <FormInput label="Release Date" name="releaseDate" type="date" value={currentMovie?.releaseDate} onChange={handleFormChange} required />
          </div>
          
          <FormInput label="Genre (comma-separated)" name="genre" value={currentMovie?.genre} onChange={handleFormChange} placeholder="e.g. Action, Sci-Fi, Drama" />
          <FormInput label="Cast (comma-separated)" name="cast" value={currentMovie?.cast} onChange={handleFormChange} placeholder="e.g. Actor 1, Actor 2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Trailer URL (e.g., YouTube)" name="trailer" type="url" value={currentMovie?.trailer} onChange={handleFormChange} />
            <FormInput label="Rating (0-10, auto-calculated)" name="ratingsAverage" type="number" value={currentMovie?.ratingsAverage} onChange={handleFormChange} />
          </div>

          {/* Poster Upload - Only for existing movies */}
          {currentMovie?._id && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Movie Poster</label>
              <div className="flex items-center gap-4">
                <img 
                  src={currentMovie.poster || 'https://placehold.co/128x176/1f2937/9ca3af?text=No+Poster'} 
                  alt="Poster Preview" 
                  className="w-20 h-28 object-cover rounded-md border border-gray-700 bg-gray-900"
                />
                <label className="relative cursor-pointer flex items-center px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors">
                  {isUploading ? (
                    <FiLoader className="animate-spin w-5 h-5 mr-2" />
                  ) : (
                    <FiUpload className="w-5 h-5 mr-2" />
                  )}
                  {isUploading ? 'Uploading...' : 'Change Poster'}
                  <input type="file" className="hidden" accept="image/*" onChange={handlePosterUpload} disabled={isUploading} />
                </label>
              </div>
              <p className="text-xs text-gray-300 mt-2">Uploading a new poster will replace the old one and save immediately.</p>
            </div>
          )}
          
          {/* Poster Upload - For NEW movies (disabled until saved) */}
          {!currentMovie?._id && (
             <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Movie Poster</label>
               <div className="flex items-center gap-4">
                 <img 
                  src={'https://placehold.co/128x176/1f2937/9ca3af?text=Save+First'} 
                  alt="Poster Preview" 
                  className="w-20 h-28 object-cover rounded-md border border-gray-700 bg-gray-900"
                />
                <button type="button" disabled className="relative cursor-not-allowed flex items-center px-4 py-2.5 bg-gray-700 text-white font-medium rounded-lg opacity-50">
                  <FiUpload className="w-5 h-5 mr-2" />
                  Upload Poster
                </button>
               </div>
              <p className="text-xs text-gray-300 mt-2">You must "Create Movie" first before you can upload a poster.</p>
            </div>
          )}

          {/* --- UPDATED: Status Dropdown --- */}
          <FormInput 
            label="Status" 
            name="status" 
            as="select" 
            value={currentMovie?.status} 
            onChange={handleFormChange}
            required
          >
            <option value="upcoming">Upcoming</option>
            <option value="active">Active (Now Showing)</option>
            <option value="inactive">Inactive (Hidden)</option>
          </FormInput>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-dark transition-colors"
            >
              {currentMovie?._id ? 'Update Movie' : 'Create Movie'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}