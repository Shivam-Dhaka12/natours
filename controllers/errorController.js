const dotenv = require('dotenv');
const AppError = require('../utils/appError');

dotenv.config({ path: './config.env' });

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleValidatorErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input value: ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    let value = err.errmsg.match(
        /(?=["'])(?:"[^"\\]*(?:\\[\s\S][^"\\]*)*"|'[^'\\]*(?:\\[\s\S][^'\\]*)*')/
    );
    value = value.map((match) => match.slice(1, -1));
    // console.log(`The value is :${value}`);
    const message = `Duplicated field value: '${value}'. Please use another value.`;
    return new AppError(message, 400);
};

const handleJWTError = (err) => {
    return new AppError('Invalid token, Please login again.', 401);
};

const handleJWTExpiredError = (err) => {
    return new AppError('Your token has expired. Please login again.', 401);
};

const sendErrorDev = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack,
        });
        //Rendered Website
    } else {
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message,
        });
    }
};

const sendErrorProd = (err, req, res) => {
    // api
    if (req.originalUrl.startsWith('/api')) {
        // known / expected error : send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        //Programming or other unknown error / bug: don't send error details
        console.error('ERROR 💣 : ', err);
        return res.status(500).json({
            status: err.status,
            message: 'Something went very wrong',
        });
    }
    // render
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message,
        });
    }
    //Programming or other unknown error / bug: don't send error details
    console.error('ERROR 💣 : ', err);

    res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: 'Please try again later',
    });
};

module.exports = (err, req, res, next) => {
    // console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = Object.create(err);
        if (err.name === 'CastError') error = handleCastErrorDB(err);
        if (err.name === 'ValidationError') error = handleValidatorErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError(err);
        if (err.name === 'TokenExpiredError')
            error = handleJWTExpiredError(err);
        if (err.code === 11000) error = handleDuplicateFieldsDB(err);
        sendErrorProd(error, req, res);
    }
};
