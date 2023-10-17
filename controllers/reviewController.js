const Review = require(`${__dirname}/../models/reviewModel`);
const factory = require(`${__dirname}/handlerFactory`);
// const AppError = require(`${__dirname}/../utils/appError`);
// const catchAsync = require(`${__dirname}/../utils/catchAsync`);


exports.setTourUserIds = (req, res, next) => {
    //allow nested routes.
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user._id;
    next();
}


exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
