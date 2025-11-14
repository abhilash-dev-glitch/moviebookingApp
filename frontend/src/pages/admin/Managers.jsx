import { useState, useEffect, Fragment } from 'react';
import { adminService } from '/src/services/adminService.js'; // Corrected
import { toast } from '/src/lib/toast.js'; // Corrected
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiLoader,
  FiAlertCircle,
  FiX,
  FiUserPlus,
  FiHome,
  FiCheckCircle,
  FiXCircle,
  FiUserCheck
} from 'react-icons/fi';

// Modal and FormInput components
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
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

const FormInput = ({ label, name, value, onChange, type = 'text', required = false, as = 'input', placeholder = '' }) => {
  const commonProps = { name, id: name, value: value || '', onChange, required, placeholder,
    className: 'w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all duration-200',
  };
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input {...commonProps} type={type} />
    </div>
  );
};

export default function AdminManagers() {
  const [managers, setManagers] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentManager, setCurrentManager] = useState(null);

  // Fetch managers and theaters
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [managersData, theatersData] = await Promise.all([
        adminService.getTheaterManagers(),
        adminService.getTheaters(),
      ]);
      // Filter to ensure only theaterManager role users are shown (safety measure)
      const theaterManagers = (managersData.data.theaterManagers || []).filter(
        user => user.role === 'theaterManager'
      );
      setManagers(theaterManagers);
      setTheaters(theatersData.data.theaters || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data.');
      toast.error('Failed to load data', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- Handlers ---

  const handleOpenModal = (manager = null) => {
    if (manager) {
      setCurrentManager({
        ...manager,
        managedTheaters: Array.isArray(manager.managedTheaters) ? manager.managedTheaters.map(t => t._id) : [],
        password: '', // Don't pre-fill password
      });
    } else {
      setCurrentManager({ 
        isActive: true, 
        role: 'theaterManager',
        managedTheaters: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentManager(null);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentManager((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleTheaterToggle = (theaterId) => {
    setCurrentManager(prev => {
      const currentTheaters = Array.isArray(prev.managedTheaters) ? [...prev.managedTheaters] : [];
      const theaterIndex = currentTheaters.findIndex(id => id === theaterId || id._id === theaterId);
      
      let updatedTheaters;
      if (theaterIndex === -1) {
        // Add theater if not already in the list
        updatedTheaters = [...currentTheaters, theaterId];
      } else {
        // Remove theater if already in the list
        updatedTheaters = currentTheaters.filter((_, index) => index !== theaterIndex);
      }
      
      return { ...prev, managedTheaters: updatedTheaters };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentManager) return;

    const managerData = {
      ...currentManager,
      // Only include managedTheaters if it exists and is an array
      ...(Array.isArray(currentManager.managedTheaters) && {
        managedTheaters: currentManager.managedTheaters
      })
    };
    
    // Only send password if it's being set/changed
    if (!managerData.password) {
      delete managerData.password;
    }

    try {
      if (currentManager._id) {
        // Update user (name, phone, isActive)
        await adminService.updateUser(currentManager._id, managerData);
        // Assign theaters separately - ensure we always send an array, even if empty
        const theaterIds = Array.isArray(currentManager.managedTheaters) 
          ? currentManager.managedTheaters.map(id => {
              // Ensure we send strings, not objects
              if (typeof id === 'string') return id;
              if (id && typeof id === 'object' && id._id) return id._id;
              return id;
            }).filter(id => id) // Remove any null/undefined values
          : [];
        await adminService.assignTheatersToManager(currentManager._id, theaterIds);
        toast.success('Manager updated successfully');
      } else {
        // Create new manager with role and managedTheaters
        const newManagerResponse = await adminService.createManager({
          ...managerData,
          role: 'theaterManager',
          managedTheaters: Array.isArray(currentManager.managedTheaters) ? currentManager.managedTheaters : []
        });
        
        // Extract the manager ID from the response
        // Response structure: { status, data: { theaterManager: { _id, ... } } }
        const newManagerId = newManagerResponse?.data?.theaterManager?._id || 
                            newManagerResponse?.theaterManager?._id || 
                            newManagerResponse?._id;
        
        if (!newManagerId) {
          throw new Error('Failed to get manager ID from response');
        }
        
        // If there are theaters to assign, do it after creation
        const theaterIds = Array.isArray(currentManager.managedTheaters) 
          ? currentManager.managedTheaters.map(id => {
              // Ensure we send strings, not objects
              if (typeof id === 'string') return id;
              if (id && typeof id === 'object' && id._id) return id._id;
              return id;
            }).filter(id => id) // Remove any null/undefined values
          : [];
        
        if (theaterIds.length > 0) {
          try {
            await adminService.assignTheatersToManager(newManagerId, theaterIds);
          } catch (assignError) {
            console.error('Error assigning theaters:', assignError);
            toast.warning('Manager created, but there was an error assigning theaters');
          }
        }
        
        toast.success('Manager created successfully');
      }
      handleCloseModal();
      fetchAllData(); // Refresh the list
    } catch (err) {
      console.error('Error saving manager:', err);
      toast.error('Failed to save manager', err.response?.data?.message || err.message);
    }
  };

  const handleToggleStatus = async (user) => {
     const action = user.isActive ? 'deactivate' : 'activate';
     if (window.confirm(`Are you sure you want to ${action} this manager?`)) {
      try {
        await adminService.updateUser(user._id, { isActive: !user.isActive });
        toast.success(`Manager ${action}d successfully`);
        fetchAllData(); // Refresh list
      } catch (err) {
        console.error(`Error ${action}ing manager:`, err);
        toast.error(`Failed to ${action} manager`, err.message);
      }
    }
  };
  
  // --- Render Functions ---

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center py-20"><FiLoader className="animate-spin text-brand text-4xl" /></div>;
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-red-900/20 border border-red-700 rounded-lg text-red-300">
          <FiAlertCircle className="text-4xl mb-2" />
          <p>{error}</p>
          <button onClick={fetchAllData} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            Try Again
          </button>
        </div>
      );
    }
    if (managers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/30 border-2 border-dashed border-gray-700 rounded-lg text-gray-300">
          <FiUserCheck className="text-5xl mb-3" />
          <h3 className="text-xl font-semibold text-white">No Managers Found</h3>
          <p className="mt-1 text-gray-300">Get started by adding a new theater manager.</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Manager</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Assigned Theaters</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/50 divide-y divide-gray-700">
              {managers.map((manager) => (
                <tr key={manager._id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full object-cover" src={manager.profilePicture || `https://ui-avatars.com/api/?name=${manager.name}&background=1f2937&color=9ca3af`} alt={manager.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{manager.name}</div>
                        <div className="text-sm text-gray-300">{manager.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{manager.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {(manager.managedTheaters || []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {manager.managedTheaters.map((t, index) => {
                          // Handle both populated objects and IDs
                          let theaterName = null;
                          let theaterCity = null;
                          
                          if (typeof t === 'object' && t !== null && t.name) {
                            // If it's a populated object, use the name and city directly
                            theaterName = t.name;
                            theaterCity = t.city;
                          } else {
                            // If it's an ID string, find it in the theaters array
                            const theaterId = typeof t === 'string' ? t : (t?._id?.toString() || t?.toString());
                            const theater = theaters.find(th => {
                              const thId = th._id?.toString() || th._id;
                              return thId === theaterId;
                            });
                            theaterName = theater?.name || 'Unknown Theater';
                            theaterCity = theater?.city;
                          }
                          
                          return (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2.5 py-1 bg-blue-900/50 text-blue-200 rounded-md text-xs font-medium border border-blue-700/50"
                              title={theaterCity ? `${theaterName}, ${theaterCity}` : theaterName}
                            >
                              {theaterName}
                              {theaterCity && <span className="ml-1 text-blue-300/70">({theaterCity})</span>}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${manager.isActive ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
                      {manager.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button onClick={() => handleOpenModal(manager)} className="text-indigo-400 hover:text-indigo-300 transition-colors p-1" title="Edit Manager">
                      <FiEdit size={18} />
                    </button>
                    <button onClick={() => handleToggleStatus(manager)} className={manager.isActive ? "text-red-500 hover:text-red-400" : "text-green-500 hover:text-green-400"} title={manager.isActive ? "Deactivate" : "Activate"}>
                      {manager.isActive ? <FiXCircle size={18} /> : <FiCheckCircle size={18} />}
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
        <h1 className="text-3xl font-bold text-red-900">Manager Management</h1>
        <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-medium rounded-lg shadow-lg hover:shadow-brand/30 transition-all duration-200">
          <FiUserPlus className="w-5 h-5 mr-2" />
          Add New Manager
        </button>
      </div>

      {renderContent()}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentManager?._id ? 'Edit Manager' : 'Add New Manager'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput 
              label="Name" 
              name="name" 
              value={currentManager?.name || ''} 
              onChange={handleFormChange} 
              required 
            />
            <FormInput 
              label="Email" 
              name="email" 
              type="email" 
              value={currentManager?.email || ''} 
              onChange={handleFormChange} 
              required 
              disabled={!!currentManager?._id} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput 
              label="Phone" 
              name="phone" 
              value={currentManager?.phone || ''} 
              onChange={handleFormChange} 
              required 
            />
            <FormInput 
              label="Password" 
              name="password" 
              type="password" 
              value={currentManager?.password || ''} 
              onChange={handleFormChange} 
              placeholder={currentManager?._id ? 'Leave blank to keep unchanged' : 'Required'}
              required={!currentManager?._id}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Assign Theaters</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-gray-900 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
              {theaters.length > 0 ? (
                theaters.map(theater => {
                  const isChecked = Array.isArray(currentManager?.managedTheaters) && 
                    currentManager.managedTheaters.some(t => 
                      (typeof t === 'string' && t === theater._id) || 
                      (t && typeof t === 'object' && t._id === theater._id)
                    );
                  
                  return (
                    <label key={theater._id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-700/50">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTheaterToggle(theater._id)}
                        className="h-4 w-4 text-brand bg-gray-800 border-gray-600 rounded focus:ring-brand"
                      />
                      <span className="text-sm text-gray-200">
                        {theater.name} 
                        {theater.city && ` (${theater.city})`}
                        {isChecked && (
                          <span className="ml-2 text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full">
                            Assigned
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 col-span-full">No theaters available to assign. Please add theaters first.</p>
              )}
            </div>
            {theaters.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {Array.isArray(currentManager?.managedTheaters) && currentManager.managedTheaters.length > 0 
                  ? `${currentManager.managedTheaters.length} theater(s) selected` 
                  : 'No theaters selected'}
              </p>
            )}
          </div>
          
          <div className="flex items-center pt-4">
            <input
              type="checkbox"
              id="isActive"
              checked={currentManager?.isActive || false}
              onChange={(e) => setCurrentManager(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-brand bg-gray-900 border-gray-700 rounded focus:ring-brand"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-300">
              Manager account is Active
            </label>
          </div>
          
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
              {currentManager?._id ? 'Update Manager' : 'Create Manager'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}