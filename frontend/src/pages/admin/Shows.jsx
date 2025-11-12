import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const Shows = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState({
    shows: false,
    movies: false,
    theaters: false,
    screens: false
  });
  
  const [formData, setFormData] = useState({
    movie: '',
    theater: '',
    screen: '',
    date: '',
    startTime: '',
    endTime: '',
    price: 0,
    type: '2D',
    status: 'scheduled',
    availableSeats: 0,
    totalSeats: 0,
  });
  
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    movie: '',
    theater: '',
    date: '',
    status: 'all',
    type: 'all',
  });

  // Fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, shows: true, movies: true, theaters: true }));
        
        const [showsRes, moviesRes, theatersRes] = await Promise.all([
          api.get('/shows'),
          api.get('/movies'),
          api.get('/theaters')
        ]);
        
        setShows(showsRes.data);
        setMovies(moviesRes.data);
        setTheaters(theatersRes.data);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(prev => ({ ...prev, shows: false, movies: false, theaters: false }));
      }
    };
    
    fetchData();
  }, []);

  // Fetch screens when theater is selected
  useEffect(() => {
    const fetchScreens = async () => {
      if (formData.theater) {
        try {
          setLoading(prev => ({ ...prev, screens: true }));
          const response = await api.get(`/theaters/${formData.theater}/screens`);
          setScreens(response.data);
        } catch (error) {
          console.error('Error fetching screens:', error);
        } finally {
          setLoading(prev => ({ ...prev, screens: false }));
        }
      } else {
        setScreens([]);
      }
    };
    
    fetchScreens();
  }, [formData.theater]);

  // Calculate end time based on movie duration and start time
  useEffect(() => {
    if (formData.movie && formData.startTime) {
      const selectedMovie = movies.find(m => m._id === formData.movie);
      if (selectedMovie) {
        const [hours, minutes] = formData.startTime.split(':');
        const startDate = new Date();
        startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        
        const endDate = new Date(startDate.getTime() + selectedMovie.duration * 60000);
        const endTime = endDate.toTimeString().slice(0, 5);
        
        setFormData(prev => ({
          ...prev,
          endTime,
          availableSeats: prev.availableSeats || 0,
          totalSeats: prev.totalSeats || 0
        }));
      }
    }
  }, [formData.movie, formData.startTime, movies]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScreenChange = (e) => {
    const screenId = e.target.value;
    const selectedScreen = screens.find(s => s._id === screenId);
    
    setFormData(prev => ({
      ...prev,
      screen: screenId,
      totalSeats: selectedScreen?.seats?.length || 0,
      availableSeats: selectedScreen?.seats?.length || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const showData = {
        ...formData,
        price: parseFloat(formData.price),
        availableSeats: parseInt(formData.availableSeats, 10),
        totalSeats: parseInt(formData.totalSeats, 10),
      };
      
      if (editingId) {
        await api.put(`/shows/${editingId}`, showData);
      } else {
        await api.post('/shows', showData);
      }
      
      // Refresh shows data
      const { data } = await api.get('/shows');
      setShows(data);
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error saving show:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      movie: '',
      theater: '',
      screen: '',
      date: '',
      startTime: '',
      endTime: '',
      price: 0,
      type: '2D',
      status: 'scheduled',
      availableSeats: 0,
      totalSeats: 0,
    });
    setEditingId(null);
  };

  const handleEdit = (show) => {
    setFormData({
      movie: show.movie?._id || show.movie,
      theater: show.theater?._id || show.theater,
      screen: show.screen?._id || show.screen,
      date: show.date ? new Date(show.date).toISOString().split('T')[0] : '',
      startTime: show.startTime,
      endTime: show.endTime,
      price: show.price,
      type: show.type || '2D',
      status: show.status || 'scheduled',
      availableSeats: show.availableSeats || 0,
      totalSeats: show.totalSeats || 0,
    });
    setEditingId(show._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this show? This action cannot be undone.')) {
      try {
        await api.delete(`/shows/${id}`);
        const { data } = await api.get('/shows');
        setShows(data);
      } catch (error) {
        console.error('Error deleting show:', error);
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'cancelled' : 'active';
    try {
      await api.patch(`/shows/${id}`, { status: newStatus });
      const { data } = await api.get('/shows');
      setShows(data);
    } catch (error) {
      console.error('Error updating show status:', error);
    }
  };

  // Filter and sort shows
  const filteredShows = shows.filter(show => {
    const matchesSearch = 
      (show.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (show.theater?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMovie = !filters.movie || show.movie?._id === filters.movie || show.movie === filters.movie;
    const matchesTheater = !filters.theater || show.theater?._id === filters.theater || show.theater === filters.theater;
    const matchesDate = !filters.date || (new Date(show.date).toDateString() === new Date(filters.date).toDateString());
    const matchesStatus = filters.status === 'all' || show.status === filters.status;
    const matchesType = filters.type === 'all' || show.type === filters.type;
    
    return matchesSearch && matchesMovie && matchesTheater && matchesDate && matchesStatus && matchesType;
  }).sort((a, b) => {
    // Sort by date and time
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA - dateB;
  });

  // Get unique show dates for filter
  const showDates = [...new Set(shows.map(show => show.date))].sort();

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Edit Show' : 'Add New Show'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Movie Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Movie</label>
              <select
                name="movie"
                value={formData.movie}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={loading.movies}
              >
                <option value="">Select a movie</option>
                {movies.map(movie => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title} ({movie.duration} mins)
                  </option>
                ))}
              </select>
            </div>

            {/* Theater Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Theater</label>
              <select
                name="theater"
                value={formData.theater}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={loading.theaters}
              >
                <option value="">Select a theater</option>
                {theaters.map(theater => (
                  <option key={theater._id} value={theater._id}>
                    {theater.name}, {theater.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Screen Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Screen</label>
              <select
                name="screen"
                value={formData.screen}
                onChange={handleScreenChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={!formData.theater || loading.screens}
              >
                <option value="">Select a screen</option>
                {screens.map(screen => (
                  <option key={screen._id} value={screen._id}>
                    {screen.name} ({screen.seats?.length || 0} seats)
                  </option>
                ))}
              </select>
            </div>

            {/* Show Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            {/* End Time (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Show Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX">IMAX</option>
                <option value="4DX">4DX</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Seats Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Seats</label>
              <input
                type="number"
                name="totalSeats"
                min="1"
                value={formData.totalSeats}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Available Seats</label>
              <input
                type="number"
                name="availableSeats"
                min="0"
                max={formData.totalSeats}
                value={formData.availableSeats}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading.shows}
            >
              {loading.shows ? 'Saving...' : (editingId ? 'Update Show' : 'Add Show')}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Manage Shows</h2>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <input
                type="text"
                placeholder="Search shows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Movie Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Movie</label>
              <select
                value={filters.movie}
                onChange={(e) => setFilters({...filters, movie: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Movies</option>
                {movies.map(movie => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Theater Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Theater</label>
              <select
                value={filters.theater}
                onChange={(e) => setFilters({...filters, theater: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Theaters</option>
                {theaters.map(theater => (
                  <option key={theater._id} value={theater._id}>
                    {theater.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <select
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Dates</option>
                {showDates.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX">IMAX</option>
                <option value="4DX">4DX</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading.shows ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading shows...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Movie
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Theater & Screen
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seats
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShows.length > 0 ? (
                  filteredShows.map((show) => {
                    const showDate = new Date(show.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const isPastShow = showDate < today || 
                                     (showDate.toDateString() === today.toDateString() && 
                                      new Date(`${show.date}T${show.endTime}`) < new Date());
                    
                    return (
                      <tr 
                        key={show._id} 
                        className={`${isPastShow ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {show.movie?.title || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {show.movie?.duration} mins
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {show.theater?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {show.screen?.name || 'Screen N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {showDate.toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {show.startTime} - {show.endTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            show.type === '2D' ? 'bg-blue-100 text-blue-800' :
                            show.type === '3D' ? 'bg-purple-100 text-purple-800' :
                            show.type === 'IMAX' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-indigo-100 text-indigo-800'
                          }`}>
                            {show.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900">
                            {show.availableSeats} / {show.totalSeats}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{
                                width: `${(show.availableSeats / show.totalSeats) * 100}%`,
                                backgroundColor: (show.availableSeats / show.totalSeats) < 0.2 ? '#DC2626' : '#4F46E5'
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            onClick={() => !isPastShow && toggleStatus(show._id, show.status === 'active')}
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                              show.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                              show.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              isPastShow ? 'bg-gray-100 text-gray-800' :
                              'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {isPastShow ? 'Completed' : show.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!isPastShow && (
                            <>
                              <button
                                onClick={() => handleEdit(show)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(show._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No shows found. {searchTerm ? 'Try a different search term.' : 'Add a new show to get started.'}
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

export default Shows;
