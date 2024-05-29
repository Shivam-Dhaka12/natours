const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require(`${__dirname}/../models/tourModel`);
const catchAsync = require(`${__dirname}/../utils/catchAsync`);
const AppError = require(`${__dirname}/../utils/appError`);
const factory = require(`${__dirname}/handlerFactory`);
const Booking = require(`${__dirname}/../models/bookingModel`);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // get currently booked tour
    const tourID = req.params.tourId;
    const tour = await Tour.findById(tourID);

    //Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',

        success_url: `${req.protocol}://${req.get('host')}/?tour=${
            req.params.tourId
        }&user=${req.user.id}&price=${tour.price}`,

        cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,

        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'inr',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [
                            `https://www.natours.dev/img/tours/${tour.imageCover}`,
                        ],
                    },
                },
            },
        ],
    });

    //create session as response
    res.status(200).json({
        status: 'success',
        session,
    });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // Only temporary solution because it is unsecure.
    const { tour, user, price } = req.query;

    if (!tour || !user || !price) return next();
    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.createBooking = factory.createOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
