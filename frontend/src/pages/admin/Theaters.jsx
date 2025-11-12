import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const Theaters = () => {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    state: '',
    pincode: '',
    screens: 1,
    facilities: [],
    contactNumber: '',
    openingTime: '09:00',
    closingTime: '23:00',
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    isActive: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const fetchTheaters = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/theaters');
      setTheaters(data);
    } catch (error) {
      console.error('Error fetching theaters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheaters();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFacilityToggle = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const theaterData = {
        ...formData,
        screens: parseInt(formData.screens, 10),
        isActive: formData.isActive === true || formData.isActive === 'true'
      };

      if (editingId) {
        await api.put(`/theaters/${editingId}`, theaterData);
      } else {
        await api.post('/theaters', theaterData);
      }
      
      resetForm();
      fetchTheaters();
    } catch (error) {
      console.error('Error saving theater:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      city: '',
      state: '',
      pincode: '',
      screens: 1,
      facilities: [],
      contactNumber: '',
      openingTime: '09:00',
      closingTime: '23:00',
      isActive: true,
    });
    setEditingId(null);
  };

  const handleEdit = (theater) => {
    setFormData({
      name: theater.name,
      location: theater.location,
      city: theater.city,
      state: theater.state,
      pincode: theater.pincode,
      screens: theater.screens,
      facilities: theater.facilities || [],
      contactNumber: theater.contactNumber,
      openingTime: theater.openingTime || '09:00',
      closingTime: theater.closingTime || '23:00',
      isActive: theater.isActive,
    });
    setEditingId(theater._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this theater? This action cannot be undone.')) {
      try {
        await api.delete(`/theaters/${id}`);
        fetchTheaters();
      } catch (error) {
        console.error('Error deleting theater:', error);
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/theaters/${id}`, { isActive: !currentStatus });
      fetchTheaters();
    } catch (error) {
      console.error('Error updating theater status:', error);
    }
  };

  const filteredTheaters = theaters.filter(theater => {
    const matchesSearch = theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theater.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theater.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = !filters.city || theater.city === filters.city;
    const matchesStatus = filters.isActive === 'all' || 
      (filters.isActive === 'active' ? theater.isActive : !theater.isActive);
    
    return matchesSearch && matchesCity && matchesStatus;
  }).sort((a, b) => {
    if (filters.sortBy === 'name') {
      return filters.sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (filters.sortBy === 'city') {
      return filters.sortOrder === 'asc'
        ? (a.city || '').localeCompare(b.city || '')
        : (b.city || '').localeCompare(a.city || '');
    } else if (filters.sortBy === 'screens') {
      return filters.sortOrder === 'asc'
        ? a.screens - b.screens
        : b.screens - a.screens;
    }
    return 0;
  });

  const allCities = [...new Set(theaters.map(theater => theater.city).filter(Boolean))];
  const facilitiesList = [
    '3D', 'Dolby Atmos', 'IMAX', '4DX', 'Food Court', 
    'Wheelchair Access', 'Parking', 'Online Booking'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Edit Theater' : 'Add New Theater'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Theater Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Screens</label>
              <input
                type="number"
                name="screens"
                min="1"
                value={formData.screens}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active Theater
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Opening Time</label>
              <input
                type="time"
                name="openingTime"
                value={formData.openingTime}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Closing Time</label>
              <input
                type="time"
                name="closingTime"
                value={formData.closingTime}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {facilitiesList.map(facility => (
                  <div key={facility} className="flex items-center">
                    <input
                      id={`facility-${facility}`}
                      type="checkbox"
                      checked={formData.facilities.includes(facility)}
                      onChange={() => handleFacilityToggle(facility)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`facility-${facility}`} className="ml-2 text-sm text-gray-700">
                      {facility}
                    </label>
                  </div>
                ))}
              </div>
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
            >
              {editingId ? 'Update Theater' : 'Add Theater'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Manage Theaters</h2>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <input
                type="text"
                placeholder="Search theaters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <select
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Cities</option>
                {allCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({...filters, isActive: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="name">Name</option>
                <option value="city">City</option>
                <option value="screens">Number of Screens</option>
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
            <p className="mt-2 text-gray-600">Loading theaters...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Screens
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
                {filteredTheaters.length > 0 ? (
                  filteredTheaters.map((theater) => (
                    <tr key={theater._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{theater.name}</div>
                        <div className="text-sm text-gray-500">
                          {theater.facilities?.slice(0, 2).join(', ')}
                          {theater.facilities?.length > 2 ? '...' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{theater.location}</div>
                        <div className="text-sm text-gray-500">{theater.city}, {theater.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {theater.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {theater.screens}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          onClick={() => toggleStatus(theater._id, theater.isActive)}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                            theater.isActive 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {theater.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(theater)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(theater._id)}
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
                      No theaters found. {searchTerm ? 'Try a different search term.' : 'Add a new theater to get started.'}
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

export default Theaters;
