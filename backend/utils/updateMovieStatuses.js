const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');

/**
 * Update movie statuses based on their showtimes
 * - Set to 'inactive' if all shows are in the past
 * - Set to 'active' if there are current or future shows
 */
async function updateMovieStatuses() {
  try {
    const now = new Date();
    
    // Get all movies
    const movies = await Movie.find();
    
    for (const movie of movies) {
      // Get all showtimes for this movie
      const showtimes = await Showtime.find({ movie: movie._id });
      
      if (showtimes.length === 0) {
        // No shows at all - keep current status or set to upcoming
        continue;
      }
      
      // Check if there are any current or future shows
      const hasUpcomingShows = showtimes.some(show => new Date(show.startTime) > now);
      
      // Update status based on shows
      if (!hasUpcomingShows && movie.status !== 'inactive') {
        // All shows are in the past - set to inactive
        movie.status = 'inactive';
        await movie.save();
        console.log(`Updated movie "${movie.title}" to inactive (all shows expired)`);
      } else if (hasUpcomingShows && movie.status === 'inactive') {
        // Has upcoming shows but marked as inactive - set to active
        movie.status = 'active';
        await movie.save();
        console.log(`Updated movie "${movie.title}" to active (has upcoming shows)`);
      }
    }
    
    return { success: true, message: 'Movie statuses updated successfully' };
  } catch (error) {
    console.error('Error updating movie statuses:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { updateMovieStatuses };
