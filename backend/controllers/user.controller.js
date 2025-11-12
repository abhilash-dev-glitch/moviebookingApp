const User = require('../models/User');
const Theater = require('../models/Theater');
const AppError = require('../utils/appError');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate('managedTheaters', 'name city').select('-password');

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('managedTheaters', 'name city location')
      .select('-password');

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create theater manager
// @route   POST /api/v1/users/theater-manager
// @access  Private/Admin
exports.createTheaterManager = async (req, res, next) => {
  try {
    const { name, email, password, phone, managedTheaters } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('User already exists with this email', 400));
    }

    // Verify theaters exist
    if (managedTheaters && managedTheaters.length > 0) {
      const theaters = await Theater.find({ _id: { $in: managedTheaters } });
      if (theaters.length !== managedTheaters.length) {
        return next(new AppError('One or more theaters not found', 404));
      }
    }

    // Create theater manager
    const theaterManager = await User.create({
      name,
      email,
      password,
      phone,
      role: 'theaterManager',
      managedTheaters: managedTheaters || [],
    });

    // Remove password from output
    theaterManager.password = undefined;

    res.status(201).json({
      status: 'success',
      data: {
        theaterManager,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PATCH /api/v1/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['endUser', 'admin', 'theaterManager'].includes(role)) {
      return next(new AppError('Invalid role', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign theaters to manager
// @route   PATCH /api/v1/users/:id/assign-theaters
// @access  Private/Admin
exports.assignTheaters = async (req, res, next) => {
  try {
    const { theaterIds } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    if (user.role !== 'theaterManager') {
      return next(new AppError('User must be a theater manager', 400));
    }

    // Verify theaters exist
    const theaters = await Theater.find({ _id: { $in: theaterIds } });
    if (theaters.length !== theaterIds.length) {
      return next(new AppError('One or more theaters not found', 404));
    }

    user.managedTheaters = theaterIds;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('managedTheaters', 'name city')
      .select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove theater from manager
// @route   DELETE /api/v1/users/:id/theaters/:theaterId
// @access  Private/Admin
exports.removeTheaterFromManager = async (req, res, next) => {
  try {
    const { id, theaterId } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    if (user.role !== 'theaterManager') {
      return next(new AppError('User must be a theater manager', 400));
    }

    user.managedTheaters = user.managedTheaters.filter(
      (theater) => theater.toString() !== theaterId
    );

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('managedTheaters', 'name city')
      .select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user
// @route   PATCH /api/v1/users/:id/deactivate
// @access  Private/Admin
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'User deactivated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user
// @route   PATCH /api/v1/users/:id/activate
// @access  Private/Admin
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'User activated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all theater managers
// @route   GET /api/v1/users/theater-managers
// @access  Private/Admin
exports.getAllTheaterManagers = async (req, res, next) => {
  try {
    const theaterManagers = await User.find({ role: 'theaterManager' })
      .populate('managedTheaters', 'name city location')
      .select('-password');

    res.status(200).json({
      status: 'success',
      results: theaterManagers.length,
      data: {
        theaterManagers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my managed theaters (Theater Manager)
// @route   GET /api/v1/users/my-theaters
// @access  Private/TheaterManager
exports.getMyTheaters = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('managedTheaters');

    if (!user || user.role !== 'theaterManager') {
      return next(new AppError('Only theater managers can access this route', 403));
    }

    res.status(200).json({
      status: 'success',
      results: user.managedTheaters.length,
      data: {
        theaters: user.managedTheaters,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture
// @route   POST /api/v1/users/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Delete old profile picture from Cloudinary if exists
    if (user.profilePicture && user.profilePicturePublicId) {
      try {
        await deleteFromCloudinary(user.profilePicturePublicId);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    }

    // Upload new profile picture to Cloudinary
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      'movie-booking/users',
      {
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
        ],
      }
    );

    // Update user with new profile picture
    user.profilePicture = result.url;
    user.profilePicturePublicId = result.publicId;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: result.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete profile picture
// @route   DELETE /api/v1/users/profile-picture
// @access  Private
exports.deleteProfilePicture = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!user.profilePicture) {
      return next(new AppError('No profile picture to delete', 400));
    }

    // Delete from Cloudinary
    if (user.profilePicturePublicId) {
      try {
        await deleteFromCloudinary(user.profilePicturePublicId);
      } catch (error) {
        console.error('Error deleting profile picture:', error);
      }
    }

    // Remove from user document
    user.profilePicture = undefined;
    user.profilePicturePublicId = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile picture deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
