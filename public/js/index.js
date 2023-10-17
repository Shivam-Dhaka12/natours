import '@babel/polyfill';
import displayMap from './leaflet.js';
import { login, logout, gooogleAuth, signUp, resetPassword, createNewPassword } from './login.js';
import { sendMail } from './contactForm.js';
import { updateSettings } from './updateSettings.js';
import { bookTour } from './stripe.js';
import smoothScroll from './smoothScroll.js';
import handleNavItemClick from './nav.js';
import { scrollLeft, scrollRight } from './horizontalScroll.js';
import { replaceLowResWithHighRes } from './progressiveLoading.js';
import { showAlert } from './alert.js';

// DOM elements
const map = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const contactForm = document.querySelector('.form--contact');
const resetPasswordForm= document.querySelector('.form--resetPassword');
const createNewPasswordForm = document.querySelector('.form--createNewPassword');
const googleLoginBtn = document.getElementById('google-login');
const logOutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
const navItems = document.querySelectorAll('.navigation__link');
const scrollWrapper = document.querySelector(".scroll-wrapper");
const scrollLeftBtn = document.querySelector(".icon-arrows-square-left");
const scrollRightBtn = document.querySelector(".icon-arrows-square-right");
// const signUpBtn = document.querySelector("#signup");
const largeScreens = window.matchMedia(
  "screen and (min-resolution: 192dpi) and (min-width: 37.5em), " +
  "screen and (-webkit-min-device-pixel-ratio: 2) and (min-width: 37.5em), " +
  "screen and (min-width: 125em)"
);





// Check if the media query is currently true
if (largeScreens.matches) {
  // Load a larger or higher-resolution image for large screens
  
 
    replaceLowResWithHighRes('.header', '../img/hero.jpg');

    replaceLowResWithHighRes('.section-features', '../img/nat-4.jpg');
  
    replaceLowResWithHighRes('.book', '../img/nat-10.jpeg');
  
    replaceLowResWithHighRes('.tour-card--1', '../img/nat-5.jpg');
    replaceLowResWithHighRes('.card__picture--1', '../img/nat-5.jpg');
  
    replaceLowResWithHighRes('.tour-card--2', '../img/nat-6.jpg');
    replaceLowResWithHighRes('.card__picture--2', '../img/nat-6.jpg');
  
    replaceLowResWithHighRes('.tour-card--3', '../img/nat-7.jpg');
    replaceLowResWithHighRes('.card__picture--3', '../img/nat-7.jpg');
  
} else {
  // Load a standard image for other screens
  
  
    replaceLowResWithHighRes('.header', '../img/hero-small.jpg');

    replaceLowResWithHighRes('.section-features', '../img/nat-4-small.jpeg');
  
    replaceLowResWithHighRes('.book', '../img/nat-10.jpeg');
  
    replaceLowResWithHighRes('.tour-card--1', '../img/nat-5-small.jpeg');
    replaceLowResWithHighRes('.card__picture--1', '../img/nat-5-small.jpeg');
  
    replaceLowResWithHighRes('.tour-card--2', '../img/nat-6-small.jpeg');
    replaceLowResWithHighRes('.card__picture--2', '../img/nat-6-small.jpeg');
  
    replaceLowResWithHighRes('.tour-card--3', '../img/nat-7-small.jpeg');
    replaceLowResWithHighRes('.card__picture--3', '../img/nat-7-small.jpeg');
  
}
  

// Values
if (map) {
    const locations = JSON.parse(map.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    
    e.preventDefault();
  
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);

  });
}

if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', gooogleAuth);
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (signupForm) {

  signupForm.addEventListener('submit', e => { 
    
    e.preventDefault();
    
    const name = document.getElementById('name-signup').value;
    const email = document.getElementById('email-signup').value;
    const password = document.getElementById('password-signup').value;
    const confirmPassword = document.getElementById('confirm-password-signup').value;
  
    signUp(name, email, password, confirmPassword);
  });

}

if (scrollLeftBtn) {
  scrollLeftBtn.addEventListener('click', scrollLeft);
}

if (scrollRightBtn) {
  scrollRightBtn.addEventListener('click', scrollRight);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();

    const form = new FormData();

    // console.log(form);

    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  
  })
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async e => {

    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');


    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value='';
    document.getElementById('password').value='';
    document.getElementById('password-confirm').value = '';
  })
}

if (bookBtn) {
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId;

    // console.log(tourId);
    bookTour(tourId);
  })
}


if (navItems) {
  navItems.forEach(item => {
    handleNavItemClick(item, smoothScroll, '.navigation__checkbox');
  });
}

if(scrollWrapper) {
  scrollLeft(scrollWrapper);
  scrollRight(scrollWrapper);
}


if (resetPasswordForm) {


  resetPasswordForm.addEventListener('submit', async e => {

    e.preventDefault();

    const email = document.getElementById('email-resetPassword').value;

    await resetPassword(email);

  })
}

if (createNewPasswordForm) {


  createNewPasswordForm.addEventListener('submit', async e => {

    e.preventDefault();

    try {

      const code = document.getElementById('verification-code').value;
      const password = document.getElementById('password-createNewPassword').value;
      const passwordConfirm = document.getElementById('confirm-password-createNewPassword').value;

      // console.log(code, password, passwordConfirm);
      
      await createNewPassword(code, password, passwordConfirm);

    } catch (error) {
      console.log(error);
      showAlert('error', error.response.data.message);
    }



  })
}

if (contactForm) {

  // console.log('contactForm');

  contactForm.addEventListener('submit', async e => {

    e.preventDefault();

    try {

      const name = document.getElementById('name--contact').value;
      const email = document.getElementById('email--contact').value;
      const message = document.getElementById('message--contact').value;
    
      const subject = document.querySelector('input[name="size"]:checked').value;

      await sendMail(name, email, subject, message);

    } catch (error) {
      console.log(error);
      showAlert('error', error.response.data.message);
    }



  })
}