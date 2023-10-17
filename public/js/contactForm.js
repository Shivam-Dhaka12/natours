import axios from 'axios';
import { showAlert } from './alert';

export const sendMail = async (name, email, subject, message) => {

    try {
        const btn = document.querySelector('#send-mail');
        btn.textContent = 'Sending...';
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/sendMail',
            data: {
                name,
                email,
                subject,
                message,
            }
        });

        if (res.data.status === 'success') {
            btn.textContent = 'Sent';
            showAlert('success', 'Email sent successfully!');
        }
    } catch (error) {
        console.log(error);
        showAlert('error', error.response.data.message);
    }
}