const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Booking = require('./../models/bookingModel');
const Review = require(`${__dirname}/../models/reviewModel`);


exports.getAllTours = catchAsync( async (req, res, next) => {
    // 1. get tour data from collection
    let tours = await Tour.find();
    //2. Build template
    //3. Render that template using data from step 1.
    for (let i = 0; i < tours.length; i++) {
        tours[i].ratingsAverage = Math.round(tours[i].ratingsAverage * 100) / 100;
      }

    res.status(200).render('tours', {
        title: 'All Tours',
        tours
    })
});

exports.getTour = catchAsync (async (req, res, next) => {
    //`get data for the requested tour (including reviews and tour guides)
    const slug = req.params.slug;
    const tour = await Tour.findOne({ slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }
    
    //Build template
    res.status(200).render('tour', {
        title: tour.name,
        tour
    })
});

exports.getAccount = (req, res)=> {
    res.status(200).render('account', {
        title: 'Your Account'
    })
}

exports.login = (req, res)=> {
    res.status(200).render('login', {
        title: 'Login'
    })
}

exports.signup = (req, res)=> {
    res.status(200).render('signup', {
        title: 'Signup'
    })
}

exports.getMyTours = catchAsync (async (req, res, next) => {
    
    try {
        
        //find all bookings
        const bookings = await Booking.find({ user: req.user.id });
        //find tours with the returned ids
        const tourIds = bookings.map(el => el.tour);
        const tours = await Tour.find({ _id: { $in: tourIds } });
    
        res.status(200).render('tours', {
            title: 'My Tours',
            tours
        });
    } catch (error) {
        console.log(error);
    }
})

exports.getStories = catchAsync(async (req, res, next) => {

    const reviews = await Review.find();
    res.status(200).render('stories', {
        title: 'Stories',
        reviews
    })
})

exports.getHome = catchAsync(async (req, res, next) => {

    res.status(200).render('home', {
        title: 'Home',
    });
})

exports.getResetPassword = catchAsync(async (req, res, next) => {
    
    res.status(200).render('resetPassword', {
        title: 'Reset Password',
    });
})

exports.createNewPassword = catchAsync(async (req, res, next) => {
    
    res.status(200).render('createNewPassword', {
        title: 'Create New Password',
    });
})



