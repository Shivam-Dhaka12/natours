import axios from 'axios';
import { showAlert } from './alert';
export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email,
                password
            }
        });

        if (res.data.status === 'success') {
            showAlert('success','Logged in successfully!');
            window.setTimeout(() => {
                location.assign('/')
            }, 1500);
        }
    } catch (error) {
        showAlert('error', error.response.data.message);
    }
}

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout',
        });

        if (res.data.status === 'success') {
            showAlert('success','Logged Out Successfully!');
            window.setTimeout(() => {
                location.assign('/')
            }, 1500);
        }
    } catch (error) {
        console.log(error.message);
        showAlert('error', 'Error logging out! Try again.');
    }
}


export const gooogleAuth = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/auth/google',
        });
        // console.log(res);
        window.open(res.data);
    } catch (error) {
        console.log(error.message);
        showAlert('error', 'Error Logging In! Try again.');
    }
}

export const signUp = async (name, email, password, passwordConfirm) => {

    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm
            }
        });

        if (res.data.status === 'success') {
            showAlert('success','Signed Up Successfully!');
            window.setTimeout(() => {
                location.assign('/')
            }, 1500);
        }
    } catch (error) {
        console.log(error);
        showAlert('error', error.response.data.message);
    }
}


export const resetPassword = async (email) => {

    try {
        const btn = document.querySelector('#resetPassword');
        btn.textContent = 'Sending...';
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/forgotPassword',
            data: {
                email
            }
        });

        if (res.data.status === 'success') {
            btn.textContent = 'Sent Successfully';
            showAlert('success', 'Success! Check your mail and copy verfication code!');
            setTimeout(() => {
                location.assign('/create-new-password');
            }, 2500);
        }
    } catch (error) {
        console.log(error);
        showAlert('error', error.response.data.message);
    }
}

export const createNewPassword = async (code, password, passwordConfirm) => {

    try {
        const btn = document.querySelector('#createNewPassword');
        btn.textContent = 'Setting up...';
        const res = await axios({
            method: 'PATCH',
            url: `/api/v1/users/resetPassword/${code}`,
            data: {
                password,
                passwordConfirm
            }
        });

        if (res.data.status === 'success') {
            btn.textContent = 'Success';
            showAlert('success', 'Password Updated Successfully!');
            setTimeout(() => {
                location.assign('/');
            }, 1000);
        }
    } catch (error) {
        console.log(error);
        showAlert('error', error.response.data.message);
    }
}