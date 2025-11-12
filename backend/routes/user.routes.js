const express = require('express');
const {
  getAllUsers,
  getUser,
  createTheaterManager,
  updateUserRole,
  assignTheaters,
  removeTheaterFromManager,
  deactivateUser,
  activateUser,
  getAllTheaterManagers,
  getMyTheaters,
  uploadProfilePicture,
  deleteProfilePicture,
} = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile picture routes (accessible to all authenticated users)
router.post('/profile-picture', uploadSingle('profilePicture'), uploadProfilePicture);
router.delete('/profile-picture', deleteProfilePicture);

// Theater Manager routes
router.get('/my-theaters', restrictTo('theaterManager'), getMyTheaters);

// Admin only routes
router.get('/', restrictTo('admin'), getAllUsers);
router.get('/theater-managers', restrictTo('admin'), getAllTheaterManagers);
router.get('/:id', restrictTo('admin'), getUser);
router.post('/theater-manager', restrictTo('admin'), createTheaterManager);
router.patch('/:id/role', restrictTo('admin'), updateUserRole);
router.patch('/:id/assign-theaters', restrictTo('admin'), assignTheaters);
router.delete('/:id/theaters/:theaterId', restrictTo('admin'), removeTheaterFromManager);
router.patch('/:id/deactivate', restrictTo('admin'), deactivateUser);
router.patch('/:id/activate', restrictTo('admin'), activateUser);

module.exports = router;
