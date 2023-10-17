import axios from 'axios';
import { showAlert } from './alert';

//type is either password or data
export const updateSettings = async (data, type) => {

    try {
        
        const url = type === 'password'
            ? '/api/v1/users/updatepassword'
            :
            `/api/v1/users/updateme`;

        const res = await axios(
            {
                method: 'PATCH',
                url,
                data
            });
        
        if (res.data.status === 'success') {
            location.reload(true);
            showAlert('success', `${type.toUpperCase()} updated Successfully`);
        }

    } catch (error) {
        console.log(error);
        showAlert('error', error.response.data.message);
    }
}