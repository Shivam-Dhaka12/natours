import axios from "axios";
import Stripe from "stripe";
import { showAlert } from './alert';

export const bookTour = async (tourId) => {

    
    const stripe = Stripe('pk_test_51Nrx4kSC931e1nE7P0m4evsn0zedj99UGTjageK5ZLQ3lDIt1pNeu5x7bl6UsfLgLW2Em40BYZ4orbr6k1ETYsyG00HNpRGD1h');
    
    try {
        //get session from the server
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        // console.log(session);

         
        //create checkout form + charge the card
        
        // await stripe.redirectToCheckout({
        //     sessionId: session.data.session.id
        // })

        window.location.replace(session.data.session.url);
    } catch (error) {
        console.log(error);
        showAlert('error', error.message);
    }
   
}