// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require(`${__dirname}/../models/tourModel`);
const catchAsync = require(`${__dirname}/../utils/catchAsync`);
const AppError = require(`${__dirname}/../utils/appError`);
const factory = require(`${__dirname}/handlerFactory`);


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image!, Please upload only images.', 400), false);
  }
}


const upload = multer({ 
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();


  // Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);
  
  
  // Images
  req.body.images = [];

  await Promise.all(
    
    req.files.images.map(async (file, i) => {
      
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
    
      req.body.images.push(filename);
      
    }));
  
  next();

});
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};



exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
  
//   await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) return next(new AppError('No tour find with that ID', 404));
  
//     res.status(200).json({
//       status: 'success',
//       message: 'Document deleted successfully.',
//     });

// });

exports.getStats = catchAsync(async (req, res, next) => {
  
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          ratingsAverage: { $avg: '$ratingsAverage' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: stats,
    });

});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  
    const year = req.params.year * 1;
    const monthlyPlan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id'}
      },
      {
        $project: {
          _id: 0
        }
      },
      {
        $sort: { numTourStarts: -1}
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: monthlyPlan,
    });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // console.log(distance, lat, lng, unit);
  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
  }

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  })
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
});

exports.getDistances = catchAsync(async (req, res, next) => {
  
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  // console.log(distance, lat, lng, unit);
  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1, 
        name: 1
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      data: distances
    }
  })

});

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours.json`),
// );

// //param middleware
// exports.checkId = (req, res, next, val) => {
//   // const { id } = req.params;
//   // const tour = tours.find((el) => el._id === id);

//   // if (!tour) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: 'Invalid ID',
//   //   });
//   // }

//   next();
// };

// exports.checkReqBody = (req, res, next) => {
//   if (!req.body || !(req.body.name && req.body.price)) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Bad Request!',
//     });
//   }
//   next();
// };
// Route Handlers
// exports.getAllTours = (req, res) => {
// res.status(200).json({
//   status: 'success',
//   requestTime: req.requestTime,
//   results: tours.length,
//   data: {
//     tours: tours,
//   },
// });
// };

// exports.getTour = (req, res) => {
//   // console.log(req.params);
//   // const { id } = req.params;
//   // const tour = tours.find((el) => el._id === id);
//   // res.status(200).json({
//     //   status: 'success',
//     //   data: {
//       //     tour,
//       //   },
//       // });
//     };

// exports.createTour = (req, res) => {
//   // const newId = tours[tours.length - 1]._id + 1;
//   // const newTour = { id: newId, ...req.body }; //adding id to new tour object
//   // tours.push(newTour); // adding newTour to our tour array
//   // fs.writeFile(
//     //   `${__dirname}/dev-data/data/tours.json`,
//     //   JSON.stringify(tours),
//     //   () => {
//       //     res.status(201).json({
//         //       status: 'success',
//         //       data: {
//           //         tour: newTour,
//           //       },
//           //     });
//           //   },
//           // );
//         };

//
// const queryObj = { ...req.query };

// //filtering
// const excludeFields = ['page', 'sort', 'limit', 'fields'];
// excludeFields.forEach((el) => delete queryObj[el]);

// //advanced filtering
// let queryStr = JSON.stringify(queryObj).replace(
//   /\b(lte|lt|gte|gt)\b/g,
//   (match) => `$${match}`
// );
// queryStr = JSON.parse(queryStr);
// let query = Tour.find(queryStr);

//sorting
// if (req.query.sort) {
//   const sortBy = req.query.sort.split(',').join(' ');
//   query = query.sort(sortBy);
// } else {
//   query = query.sort('createdAt');
// }

// //limiting
// if (req.query.limit) {
//   query = query.limit(parseInt(req.query.limit, 10));
// }

// //Limiting Fields
// if (req.query.fields) {
//   query = query.select(req.query.fields.split(',').join(' '));
// }

// //pagination
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;

// if (req.query.page) {
//   const numTours = await Tour.countDocuments();
//   if (skip >= numTours) throw new Error('Number of pages exceeded the result limit');
// }
// query = query.skip(skip).limit(limit);

