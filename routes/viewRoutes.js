const express = require('express');
const viewsController = require('../controllers/viewsController')
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get('/me', authController.protect, viewsController.getAccount);

router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.use(authController.isLoggedIn);

router
    .get(
        '/',
        bookingController.createBookingCheckout,
        viewsController.getHome
    );
router.get('/tours/:slug', viewsController.getTour);
router.get('/login', viewsController.login);
router.get('/signup', viewsController.signup);

router.get('/reset-password', viewsController.getResetPassword);
router.get('/create-new-password', viewsController.createNewPassword);

router.get('/stories', viewsController.getStories);
router.get('/tours', viewsController.getAllTours);

module.exports = router;