// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const AWS = require('aws-sdk');

// const ApiFeatures = require(`${__dirname}/../utils/ApiFeatures`);
const User = require(`${__dirname}/../models/userModel`);
const catchAsync = require(`${__dirname}/../utils/catchAsync`);
const AppError = require(`${__dirname}/../utils/appError`);
const factory = require(`${__dirname}/handlerFactory`);

const s3 = new AWS.S3({
    endpoint: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};

    // we use [] to acess obj keys when el is a variable (dynamic or inside a loop) not an exact match like in this case.
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(
            new AppError('Not an image!, Please upload only images.', 400),
            false
        );
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

async function uploadObject(userId, file) {
    const params = {
        Body: file,
        Bucket: 'natours',
        Key: `${userId}.jpeg`,
    };

    s3.putObject(params, function (err, data) {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('Success:', data);
        }
    });
    // console.log(JSON.stringify(response, null, 2));
}
// this function also stores images to aws bucket after resizing them.
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    const file = await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 100 })
        .toBuffer();

    await uploadObject(req.user._id, file);

    next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'Cannot change password from this route. Go to /users/updatepassword',
                400
            )
        );
    }

    const filteredBody = filterObj(req.body, 'name', 'email');

    if (req.file) {
        filteredBody.photo = `/api/v1/users/img/`;
    }

    // new: true return newly updated user data.
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        { new: true, runValidators: true }
    );
    res.status(200).json({
        status: 'success',
        message: 'Your data is updated!',
        data: {
            user: updatedUser,
        },
    });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user._id;
    next();
};

// sends image to client
exports.getImage = catchAsync(async (req, res) => {
    const key = `${req.user._id}.jpeg`;

    const params = {
        Bucket: 'natours',
        Key: key,
    };

    try {
        const fileStream = s3.getObject(params).createReadStream();
        res.setHeader('Content-Type', 'image/jpeg'); // Adjust the MIME type according to your file
        fileStream.pipe(res);

        // res.send(imageData);
    } catch (err) {
        console.error(err);
    }

    // res.status(200).json({
    //   status: 'success',
    //   // data: readStream
    // })
    // res.setHeader("Content-Disposition", `attachment; filename=${key}`);
    // // res.setHeader("Content-Type", res.ContentType);
    // readStream.pipe(res);
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        status: 'success',
        message: 'user deleted successfully.',
    });
});

//Do not update password with this.
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
// exports.getTour = catchAsync(async (req, res, next) => {

//   const tour = await Tour.findById(req.params.id, err => {
//     if (err) {
//       return next(new AppError('No tour found with that ID', 404));
//     }
//   });

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });

// });

// exports.createUser = catchAsync(async (req, res, next) => {
//     const newUser = await User.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: {
//         user: newUser,
//       },
//     });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {

//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });
//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });

// });

// exports.deleteTour = catchAsync(async (req, res, next) => {

//   await Tour.findByIdAndDelete(req.params.id);
//     res.status(200).json({
//       status: 'success',
//       message: 'Document deleted successfully.',
//     });

// });

// exports.getStats = catchAsync(async (req, res, next) => {

//     const stats = await Tour.aggregate([
//       {
//         $match: { ratingsAverage: { $gte: 4.5 } },
//       },
//       {
//         $group: {
//           _id: { $toUpper: '$difficulty' },
//           numTours: { $sum: 1 },
//           numRatings: { $sum: '$ratingsQuantity' },
//           ratingsAverage: { $avg: '$ratingsAverage' },
//           minPrice: { $min: '$price' },
//           maxPrice: { $max: '$price' },
//           avgPrice: { $avg: '$price' },
//         },
//       },
//       {
//         $sort: { avgPrice: 1 },
//       },
//     ]);

//     res.status(200).json({
//       status: 'success',
//       data: stats,
//     });

// });

// exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

//     const year = req.params.year * 1;
//     const monthlyPlan = await Tour.aggregate([
//       {
//         $unwind: '$startDates',
//       },
//       {
//         $match: {
//           startDates: {
//             $gte: new Date(`${year}-01-01`),
//             $lte: new Date(`${year}-12-31`),
//           },
//         },
//       },
//       {
//         $group: {
//           _id: { $month: '$startDates' },
//           numTourStarts: { $sum: 1 },
//           tours: { $push: '$name' },
//         },
//       },
//       {
//         $addFields: { month: '$_id'}
//       },
//       {
//         $project: {
//           _id: 0
//         }
//       },
//       {
//         $sort: { numTourStarts: -1}
//       },
//     ]);

//     res.status(200).json({
//       status: 'success',
//       data: monthlyPlan,
//     });
// });
