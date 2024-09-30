const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define mongoose schema for user data
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    }, // Name of the user
    image: {
        type: String,
        required: true,
    }, // Reference to the GridFS file ID
    paragraph1: {
        type: String,
        required: true,
    }, // First text paragraph
    paragraph2: {
        type: String,
        required: true,
    } // Second text paragraph
});

// Create mongoose model for 'User'
const User = mongoose.model('User', userSchema);

module.exports = User;
