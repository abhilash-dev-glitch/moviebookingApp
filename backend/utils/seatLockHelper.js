const { getRedisClient } = require('../config/redis');

// Lock duration in seconds (10 minutes)
const LOCK_DURATION = 600;

/**
 * Generate a unique key for seat lock
 * @param {string} showtimeId - Showtime ID
 * @param {string} row - Seat row
 * @param {string} seat - Seat number
 * @returns {string} Redis key
 */
const generateSeatKey = (showtimeId, row, seat) => {
  return `seat_lock:${showtimeId}:${row}-${seat}`;
};

/**
 * Lock seats temporarily for a user
 * @param {string} showtimeId - Showtime ID
 * @param {Array} seats - Array of seat objects [{row, seat}]
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result object with success status and locked seats
 */
const lockSeats = async (showtimeId, seats, userId) => {
  try {
    let redis;
    try {
      redis = getRedisClient();
    } catch (error) {
      console.warn('⚠️  Redis not available, skipping seat locking');
      return {
        success: true,
        lockedSeats: seats,
        expiresIn: LOCK_DURATION,
        redisDisabled: true,
      };
    }
    
    const lockedSeats = [];
    const alreadyLockedSeats = [];

    for (const seat of seats) {
      const seatKey = generateSeatKey(showtimeId, seat.row, seat.seat);
      
      // Try to set the lock (NX = only if not exists)
      const result = await redis.set(
        seatKey,
        JSON.stringify({ userId, lockedAt: new Date().toISOString() }),
        'EX',
        LOCK_DURATION,
        'NX'
      );

      if (result === 'OK') {
        lockedSeats.push(seat);
      } else {
        // Check if the seat is locked by the same user
        const existingLock = await redis.get(seatKey);
        if (existingLock) {
          const lockData = JSON.parse(existingLock);
          if (lockData.userId === userId) {
            // Refresh the lock for the same user
            await redis.expire(seatKey, LOCK_DURATION);
            lockedSeats.push(seat);
          } else {
            alreadyLockedSeats.push(seat);
          }
        }
      }
    }

    // If any seat is locked by another user, release all locks and return error
    if (alreadyLockedSeats.length > 0) {
      await releaseSeats(showtimeId, lockedSeats, userId);
      return {
        success: false,
        message: 'Some seats are already locked by another user',
        alreadyLockedSeats,
      };
    }

    return {
      success: true,
      lockedSeats,
      expiresIn: LOCK_DURATION,
    };
  } catch (error) {
    console.error('Error locking seats:', error);
    throw error;
  }
};

/**
 * Release seat locks
 * @param {string} showtimeId - Showtime ID
 * @param {Array} seats - Array of seat objects [{row, seat}]
 * @param {string} userId - User ID (optional, for verification)
 * @returns {Promise<boolean>} Success status
 */
const releaseSeats = async (showtimeId, seats, userId = null) => {
  try {
    let redis;
    try {
      redis = getRedisClient();
    } catch (error) {
      console.warn('⚠️  Redis not available, skipping seat release');
      return true;
    }
    const pipeline = redis.pipeline();

    for (const seat of seats) {
      const seatKey = generateSeatKey(showtimeId, seat.row, seat.seat);
      
      if (userId) {
        // Verify the lock belongs to the user before releasing
        const existingLock = await redis.get(seatKey);
        if (existingLock) {
          const lockData = JSON.parse(existingLock);
          if (lockData.userId === userId) {
            pipeline.del(seatKey);
          }
        }
      } else {
        // Force release (admin or system)
        pipeline.del(seatKey);
      }
    }

    await pipeline.exec();
    return true;
  } catch (error) {
    console.error('Error releasing seats:', error);
    throw error;
  }
};

/**
 * Check if seats are locked
 * @param {string} showtimeId - Showtime ID
 * @param {Array} seats - Array of seat objects [{row, seat}]
 * @returns {Promise<Object>} Object with locked and available seats
 */
const checkSeatsLocked = async (showtimeId, seats) => {
  try {
    let redis;
    try {
      redis = getRedisClient();
    } catch (error) {
      console.warn('⚠️  Redis not available, returning all seats as available');
      return {
        lockedSeats: [],
        availableSeats: seats,
        allAvailable: true,
      };
    }
    const lockedSeats = [];
    const availableSeats = [];

    for (const seat of seats) {
      const seatKey = generateSeatKey(showtimeId, seat.row, seat.seat);
      const lockData = await redis.get(seatKey);

      if (lockData) {
        const lock = JSON.parse(lockData);
        lockedSeats.push({ ...seat, lockedBy: lock.userId, lockedAt: lock.lockedAt });
      } else {
        availableSeats.push(seat);
      }
    }

    return {
      lockedSeats,
      availableSeats,
      allAvailable: lockedSeats.length === 0,
    };
  } catch (error) {
    console.error('Error checking seat locks:', error);
    throw error;
  }
};

/**
 * Extend lock duration for seats
 * @param {string} showtimeId - Showtime ID
 * @param {Array} seats - Array of seat objects [{row, seat}]
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
const extendSeatLock = async (showtimeId, seats, userId) => {
  try {
    let redis;
    try {
      redis = getRedisClient();
    } catch (error) {
      console.warn('⚠️  Redis not available, skipping lock extension');
      return true;
    }
    
    for (const seat of seats) {
      const seatKey = generateSeatKey(showtimeId, seat.row, seat.seat);
      const existingLock = await redis.get(seatKey);
      
      if (existingLock) {
        const lockData = JSON.parse(existingLock);
        if (lockData.userId === userId) {
          await redis.expire(seatKey, LOCK_DURATION);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error extending seat lock:', error);
    throw error;
  }
};

/**
 * Get all locked seats for a showtime
 * @param {string} showtimeId - Showtime ID
 * @returns {Promise<Array>} Array of locked seat information
 */
const getLockedSeatsForShowtime = async (showtimeId) => {
  try {
    let redis;
    try {
      redis = getRedisClient();
    } catch (error) {
      console.warn('⚠️  Redis not available, returning empty locked seats');
      return [];
    }
    const pattern = `seat_lock:${showtimeId}:*`;
    const keys = await redis.keys(pattern);
    
    const lockedSeats = [];
    for (const key of keys) {
      const lockData = await redis.get(key);
      if (lockData) {
        const lock = JSON.parse(lockData);
        const [, , seatInfo] = key.split(':');
        const [row, seat] = seatInfo.split('-');
        lockedSeats.push({
          row,
          seat,
          lockedBy: lock.userId,
          lockedAt: lock.lockedAt,
        });
      }
    }

    return lockedSeats;
  } catch (error) {
    console.error('Error getting locked seats:', error);
    throw error;
  }
};

module.exports = {
  lockSeats,
  releaseSeats,
  checkSeatsLocked,
  extendSeatLock,
  getLockedSeatsForShowtime,
  LOCK_DURATION,
};
