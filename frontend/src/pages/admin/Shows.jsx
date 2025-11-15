import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService'; // Corrected
import { toast } from '../../lib/toast'; // Corrected
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiLoader,
  FiAlertCircle,
  FiX,
  FiVideo,
} from 'react-icons/fi';

// Modal and FormInput components would be ideal to abstract
// For brevity, I'll keep the modal logic inline or simplified
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-2 transition-colors">
            <FiX size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const FormInput = ({ label, name, value, onChange, type = 'text', required = false, as = 'input', children }) => {
  const commonProps = {
    name,
    id: name,
    value: value || '',
    onChange,
    required,
    className: 'w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all duration-200',
  };
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {as === 'select' ? (
        <select {...commonProps}>{children}</select>
      ) : (
        <input {...commonProps} type={type} />
      )}
    </div>
  );
};

export default function AdminShows() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentShow, setCurrentShow] = useState(null);

  const [availableScreens, setAvailableScreens] = useState([]);

  // Helper function to extract data from API response
  const extractData = (response, key) => {
    if (!response || !response.data) return [];
    
    // If response.data is an array, return it
    if (Array.isArray(response.data)) {
      return response.data;
    } 
    // If response.data has the key, return that
    else if (response.data[key]) {
      return response.data[key];
    }
    // If response.data has a data property with the key
    else if (response.data.data && response.data.data[key]) {
      return response.data.data[key];
    }
    
    console.log('Unexpected API response structure for key', key, ':', response);
    return [];
  };

  // Fetch all necessary data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [showsResponse, moviesResponse, theatersResponse] = await Promise.all([
        adminService.getShowtimes(),
        adminService.getMovies(),
        adminService.getTheaters(),
      ]);
      
      // Extract and set data based on response structure
      setShowtimes(extractData(showsResponse, 'showtimes'));
      setMovies(extractData(moviesResponse, 'movies'));
      setTheaters(extractData(theatersResponse, 'theaters'));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load show data.');
      toast.error('Failed to load data', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update available screens when theater selection changes in the form
  useEffect(() => {
    if (currentShow?.theater) {
      const selectedTheater = theaters.find(t => t._id === currentShow.theater);
      setAvailableScreens(selectedTheater?.screens || []);
    } else {
      setAvailableScreens([]);
    }
  }, [currentShow?.theater, theaters]);
  
  // Calculate end time when start time or movie duration changes
  useEffect(() => {
    if (currentShow?.movie && currentShow?.startTime && currentShow?.date) {
      const selectedMovie = movies.find(m => m._id === currentShow.movie);
      if (selectedMovie) {
        const startDateTime = new Date(`${currentShow.date}T${currentShow.startTime}`);
        const endDateTime = new Date(startDateTime.getTime() + selectedMovie.duration * 60000);
        
        const endTime = endDateTime.toTimeString().slice(0, 5); // Format as HH:MM
        setCurrentShow(prev => ({ ...prev, endTime }));
      }
    }
  }, [currentShow?.movie, currentShow?.startTime, currentShow?.date, movies]);

  // --- Handlers ---
  
  const handleOpenModal = (show = null) => {
    if (show) {
      const startTime = new Date(show.startTime);
      const hours24 = startTime.getHours();
      const minutes = startTime.getMinutes();
      
      // Convert 24-hour to 12-hour format
      let hours12 = hours24 % 12;
      if (hours12 === 0) hours12 = 12;
      const period = hours24 >= 12 ? 'PM' : 'AM';
      
      setCurrentShow({
        ...show,
        movie: show.movie?._id,
        theater: show.theater?._id,
        date: startTime.toISOString().split('T')[0],
        endDate: show.endDate ? new Date(show.endDate).toISOString().split('T')[0] : startTime.toISOString().split('T')[0],
        startTime: startTime.toTimeString().slice(0, 5),
        startHour: hours12.toString(),
        startMinute: minutes.toString().padStart(2, '0'),
        startPeriod: period,
      });
    } else {
      setCurrentShow({
        price: 150, // Default price
        isActive: true,
        startHour: '12',
        startMinute: '00',
        startPeriod: 'PM',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentShow(null);
    setAvailableScreens([]);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentShow((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleScreenChange = (e) => {
     const screenName = e.target.value;
     const selectedScreen = availableScreens.find(s => s.name === screenName);
     setCurrentShow(prev => ({
       ...prev,
       screen: screenName,
       availableSeats: selectedScreen?.capacity || 0,
       totalSeats: selectedScreen?.capacity || 0,
     }));
  };

  const handleDelete = async (showId) => {
    if (window.confirm('Are you sure you want to delete this show? This will also delete all associated bookings.')) {
      try {
        await adminService.deleteShowtime(showId);
        toast.success('Show deleted successfully');
        fetchAllData(); // Refresh list
      } catch (err) {
        console.error('Error deleting show:', err);
        toast.error('Failed to delete show', err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentShow) return;

    // Validate end date is not before start date
    if (new Date(currentShow.endDate) < new Date(currentShow.date)) {
      toast.error('End date cannot be before start date');
      return;
    }

    // Combine date and time into a full ISO string for start and end
    const startDateTime = new Date(`${currentShow.date}T${currentShow.startTime}`);
    const endDateTime = new Date(`${currentShow.date}T${currentShow.endTime}`);
    const endDateOnly = new Date(currentShow.endDate);

    const showData = {
      ...currentShow,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      endDate: endDateOnly.toISOString(),
      price: Number(currentShow.price),
      availableSeats: Number(currentShow.availableSeats),
      totalSeats: Number(currentShow.totalSeats),
    };
    
    // Remove date field as it's merged into startTime/endTime
    delete showData.date; 

    try {
      if (currentShow._id) {
        await adminService.updateShowtime(currentShow._id, showData);
        toast.success('Show updated successfully');
      } else {
        await adminService.createShowtime(showData);
        toast.success('Show created successfully');
      }
      handleCloseModal();
      fetchAllData(); // Refresh the list
    } catch (err) {
      console.error('Error saving show:', err);
      toast.error('Failed to save show', err.response?.data?.message || err.message);
    }
  };
  
  // --- Helper Functions ---
  
  const isShowExpired = (show) => {
    if (!show.endDate) return false;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const ed = new Date(show.endDate);
    const endDate = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());
    
    return endDate < today;
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
            onClick={fetchAllData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (showtimes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/30 border-2 border-dashed border-gray-700 rounded-lg text-gray-300">
          <FiVideo className="text-5xl mb-3" />
          <h3 className="text-xl font-semibold text-white">No Shows Found</h3>
          <p className="mt-1">Get started by adding a new show.</p>
        </div>
      );
    }
    
    // Separate shows into active and expired
    const activeShows = showtimes.filter(show => !isShowExpired(show) && show.isActive);
    const inactiveShows = showtimes.filter(show => !isShowExpired(show) && !show.isActive);
    const expiredShows = showtimes.filter(show => isShowExpired(show));

    return (
      <div className="space-y-8">
        {/* Active Shows Section */}
        {activeShows.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <h2 className="text-xl font-semibold text-white">Active Shows ({activeShows.length})</h2>
            </div>
            {renderShowTable(activeShows, 'active')}
          </div>
        )}
        
        {/* Inactive Shows Section */}
        {inactiveShows.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-gray-500"></div>
              <h2 className="text-xl font-semibold text-white">Inactive Shows ({inactiveShows.length})</h2>
            </div>
            {renderShowTable(inactiveShows, 'inactive')}
          </div>
        )}
        
        {/* Expired Shows Section */}
        {expiredShows.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <h2 className="text-xl font-semibold text-white">Expired Shows ({expiredShows.length})</h2>
            </div>
            {renderShowTable(expiredShows, 'expired')}
          </div>
        )}
      </div>
    );
  };
  
  const renderShowTable = (shows, type) => {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Movie</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Theater & Screen</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">End Date & Show Times</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Seats</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/50 divide-y divide-gray-700">
              {shows.map((show) => (
                <tr key={show._id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-16 w-12 rounded-md object-cover border border-gray-700" src={show.movie?.poster || 'https://placehold.co/128x176/1f2937/9ca3af?text=N/A'} alt={show.movie?.title} />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-white">{show.movie?.title}</div>
                        <div className="text-xs text-gray-300">{show.movie?.language}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{show.theater?.name}</div>
                    <div className="text-sm text-gray-300">{show.screen}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white mb-1">
                      End: {show.endDate ? new Date(show.endDate).toLocaleDateString() : new Date(show.startTime).toLocaleDateString()}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-indigo-900/50 text-indigo-300 text-xs rounded border border-indigo-700">
                        {new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {show.availableSeats} / {show.totalSeats || show.availableSeats}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ₹{show.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      type === 'expired'
                        ? 'bg-red-900/50 text-red-300 border border-red-700' 
                        : type === 'active'
                        ? 'bg-green-900/50 text-green-300 border border-green-700' 
                        : 'bg-gray-900/50 text-gray-300 border border-gray-700'
                    }`}>
                      {type === 'expired' ? 'Expired' : type === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button onClick={() => handleOpenModal(show)} className="text-indigo-400 hover:text-indigo-300 transition-colors p-1" title="Edit Show">
                      <FiEdit size={18} />
                    </button>
                    <button onClick={() => handleDelete(show._id)} className="text-red-500 hover:text-red-400 transition-colors p-1" title="Delete Show">
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-red-900">Show Management</h1>
        <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-medium rounded-lg shadow-lg hover:shadow-brand/30 transition-all duration-200">
          <FiPlus className="w-5 h-5 mr-2" />
          Add New Show
        </button>
      </div>

      {renderContent()}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentShow?._id ? 'Edit Show' : 'Add New Show'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Movie" name="movie" as="select" value={currentShow?.movie} onChange={handleFormChange} required>
              <option value="">Select a movie</option>
              {movies.map(movie => (
                <option key={movie._id} value={movie._id}>{movie.title}</option>
              ))}
            </FormInput>
            
            <FormInput label="Theater" name="theater" as="select" value={currentShow?.theater} onChange={handleFormChange} required>
              <option value="">Select a theater</option>
              {theaters.map(theater => (
                <option key={theater._id} value={theater._id}>{theater.name} ({theater.city})</option>
              ))}
            </FormInput>
          </div>

          <FormInput label="Screen" name="screen" as="select" value={currentShow?.screen} onChange={handleScreenChange} required>
            <option value="">Select a screen</option>
            {availableScreens.map(screen => (
              <option key={screen._id || screen.name} value={screen.name}>{screen.name} ({screen.capacity} seats)</option>
            ))}
          </FormInput>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Start Date" name="date" type="date" value={currentShow?.date} onChange={handleFormChange} required />
            <FormInput label="End Date (Last day of show)" name="endDate" type="date" value={currentShow?.endDate} onChange={handleFormChange} required />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Start Time (Hour)</label>
              <select
                name="startHour"
                value={currentShow?.startHour || '12'}
                onChange={(e) => {
                  const hour = e.target.value;
                  const minute = currentShow?.startMinute || '00';
                  const period = currentShow?.startPeriod || 'PM';
                  let hour24 = parseInt(hour);
                  if (period === 'PM' && hour24 !== 12) hour24 += 12;
                  if (period === 'AM' && hour24 === 12) hour24 = 0;
                  const timeString = `${hour24.toString().padStart(2, '0')}:${minute}`;
                  setCurrentShow(prev => ({ ...prev, startHour: hour, startTime: timeString }));
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                required
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Minute</label>
              <select
                name="startMinute"
                value={currentShow?.startMinute || '00'}
                onChange={(e) => {
                  const minute = e.target.value;
                  const hour = currentShow?.startHour || '12';
                  const period = currentShow?.startPeriod || 'PM';
                  let hour24 = parseInt(hour);
                  if (period === 'PM' && hour24 !== 12) hour24 += 12;
                  if (period === 'AM' && hour24 === 12) hour24 = 0;
                  const timeString = `${hour24.toString().padStart(2, '0')}:${minute}`;
                  setCurrentShow(prev => ({ ...prev, startMinute: minute, startTime: timeString }));
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                required
              >
                <option value="00">00</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">AM/PM</label>
              <select
                name="startPeriod"
                value={currentShow?.startPeriod || 'PM'}
                onChange={(e) => {
                  const period = e.target.value;
                  const hour = currentShow?.startHour || '12';
                  const minute = currentShow?.startMinute || '00';
                  let hour24 = parseInt(hour);
                  if (period === 'PM' && hour24 !== 12) hour24 += 12;
                  if (period === 'AM' && hour24 === 12) hour24 = 0;
                  const timeString = `${hour24.toString().padStart(2, '0')}:${minute}`;
                  setCurrentShow(prev => ({ ...prev, startPeriod: period, startTime: timeString }));
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                required
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Show Duration</label>
              <div className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-400">
                {currentShow?.date && currentShow?.endDate ? (
                  <>
                    {Math.ceil((new Date(currentShow.endDate) - new Date(currentShow.date)) / (1000 * 60 * 60 * 24)) + 1} days
                  </>
                ) : (
                  'Select dates to see duration'
                )}
              </div>
            </div>
            <FormInput label="End Time (auto-calculated)" name="endTime" type="time" value={currentShow?.endTime} onChange={handleFormChange} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <FormInput label="Price (INR)" name="price" type="number" value={currentShow?.price} onChange={handleFormChange} required />
             <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">End Time (auto-calculated)</label>
              <div className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-400">
                {currentShow?.endTime || 'Will be calculated based on movie duration'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <FormInput label="Available Seats" name="availableSeats" type="number" value={currentShow?.availableSeats} onChange={handleFormChange} required />
             <FormInput label="Total Seats" name="totalSeats" type="number" value={currentShow?.totalSeats} onChange={handleFormChange} required />
          </div>

          <div className="flex items-center pt-4">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={currentShow?.isActive || false}
              onChange={(e) => setCurrentShow(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-brand bg-gray-900 border-gray-700 rounded focus:ring-brand"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-300">
              Is this show active for booking?
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-dark transition-colors">
              {currentShow?._id ? 'Update Show' : 'Create Show'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}