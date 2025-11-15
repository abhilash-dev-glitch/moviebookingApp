import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import { toast } from '../../lib/toast';
import { useWebSocket } from '../../hooks/useWebSocket';
import { FiPlus, FiTrash2, FiClock, FiFilm, FiEdit2 } from 'react-icons/fi';
import { format, parseISO, isAfter } from 'date-fns';

export default function ManageShows() {
  const { myTheaters: theaters, movies } = useOutletContext();
  const [selectedTheaterId, setSelectedTheaterId] = useState('');
  const [shows, setShows] = useState([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [form, setForm] = useState({
    movie: '',
    screen: '',
    startTime: '',
    endTime: '',
    endDate: '',
    price: 200,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Get the selected theater and its screens
  const selectedTheater = useMemo(() => 
    theaters.find((t) => t._id === selectedTheaterId),
    [theaters, selectedTheaterId]
  );

  const availableScreens = selectedTheater?.screens || [];
  
  // Group shows by date for better organization
  const showsByDate = useMemo(() => {
    const grouped = {};
    shows.forEach(show => {
      const date = format(parseISO(show.startTime), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(show);
    });
    return grouped;
  }, [shows]);

  // Load shows for the selected theater
  const loadShows = async () => {
    if (!selectedTheaterId) return;
    setLoadingShows(true);
    try {
      const res = await api.get(`/theaters/${selectedTheaterId}/showtimes`);
      // Sort shows by start time
      const sortedShows = (res.data.data.showtimes || []).sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
      );
      setShows(sortedShows);
    } catch (err) {
      console.error('Error loading shows:', err);
      toast.error('Failed to load shows', err.response?.data?.message || 'Please try again later');
    } finally {
      setLoadingShows(false);
    }
  };

  // Reload shows when the selected theater changes
  useEffect(() => {
    loadShows();
  }, [selectedTheaterId]);

  // Real-time WebSocket updates
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'NEW_SHOW':
      case 'SHOW_UPDATED':
      case 'SHOW_DELETED':
        if (selectedTheaterId) {
          loadShows();
        }
        break;
      default:
        break;
    }
  };

  useWebSocket(handleWebSocketMessage, [selectedTheaterId]);

  // Helper function to update form state
  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Auto-calculate end time based on movie duration and start time
  useEffect(() => {
    if (form.movie && form.startDate && form.startHour && form.startMinute && form.startPeriod) {
      const selectedMovie = movies.find(m => m._id === form.movie);
      if (selectedMovie && selectedMovie.duration) {
        // Convert 12-hour to 24-hour format
        let hour24 = parseInt(form.startHour);
        if (form.startPeriod === 'PM' && hour24 !== 12) hour24 += 12;
        if (form.startPeriod === 'AM' && hour24 === 12) hour24 = 0;
        
        // Create start datetime
        const startDateTime = new Date(`${form.startDate}T${hour24.toString().padStart(2, '0')}:${form.startMinute}:00`);
        
        // Calculate end datetime
        const endDateTime = new Date(startDateTime.getTime() + selectedMovie.duration * 60000);
        
        // Format for display
        const endHour24 = endDateTime.getHours();
        const endMinute = endDateTime.getMinutes();
        const endHour12 = endHour24 % 12 || 12;
        const endPeriod = endHour24 >= 12 ? 'PM' : 'AM';
        const calculatedEndTime = `${endHour12}:${endMinute.toString().padStart(2, '0')} ${endPeriod}`;
        
        // Store both display format and ISO format
        setForm(prev => ({
          ...prev,
          calculatedEndTime,
          endTime: endDateTime.toISOString().slice(0, 16),
          startTime: startDateTime.toISOString().slice(0, 16)
        }));
      }
    }
  }, [form.movie, form.startDate, form.startHour, form.startMinute, form.startPeriod, movies]);

  // Old end time validation - keeping for backward compatibility
  useEffect(() => {
    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
      // Add 2 hours as default duration
      const endTime = new Date(new Date(form.startTime).getTime() + 2 * 60 * 60 * 1000);
      set('endTime', endTime.toISOString().slice(0, 16));
    }
  }, [form.startTime]);

  // Reset screen selection when theater changes
  useEffect(() => {
    set('screen', '');
  }, [selectedTheaterId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.movie || !form.screen || !form.startDate || !form.startHour || !form.startMinute || !form.startPeriod || !form.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedTheaterId) {
      toast.error('Please select a theater first');
      return;
    }

    setIsLoading(true);
    try {
      // Calculate start time from 12-hour format
      let hour24 = parseInt(form.startHour);
      if (form.startPeriod === 'PM' && hour24 !== 12) hour24 += 12;
      if (form.startPeriod === 'AM' && hour24 === 12) hour24 = 0;
      
      const startDateTime = new Date(`${form.startDate}T${hour24.toString().padStart(2, '0')}:${form.startMinute}:00`);
      
      // Get movie duration for end time calculation
      const selectedMovie = movies.find(m => m._id === form.movie);
      if (!selectedMovie || !selectedMovie.duration) {
        toast.error('Movie duration not found');
        setIsLoading(false);
        return;
      }
      
      // Calculate end time based on movie duration
      const endDateTime = new Date(startDateTime.getTime() + selectedMovie.duration * 60000);
      
      // Validate dates
      const endDate = new Date(form.endDate);
      const startDate = new Date(form.startDate);
      
      if (endDate < startDate) {
        toast.error('End date cannot be before start date');
        setIsLoading(false);
        return;
      }

      const payload = {
        movie: form.movie,
        theater: selectedTheaterId,
        screen: form.screen,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        endDate: form.endDate,
        price: Number(form.price || 0)
      };
      
      console.log('Submitting show data:', payload);
      
      if (editingShow) {
        await api.patch(`/showtimes/${editingShow._id}`, payload);
        toast.success('Show updated successfully!');
      } else {
        await api.post('/showtimes', payload);
        toast.success('Show created successfully!');
      }
      
      setForm({ movie: '', screen: '', startTime: '', endTime: '', endDate: '', price: 200 });
      setIsFormOpen(false);
      setEditingShow(null);
      loadShows();
    } catch (err) {
      console.error('Error saving show:', err);
      toast.error(editingShow ? 'Failed to update show' : 'Failed to create show', err.response?.data?.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (show) => {
    setEditingShow(show);
    setForm({
      movie: typeof show.movie === 'object' ? show.movie._id : show.movie,
      screen: show.screen,
      startTime: new Date(show.startTime).toISOString().slice(0, 16),
      endTime: new Date(show.endTime).toISOString().slice(0, 16),
      endDate: show.endDate ? new Date(show.endDate).toISOString().split('T')[0] : '',
      price: show.price,
    });
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setEditingShow(null);
    setForm({ movie: '', screen: '', startTime: '', endTime: '', endDate: '', price: 200 });
    setIsFormOpen(false);
  };

  const remove = async (id) => {
    if (window.confirm('Are you sure you want to delete this show? This action cannot be undone.')) {
      try {
        await api.delete(`/showtimes/${id}`);
        toast.success('Show deleted successfully');
        loadShows();
      } catch (err) {
        console.error('Error deleting show:', err);
        toast.error('Failed to delete show', err.response?.data?.message || 'Please try again');
      }
    }
  };

  // Set initial theater if not set and theaters are available
  useEffect(() => {
    if (theaters.length > 0 && !selectedTheaterId) {
      setSelectedTheaterId(theaters[0]._id);
    }
  }, [theaters, selectedTheaterId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manage Shows</h2>
          <p className="text-sm text-white/60">
            {selectedTheater 
              ? `Managing shows for ${selectedTheater.name}` 
              : 'Select a theater to manage shows'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingShow(null);
            setForm({ 
              movie: '', 
              screen: '', 
              startDate: '', 
              startHour: '12', 
              startMinute: '00', 
              startPeriod: 'PM',
              startTime: '', 
              endTime: '', 
              endDate: '', 
              price: 200 
            });
            setIsFormOpen(!isFormOpen);
          }}
          className="flex items-center space-x-2 bg-brand hover:bg-brand/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FiPlus />
          <span>Add Show</span>
        </button>
      </div>

      {/* Theater Selector */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <label className="block text-sm font-medium mb-2">Select Theater</label>
        <select
          value={selectedTheaterId}
          onChange={(e) => setSelectedTheaterId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition"
          disabled={loadingShows}
        >
          {theaters.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} - {t.city}
            </option>
          ))}
        </select>
      </div>

      {/* Add/Edit Show Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 animate-fadeIn"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{editingShow ? 'Edit Show' : 'Add New Show'}</h3>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Movie</label>
              <select
                value={form.movie}
                onChange={(e) => set('movie', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition"
                required
                disabled={isLoading}
              >
                <option value="">Select a movie</option>
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.releaseYear})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Screen</label>
              <select
                value={form.screen}
                onChange={(e) => set('screen', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition"
                required
                disabled={isLoading || availableScreens.length === 0}
              >
                <option value="">Select a screen</option>
                {availableScreens.map((screen) => (
                  <option key={screen._id} value={screen._id}>
                    {screen.name} (Seats: {screen.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate || ''}
                onChange={(e) => set('startDate', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition"
                required
                disabled={isLoading}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={form.startHour || '12'}
                  onChange={(e) => set('startHour', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 outline-none"
                  required
                  disabled={isLoading}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  value={form.startMinute || '00'}
                  onChange={(e) => set('startMinute', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 outline-none"
                  required
                  disabled={isLoading}
                >
                  <option value="00">00</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
                <select
                  value={form.startPeriod || 'PM'}
                  onChange={(e) => set('startPeriod', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 outline-none"
                  required
                  disabled={isLoading}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date (Last day of show)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition"
                required
                disabled={isLoading}
                min={form.startTime ? form.startTime.split('T')[0] : new Date().toISOString().split('T')[0]}
              />
              {form.startTime && form.endDate && (
                <p className="text-xs text-gray-400 mt-1">
                  Show will run for {Math.ceil((new Date(form.endDate) - new Date(form.startTime.split('T')[0])) / (1000 * 60 * 60 * 24)) + 1} days
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Time (auto-calculated)</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-gray-400">
                {form.calculatedEndTime || 'Will be calculated based on movie duration'}
              </div>
              {form.movie && movies.find(m => m._id === form.movie) && (
                <p className="text-xs text-gray-400 mt-1">
                  Movie duration: {movies.find(m => m._id === form.movie).duration} minutes
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Price per ticket (₹)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand/50 focus:border-brand/50 outline-none transition"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg transition-colors flex items-center space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (editingShow ? 'Updating...' : 'Creating...') : (editingShow ? 'Update Show' : 'Create Show')}
              {!isLoading && (editingShow ? <FiEdit2 size={18} /> : <FiPlus size={18} />)}
            </button>
          </div>
        </form>
      )}

      {/* Shows List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {loadingShows ? 'Loading shows...' : `Upcoming Shows (${shows.length})`}
          </h3>
        </div>

        {loadingShows ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand"></div>
          </div>
        ) : shows.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl">
            <FiFilm className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">No shows scheduled</h3>
            <p className="mt-1 text-sm text-gray-400">
              Get started by adding a new show
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/50"
            >
              <FiPlus className="-ml-1 mr-2 h-5 w-5" />
              Add Show
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(showsByDate).map(([date, dateShows]) => {
              const showDate = parseISO(date);
              const isPast = isAfter(new Date(), showDate);
              
              return (
                <div key={date} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className={`px-6 py-3 ${isPast ? 'bg-gray-800/50' : 'bg-brand/10'} border-b border-white/10`}>
                    <h4 className="font-medium">
                      {format(showDate, 'EEEE, MMMM d, yyyy')}
                      {isPast && <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">Past</span>}
                    </h4>
                  </div>
                  <div className="divide-y divide-white/5">
                    {dateShows.map((show) => {
                      const screen = availableScreens.find(s => s._id === show.screen);
                      const isShowPast = isAfter(new Date(), new Date(show.endTime));
                      
                      return (
                        <div key={show._id} className="p-4 hover:bg-white/2.5 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-16 h-24 bg-gray-700 rounded-md overflow-hidden">
                                  {show.movie?.poster ? (
                                    <img 
                                      src={show.movie.poster} 
                                      alt={show.movie.title} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                      <FiFilm className="h-6 w-6 text-gray-500" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium truncate">{show.movie?.title || 'Unknown Movie'}</h4>
                                  <div className="flex flex-wrap items-center mt-1 text-sm text-gray-400 space-x-3">
                                    <span className="flex items-center">
                                      <FiClock className="mr-1.5 h-3.5 w-3.5" />
                                      {format(parseISO(show.startTime), 'h:mm a')} - {format(parseISO(show.endTime), 'h:mm a')}
                                    </span>
                                    <span>•</span>
                                    <span>{screen?.name || 'Screen N/A'}</span>
                                    <span>•</span>
                                    <span>₹{show.price}</span>
                                    <span>•</span>
                                    <span>{screen ? `${screen.capacity - (show.bookedSeats?.length || 0)}/${screen.capacity} seats` : 'Seats N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                              <button
                                onClick={() => startEdit(show)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-full transition-colors"
                                title="Edit show"
                                disabled={isLoading}
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => remove(show._id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full transition-colors"
                                title="Delete show"
                                disabled={isLoading}
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}