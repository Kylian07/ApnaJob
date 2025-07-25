const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    }
});

module.exports = mongoose.model('User', userSchema);