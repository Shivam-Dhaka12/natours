const express = require('express');
const userController = require(`${__dirname}/../controllers/userController`);
const authController = require(`${__dirname}/../controllers/authController`);


const router = express.Router();

//user Routes

router
  .route('/auth/google')
  .get(authController.googleAuth);

router
  .route('/auth/google/callback')
  .get(authController.googleAuthCallback);

router
  .route('/signup')
  .post(authController.signup);

router
  .route('/login')
  .post(authController.login);

router
  .route('/logout')
  .get(authController.logout);

router
  .route('/forgotPassword')
  .post(authController.forgotPassword);

router
  .route('/resetPassword/:token')
  .patch(authController.resetPassword);

router
  .route('/sendMail')
  .post(authController.sendContactFormEmail);


router.use(authController.protect); // protecting below routes.


router
  .route('/me')
  .get( userController.getMe, userController.getUser);
  
router
  .route('/updateme')
  .patch(
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);
  
router
  .route('/img')
  .get( userController.getImage);
  
router
  .route('/updatepassword')
  .patch( authController.updatePassword);

router
  .route('/deleteme')
  .delete( userController.deleteMe);


router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);


module.exports = router; 

