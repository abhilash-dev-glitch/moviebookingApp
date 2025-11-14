import { useState, useEffect, Fragment } from 'react';
import { adminService } from '../../services/adminService.js'; // Corrected import path
import { toast } from '../../lib/toast.js'; // Corrected import path
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiLoader,
  FiAlertCircle,
  FiX,
  FiHome,
  FiVideo,
  FiTrendingUp,
  FiMapPin,
  FiFilm,
  FiGrid,
  FiPlusCircle,
  FiMinusCircle,
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
        className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl border border-gray-700 overflow-hidden"
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
const FormInput = ({ label, name, value, onChange, type = 'text', required = false, as = 'input', placeholder = '' }) => {
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
        <textarea {...commonProps} rows={3} />
      ) : (
        <input {...commonProps} type={type} />
      )}
    </div>
  );
};

// Default empty screen
const emptyScreen = { name: '', capacity: 50, seatLayout: Array(10).fill(Array(5).fill(1)) }; // 10x5 grid

export default function AdminTheaters() {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTheater, setCurrentTheater] = useState(null);

  // Load all theaters on component mount
  const fetchTheaters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getTheaters();
      // Check the actual response structure and adjust accordingly
      if (response && response.data) {
        // If response.data is an array, use it directly
        if (Array.isArray(response.data)) {
          setTheaters(response.data);
        } 
        // If response.data has a theaters property, use that
        else if (response.data.theaters) {
          setTheaters(response.data.theaters);
        }
        // If response.data is an object with data property
        else if (response.data.data && response.data.data.theaters) {
          setTheaters(response.data.data.theaters);
        } else {
          console.log('Unexpected API response structure:', response);
          setTheaters([]);
        }
      } else {
        console.error('Invalid response format:', response);
        setTheaters([]);
      }
    } catch (err) {
      console.error('Error fetching theaters:', err);
      setError('Failed to load theaters.');
      toast.error('Failed to load theaters', err.message);
      setTheaters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheaters();
  }, []);

  // --- Handlers ---

  const handleOpenModal = (theater = null) => {
    if (theater) {
      setCurrentTheater({
        ...theater,
        // Ensure coordinates are split for the form
        longitude: theater.location?.coordinates?.[0] || '',
        latitude: theater.location?.coordinates?.[1] || '',
        address: theater.location?.address || '',
        facilities: Array.isArray(theater.facilities) ? theater.facilities.join(', ') : '',
        phone: theater.contact?.phone || '',
        email: theater.contact?.email || '',
      });
    } else {
      setCurrentTheater({ 
        isActive: true, 
        screens: [{ ...emptyScreen, name: 'Screen 1' }],
        facilities: 'Parking, Food Court',
        longitude: 74.8722, // Default to Neerchal, Kerala area
        latitude: 12.5186,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTheater(null);
  };

  const handleDelete = async (theaterId) => {
    if (window.confirm('Are you sure you want to delete this theater? This will also delete all associated showtimes.')) {
      try {
        await adminService.deleteTheater(theaterId);
        toast.success('Theater deleted successfully');
        fetchTheaters(); // Refresh list
      } catch (err) {
        console.error('Error deleting theater:', err);
        toast.error('Failed to delete theater', err.message);
      }
    }
  };

  // Handle changes to top-level form fields
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentTheater((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle changes to nested screen fields
  const handleScreenChange = (index, field, value) => {
    const updatedScreens = [...currentTheater.screens];
    const capacity = field === 'capacity' ? Number(value) : updatedScreens[index].capacity;

    updatedScreens[index] = {
      ...updatedScreens[index],
      [field]: field === 'capacity' ? Number(value) : value,
    };
    
    // Auto-update seatLayout if capacity changes (simple example)
    if (field === 'capacity' && capacity > 0) {
      const rows = Math.min(20, Math.ceil(Math.sqrt(capacity / 1.2))); // Max 20 rows
      const cols = Math.min(30, Math.ceil(capacity / rows)); // Max 30 cols
      updatedScreens[index].seatLayout = Array(rows).fill(Array(cols).fill(1));
    } else if (field === 'capacity' && capacity <= 0) {
       updatedScreens[index].seatLayout = [[]];
    }

    setCurrentTheater(prev => ({ ...prev, screens: updatedScreens }));
  };

  const addScreen = () => {
    setCurrentTheater(prev => ({
      ...prev,
      screens: [...prev.screens, { ...emptyScreen, name: `Screen ${prev.screens.length + 1}` }]
    }));
  };

  const removeScreen = (index) => {
    if (currentTheater.screens.length <= 1) {
      toast.error("At least one screen is required");
      return;
    }
    setCurrentTheater(prev => ({
      ...prev,
      screens: prev.screens.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentTheater) return;
  
    // Prepare data for API
    const theaterData = {
      ...currentTheater,
      location: {
        type: 'Point',
        coordinates: [Number(currentTheater.longitude), Number(currentTheater.latitude)],
        address: currentTheater.address,
      },
      contact: {
        phone: currentTheater.phone,
        email: currentTheater.email,
      },
      facilities: (currentTheater.facilities || '').split(',').map(f => f.trim()).filter(Boolean),
      screens: currentTheater.screens.map(s => ({
        name: s.name,
        capacity: Number(s.capacity),
        seatLayout: s.seatLayout, // Pass the layout
      })),
    };
  
    // Clean up temporary form fields
    delete theaterData.longitude;
    delete theaterData.latitude;
    // 'address' is part of location, so we don't delete it from the root
    // 'phone' and 'email' are part of contact
    
    try {
      if (currentTheater._id) {
        await adminService.updateTheater(currentTheater._id, theaterData);
        toast.success('Theater updated successfully');
      } else {
        await adminService.createTheater(theaterData);
        toast.success('Theater created successfully');
      }
      handleCloseModal();
      fetchTheaters(); // Refresh the list
    } catch (err) {
      console.error('Error saving theater:', err);
      toast.error('Failed to save theater', err.response?.data?.message || err.message);
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
            onClick={fetchTheaters}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (theaters.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/30 border-2 border-dashed border-gray-700 rounded-lg text-gray-300">
          <FiHome className="text-5xl mb-3" />
          <h3 className="text-xl font-semibold text-white">No Theaters Found</h3>
          <p className="mt-1">Get started by adding a new theater.</p>
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
                  Theater
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
                  Running Movies
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
              {theaters.map((theater) => {
                const safeShowtimes = theater.showtimes || [];
                const totalBookings = safeShowtimes.reduce((acc, show) => acc + (show.bookingCount || 0), 0);
                const runningMovies = [...new Set(safeShowtimes.map(s => s.movie?.title).filter(Boolean))];
                
                return (
                  <tr key={theater._id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{theater.name}</div>
                      <div className="text-sm text-gray-300 flex items-center mt-1">
                        <FiMapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                        {theater.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-300 mb-1" title="Screens">
                        <FiGrid className="w-4 h-4 mr-2 text-gray-400" />
                        {theater.screens?.length || 0} Screen{theater.screens?.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center text-sm text-gray-300 mb-1" title="Active Shows">
                        <FiVideo className="w-4 h-4 mr-2 text-blue-400" />
                        {safeShowtimes.length} Active Show{safeShowtimes.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center text-sm text-gray-300" title="Total Bookings">
                        <FiTrendingUp className="w-4 h-4 mr-2 text-green-500" />
                        {totalBookings} Booking{totalBookings !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {runningMovies.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {runningMovies.map(title => (
                            <span key={title} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                              {title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-300">No active shows</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          theater.isActive
                            ? 'bg-green-900/50 text-green-300 border border-green-700'
                            : 'bg-red-900/50 text-red-300 border border-red-700'
                        }`}
                      >
                        {theater.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleOpenModal(theater)}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors p-1"
                        title="Edit Theater"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(theater._id)}
                        className="text-red-500 hover:text-red-400 transition-colors p-1"
                        title="Delete Theater"
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
        <h1 className="text-3xl font-bold text-red-900">Theater Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-medium rounded-lg shadow-lg hover:shadow-brand/30 transition-all duration-200"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Add New Theater
        </button>
      </div>

      {renderContent()}

      {/* Add/Edit Theater Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentTheater?._id ? 'Edit Theater' : 'Add New Theater'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Theater Name" name="name" value={currentTheater?.name} onChange={handleFormChange} required />
            <FormInput label="City" name="city" value={currentTheater?.city} onChange={handleFormChange} required />
          </div>

          <FormInput label="Address" name="address" value={currentTheater?.address} onChange={handleFormChange} required placeholder="e.g. 123 Main St, Lulu Mall" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput label="Longitude" name="longitude" type="number" value={currentTheater?.longitude} onChange={handleFormChange} required placeholder="e.g. 74.8722" />
            <FormInput label="Latitude" name="latitude" type="number" value={currentTheater?.latitude} onChange={handleFormChange} required placeholder="e.g. 12.5186" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <FormInput label="Contact Phone" name="phone" value={currentTheater?.phone} onChange={handleFormChange} />
             <FormInput label="Contact Email" name="email" type="email" value={currentTheater?.email} onChange={handleFormChange} />
          </div>

          <FormInput label="Facilities (comma-separated)" name="facilities" value={currentTheater?.facilities} onChange={handleFormChange} placeholder="e.g. Parking, 3D, IMAX" />

          {/* Screen Management */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Screens</h4>
            <div className="space-y-4">
              {(currentTheater?.screens || []).map((screen, index) => (
                <div key={index} className="grid grid-cols-[1fr,100px,auto] gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <FormInput label={`Screen ${index + 1} Name`} name="name" value={screen.name} onChange={(e) => handleScreenChange(index, 'name', e.target.value)} />
                  <FormInput label="Capacity" name="capacity" type="number" value={screen.capacity} onChange={(e) => handleScreenChange(index, 'capacity', e.target.value)} />
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeScreen(index)}
                      className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/50 rounded-lg"
                      title="Remove Screen"
                    >
                      <FiMinusCircle size={20} />
                    </button>
                  </div>
                  <div className="col-span-3 text-xs text-gray-300">
                    Seat Layout: {(screen.seatLayout || []).length} rows x {(screen.seatLayout || [])[0]?.length || 0} cols
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addScreen}
              className="mt-3 flex items-center px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <FiPlusCircle size={16} className="mr-2" />
              Add Screen
            </button>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center pt-4">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={currentTheater?.isActive || false}
              onChange={(e) => setCurrentTheater(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-brand bg-gray-900 border-gray-700 rounded focus:ring-brand"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-300">
              Is this theater currently active?
            </label>
          </div>
          
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
              {currentTheater?._id ? 'Update Theater' : 'Add Theater'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}