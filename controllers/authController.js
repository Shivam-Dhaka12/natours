const { promisify } = require('util');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require('crypto');
const sharp = require('sharp');

const User = require(`${__dirname}/../models/userModel`);
const catchAsync = require(`${__dirname}/../utils/catchAsync`);
const AppError = require(`${__dirname}/../utils/appError`);
const Email = require(`${__dirname}/../utils/email`);

dotenv.config({ path: './config.env' });

function generateRandomPassword() {
  const length = 20;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}


async function processImageFromUrl(imageUrl, user_id) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    const filename = `user-${user_id}-${Date.now()}.jpeg`;
    // Pass the image buffer to the sharp constructor
    const processedImage = sharp(response.data)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${filename}`);
    
    return filename;

  } catch (error) {
    console.error(error);
    // Handle the error according to your requirements
    throw new Error('Failed to process image');
  }
}
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookie_options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  }


  if (process.env.NODE_ENV === 'production') {
    cookie_options.secure = true;
  }
  res.cookie(
    'jwt', token,
    cookie_options
  );
  
  if(user.password) user.password = undefined;

  // function add two numbers

  res.status(statusCode).json({
    status: 'success',
    data: {
      user,
      token
    }
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
  
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if emial and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
  
});



exports.sendContactFormEmail = catchAsync(async (req, res, next) => {

  try {
    
    const { name, email, message, subject } = req.body;
    await new Email().sendContactForm(name, email, message, subject);
    
    res.status(200).json({
      status: 'success'
    });

  } catch (error) {
      console.log(error);
      return next(new AppError(error.message, 500));
  }

})


// only for rendered pages, so there will not be any errors :)
exports.isLoggedIn = async (req, res, next) => {

  //check if token is there
  if (req.cookies.jwt) {
    try {
        //validate token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

      //check if user still exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      // check if user changed password after the token was issued.
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //There exists a logged in user.
      res.locals.user = freshUser;
      // console.log('res.locals.user', res.locals.user);
      return next();

    } catch (error) {
      return next();
    }
    
  
  }
  next();
};

exports.logout = (req, res) => {
  
  res.cookie('jwt', 'Logged Out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success'
  });
}
//protect route
exports.protect = catchAsync(async (req, res, next) => {
  //check if token is there

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }
  //validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError('This user does not exist', 401));
  }
  // check if user changed password after the token was issued.
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password changed recently! Please login again', 401)
    );
  }
  //grant access to protected route.
  req.user = freshUser;
  res.locals.user = freshUser;

  next();
});

exports.restrictTo = (...roles) => {
  //roles is an array of arguments.
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not enough permission, Access Denied', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with current email address', 404));
  }
  //generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //snd the random token as email.
  
  
  try {
    
    const resetURL = `${resetToken}`;
    
    await new Email(user, resetURL).sendPasswordReset();

    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid only for 10 mins)',
    //   message
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });

    
  } catch (error) {
    console.log(error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError(error.message, 500));
  }
});

exports.resetPassword = catchAsync( async (req, res, next) => {

  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  console.log(hashedToken, Date.now() , await User.findOne({passwordResetToken: hashedToken}).passwordResetExpires);
  
  const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: Date.now()
      }
  });
  
  // If token has not expired, and there is a user, set the neww pasword
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  //Update changePasswordAt property for the user
  // user.passwordChangedAt = Date.now();
  //moved in userModel
  await user.save();
  //log the user in, send JWT
  createSendToken(user, 200, res);
  next();
});


exports.updatePassword = catchAsync(async (req, res, next) => {
  //get user from collection
  const user = await User.findById(req.user._id).select('+password');
  //if current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Wrong Password! Please try again.', 401));
  }
  
  //if correct update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //log user in, send JWT
  createSendToken(user, 200, res);
  // next();
});

const getGoogleAuthUrl = () => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    client_id: process.env.GOOGLE_AUTH_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'].join(' '),
  };
  return `${rootUrl}?${new URLSearchParams(options).toString()}`;
}

// Getting login URL
exports.googleAuth = catchAsync(async (req, res, next) => {
  res.send(getGoogleAuthUrl());
});

//after google authentication
exports.googleAuthCallback = catchAsync(async (req, res, next) => {
  try {
    // Extract the authorization code from the query parameters
    const { code } = req.query;

    if (!code) {
      // Handle the case where there's no authorization code
      return (next(new AppError('No authorization code found in the query parameters', 400)));
    }

    // Define the Google OAuth token endpoint URL
    const tokenUrl = 'https://oauth2.googleapis.com/token';

    // Set up the request data to exchange the authorization code for an access token
    const requestData = {
      client_id: process.env.GOOGLE_AUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    };

    // Send a POST request to the Google token endpoint
    const response = await axios.post(tokenUrl, requestData);

    // Extract the access token from the response
    const accessToken = response.data.access_token;

    // Example: Fetch user data from Google
    const userDataResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Generate a JWT token with user data
    const userData = userDataResponse.data;
    // console.log(userData);
    let user = await User.findOne({ email: userData.email });
    
    // 1> Create User if user does not exist

    if (!user) {

      const randomPassword = generateRandomPassword();
      const newUser = await User.create({
        name: userData.name,
        email: userData.email,
        oauthUser: true,
        password: randomPassword,
        passwordConfirm: randomPassword
      });
      //2> Update User photo
      const photo= await processImageFromUrl(userData.picture, newUser._id);
      const updatedUser = await User.findByIdAndUpdate(newUser._id, { photo}, { new: true });

  
      //3> Set user_id to new User id.
      user = updatedUser;
      // console.log('user_id: ===>   ',user._id);
    }



    const token = signToken(user._id);
    const cookie_options = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
      httpOnly: true
    }
  
    if (process.env.NODE_ENV === 'production') {
      cookie_options.secure = true;
    }
    res.cookie(
      'jwt', token,
      cookie_options
    );

    // Optionally, redirect the user to another page
    res.redirect('/'); // Redirect to the homepage or another route

  } catch (error) {
    console.error('Error handling Google callback:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

});



