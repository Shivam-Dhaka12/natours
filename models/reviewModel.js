const mongoose = require('mongoose');
const Tour = require(`${__dirname}/tourModel`);

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
        // review / rating/ createdAt / ref to tour/ ref to tour
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//pre create review middleware
// reviewSchema.pre('save', function (next, req) {
//     this.user = req.user._id;
//     console.log(this.user);
//     next();
// });

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    });

    next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            }
        }
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        })  
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        })
    }

}

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    //await this.findOne() does not work, query was already executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

reviewSchema.post('save', function (){
    //this points to current review.    
    this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
