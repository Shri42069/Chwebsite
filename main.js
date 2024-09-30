require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
mongoose.connect(process.env.DB_URI)
    .then(() => console.log('Database connected successfully'))
    .catch((error) => {
        console.error('Database connection error:', error);
        process.exit(1);  // Exit the process if database connection fails
    });

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET || "my secret key",
        saveUninitialized: true,
        resave: false,
    })
);

// Static files middleware
app.use(express.static(path.join(__dirname, 'uploads')));
app.use('/views/layout/css', express.static(path.join(__dirname, 'views/layout/css')));
app.use('/views/layout/js', express.static(path.join(__dirname, 'views/layout/js')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Message handling middleware
app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

app.use((req, res, next) => {
    console.log(`Request for ${req.url}`);
    next();
});

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Route prefix
const router = require('./routes/route');
app.use('/', router);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});