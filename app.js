const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');

const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
}));

app.options('*', cors());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


//serving static files from public folder
app.use(express.static(path.join(__dirname, 'public')));


//MIDDLEWARES

//devlopment logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// //set cors headers
// const corsOptions = {
//     origin: '*', // Allow requests from this origin
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   };
  
  // Use the CORS middleware


//set security headers
app.use(helmet());

//limiteng requests from same ip
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

//body parser: reading data from body into req.body
app.use(
    express.json({
        limit: '10kb', // limiting size of data in request body
    })
);
app.use(cookieParser());


//Data santization against noSql query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
);


app.use(compression());

//test middleware
app.use((req, res, next) => {
    // Creating middleware.
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});

app.use((req, res, next) => {
    res.locals.currentRoute = req.originalUrl;
    next();
});

// Routers

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    // res.status(404).json({
    //   status: 'fail',
    //   message: `Can't find ${req.originalUrl} on this server! Please recheck your URL.`,
    // })
    next(
        new AppError(
            `Can't find ${req.originalUrl} on this server! Please recheck your URL.`,
            404
        )
    );
});

//error handling middleware in express
app.use(errorController);

module.exports = app;
