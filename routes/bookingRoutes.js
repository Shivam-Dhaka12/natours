const express = require('express');

const authController = require(`${__dirname}/../controllers/authController`);
const bookingController = require(`${__dirname}/../controllers/bookingController`);

const router = express.Router();

router
    .get('/checkout-session/:tourId', authController.protect, bookingController.getCheckoutSession);


router.use(authController.protect, authController.restrictTo('admin', 'lead-guide'));

router
    .route('/')
    .get(bookingController.getAllBookings)
    .post(bookingController.createBooking);

router
    .route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);
    
        

module.exports = router;
