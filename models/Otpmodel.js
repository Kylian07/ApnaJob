const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
        name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true, 
        unique: true
    },
    email: {
        type: String,
        required: true, 
        lowercase: true, 
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['recruiter', 'employer'], required: true
    },
    otp: { 
        type: Number, 
        required: true 
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5
    }
});

module.exports = mongoose.model('Otp', otpSchema);


