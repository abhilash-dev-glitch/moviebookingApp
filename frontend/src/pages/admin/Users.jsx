import { useState, useEffect } from 'react';
import { adminService } from '/src/services/adminService.js'; // Corrected
import { toast } from '/src/lib/toast.js'; // Corrected
import { FiUsers, FiLoader, FiAlertCircle, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { format } from 'date-fns'; // Added import for formatting dates

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'MMM dd, yyyy');
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getUsers();
      // Filter out managers and admins, show only endUsers
      setUsers(data.data.users.filter(u => u.role === 'endUser') || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users.');
      toast.error('Failed to load users', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleDelete = async (userId) => {
    // Note: Your backend doesn't have a deleteUser route in user.routes.js
    // I'm adding the call here, but it will fail until the backend route is added.
    // For now, let's use the deactivate route.
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        // We'll use the deactivate endpoint from your user.controller.js
        await adminService.updateUser(userId, { isActive: false });
        toast.success('User deactivated successfully');
        fetchUsers(); // Refresh list
      } catch (err) {
        console.error('Error deactivating user:', err);
        toast.error('Failed to deactivate user', err.message);
      }
    }
  };

  const handleActivate = async (userId) => {
     if (window.confirm('Are you sure you want to activate this user?')) {
      try {
        await adminService.updateUser(userId, { isActive: true });
        toast.success('User activated successfully');
        fetchUsers(); // Refresh list
      } catch (err) {
        console.error('Error activating user:', err);
        toast.error('Failed to activate user', err.message);
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center py-20"><FiLoader className="animate-spin text-brand text-4xl" /></div>;
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-red-900/20 border border-red-700 rounded-lg text-red-300">
          <FiAlertCircle className="text-4xl mb-2" />
          <p>{error}</p>
          <button onClick={fetchUsers} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            Try Again
          </button>
        </div>
      );
    }
    if (users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/30 border-2 border-dashed border-gray-700 rounded-lg text-gray-300">
          <FiUsers className="text-5xl mb-3" />
          <h3 className="text-xl font-semibold text-white">No Users Found</h3>
          <p className="mt-1 text-gray-300">No end-users have registered yet.</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Joined On</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/50 divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full object-cover" src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=1f2937&color=9ca3af`} alt={user.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-300">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    {user.isActive ? (
                      <button onClick={() => handleDelete(user._id)} className="text-red-500 hover:text-red-400 transition-colors p-1" title="Deactivate User">
                        <FiXCircle size={18} />
                      </button>
                    ) : (
                       <button onClick={() => handleActivate(user._id)} className="text-green-500 hover:text-green-400 transition-colors p-1" title="Activate User">
                        <FiCheckCircle size={18} />
                      </button>
                    )}
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
        <h1 className="text-3xl font-bold text-red-900">User Management</h1>
      </div>
      {renderContent()}
    </div>
  );
}