// models/Video.js
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true }
});

module.exports = mongoose.model('Video', videoSchema);
