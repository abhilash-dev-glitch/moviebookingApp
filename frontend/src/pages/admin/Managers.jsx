import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const Managers = () => {
  const [managers, setManagers] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState({
    managers: false,
    theaters: false,
    submitting: false
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    assignedTheaters: [],
    isActive: true,
  });
  
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    theater: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  
  const [showPassword, setShowPassword] = useState(false);

  // Fetch managers and theaters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, managers: true, theaters: true }));
        
        const [managersRes, theatersRes] = await Promise.all([
          api.get('/users?role=manager'),
          api.get('/theaters')
        ]);
        
        setManagers(managersRes.data);
        setTheaters(theatersRes.data);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(prev => ({ ...prev, managers: false, theaters: false }));
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTheaterToggle = (theaterId) => {
    setFormData(prev => ({
      ...prev,
      assignedTheaters: prev.assignedTheaters.includes(theaterId)
        ? prev.assignedTheaters.filter(id => id !== theaterId)
        : [...prev.assignedTheaters, theaterId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submitting: true }));
    
    try {
      const managerData = { 
        ...formData,
        role: 'manager',
        // Only include password if it's a new manager or if the password field is not empty
        ...(formData.password ? { password: formData.password } : {})
      };
      
      if (editingId) {
        await api.put(`/users/${editingId}`, managerData);
      } else {
        await api.post('/users', managerData);
      }
      
      // Refresh managers list
      const { data } = await api.get('/users?role=manager');
      setManagers(data);
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error saving manager:', error);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      assignedTheaters: [],
      isActive: true,
    });
    setEditingId(null);
    setShowPassword(false);
  };

  const handleEdit = (manager) => {
    setFormData({
      name: manager.name,
      email: manager.email,
      phone: manager.phone || '',
      password: '', // Don't load password for security reasons
      assignedTheaters: manager.assignedTheaters?.map(t => t._id || t) || [],
      isActive: manager.isActive !== undefined ? manager.isActive : true,
    });
    setEditingId(manager._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this manager? This action cannot be undone.')) {
      try {
        await api.delete(`/users/${id}`);
        const { data } = await api.get('/users?role=manager');
        setManagers(data);
      } catch (error) {
        console.error('Error deleting manager:', error);
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/users/${id}`, { isActive: !currentStatus });
      const { data } = await api.get('/users?role=manager');
      setManagers(data);
    } catch (error) {
      console.error('Error updating manager status:', error);
    }
  };

  // Filter and sort managers
  const filteredManagers = managers.filter(manager => {
    const matchesSearch = 
      manager.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' ? manager.isActive : !manager.isActive);
    
    const matchesTheater = filters.theater === 'all' || 
      manager.assignedTheaters?.some(t => (t._id || t) === filters.theater);
    
    return matchesSearch && matchesStatus && matchesTheater;
  }).sort((a, b) => {
    if (filters.sortBy === 'name') {
      return filters.sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (filters.sortBy === 'theaterCount') {
      const aCount = a.assignedTheaters?.length || 0;
      const bCount = b.assignedTheaters?.length || 0;
      return filters.sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
    } else if (filters.sortBy === 'createdAt') {
      return filters.sortOrder === 'asc'
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    }
    return 0;
  });

  // Get unique assigned theaters across all managers
  const assignedTheaterIds = [...new Set(
    managers.flatMap(m => 
      m.assignedTheaters?.map(t => ({
        id: t._id || t,
        name: t.name || theaters.find(th => th._id === t)?.name || 'Unknown Theater'
      })) || []
    )
  )];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Edit Manager' : 'Add New Manager'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
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
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={!!editingId}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {editingId ? 'New Password (leave blank to keep current)' : 'Password'}
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!editingId ? 'required' : ''}`}
                  placeholder={editingId ? '••••••••' : '••••••••'}
                  required={!editingId}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Theaters</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">
                {theaters.length > 0 ? (
                  theaters.map(theater => (
                    <div key={theater._id} className="flex items-center">
                      <input
                        id={`theater-${theater._id}`}
                        type="checkbox"
                        checked={formData.assignedTheaters.includes(theater._id)}
                        onChange={() => handleTheaterToggle(theater._id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`theater-${theater._id}`} className="ml-2 text-sm text-gray-700">
                        {theater.name} ({theater.city})
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-3">No theaters available. Please add theaters first.</p>
                )}
              </div>
            </div>
            
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
                Active Account
              </label>
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
              disabled={loading.submitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.submitting ? 'Saving...' : (editingId ? 'Update Manager' : 'Add Manager')}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Manage Managers</h2>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <input
                type="text"
                placeholder="Search managers..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Theater</label>
              <select
                value={filters.theater}
                onChange={(e) => setFilters({...filters, theater: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">All Theaters</option>
                {assignedTheaterIds.map(theater => (
                  <option key={theater.id} value={theater.id}>
                    {theater.name}
                  </option>
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
                <option value="name">Name</option>
                <option value="theaterCount">Number of Theaters</option>
                <option value="createdAt">Join Date</option>
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
        
        {loading.managers ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading managers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Theaters
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
                {filteredManagers.length > 0 ? (
                  filteredManagers.map((manager) => (
                    <tr key={manager._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {manager.name ? manager.name.charAt(0).toUpperCase() : 'M'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                            <div className="text-sm text-gray-500">{manager.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{manager.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {manager.assignedTheaters?.length > 0 ? (
                            <div className="space-y-1">
                              {manager.assignedTheaters.slice(0, 2).map(theater => (
                                <div key={theater._id || theater} className="text-sm">
                                  {typeof theater === 'object' ? theater.name : 
                                   theaters.find(t => t._id === theater)?.name || 'Unknown Theater'}
                                </div>
                              ))}
                              {manager.assignedTheaters.length > 2 && (
                                <div className="text-xs text-indigo-600">
                                  +{manager.assignedTheaters.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No theaters assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          onClick={() => toggleStatus(manager._id, manager.isActive)}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                            manager.isActive 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {manager.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(manager)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(manager._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No managers found. {searchTerm ? 'Try a different search term.' : 'Add a new manager to get started.'}
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

export default Managers;
