const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Please tell us your name!'],

    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email'],

    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    oauthUser: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false,

    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password!'],
        minlength: 8,
        validate: {
            // This only works on SAVE !!
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords do not match'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    }
});

userSchema.pre('save', function (next) {
    // if (req.user.oauthUser) return next();

    if (!this.isModified('password') || this.isNew) return next();
    const d = new Date();
    const t = -d.getTimezoneOffset();
    this.passwordChangedAt = Date.now() + t * 60 * 1000 - 1000;
    next();
});

userSchema.pre('save', async function (next) {
    // if (req.user.oauthUser) return next();
    
    if (!this.isModified('password')) return next();

    if (process.env.NODE_ENV === 'LOADER') {
        // console.log('Node env loader.....')
        this.isNew = true;
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre(/^find/, async function (next) {
    this.find({ active: { $ne: false } });
    next();
})

userSchema.methods.correctPassword = async function (candidatePassword, userPasswrod) {
    return await bcrypt.compare(candidatePassword, userPasswrod);
}

userSchema.methods.changedPasswordAfter =  function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = this.passwordChangedAt.getTime() ;
        
        const JWTTimestampMilliseconds = JWTTimestamp * 1000; // Convert to milliseconds

        // Create a new Date object representing the local time
        const localDate = new Date(JWTTimestampMilliseconds);

        // Get the local time in milliseconds
        const d = new Date();
        const t = -d.getTimezoneOffset();
        const localTimeMilliseconds = localDate.getTime()+(t * 60 * 1000);

        // console.log(new Date(changedTimeStamp), new Date(localTimeMilliseconds) );  
        return changedTimeStamp > localTimeMilliseconds;
    }
        
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const d = new Date();
    const t = -d.getTimezoneOffset() + 10;
    this.passwordResetExpires = Date.now() + t * 60 * 1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);
module.exports = User;