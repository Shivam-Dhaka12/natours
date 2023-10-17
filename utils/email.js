const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user = 'user', url = 'url') {

        if (!(user === 'user')) {
            this.to = user.email;
            this.firstName = user.name.split(' ')[0];
            this.url = url;
            this.from = `Shivam Dhaka <${process.env.EMAIL_FROM}>`
        }
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                // service: 'Brevo',
                host: process.env.SENDINBLUE_HOST,
                port: process.env.SENDINBLUE_PORT,
                auth: {
                  user: process.env.SENDINBLUE_LOGIN,
                  pass: process.env.SENDINBLUE_PASSWORD,
                },
              });
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
            // Activate in gmail "less secure app" option
        });
    }

    async sendContact(name, email, message, subject) {
        // Define email options for the contact form email
        const mailOptions = {
            from: email,
            to: process.env.ADMIN_EMAIL_ADDRESS, // Replace with your email address
            subject: subject,
            text: `Name: ${name}\nSubject: ${subject}\nEmail: ${email}\nMessage: ${message}`
        };

        // Create a transport and send the contact form email
        await this.newTransport().sendMail(mailOptions);
    }

    async send(template, subject) {
        //render html for the email based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        //define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html),
        }

        //create a transport and send email.
        await this.newTransport().sendMail(mailOptions)

    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
    }
    
    async sendContactForm(name, email, message, subject) {
        await this.sendContact(name, email, message, subject);
    }
}

