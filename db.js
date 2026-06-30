const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = () => {
    return mongoose.connect(process.env.DB_CONNECTION_STRING)
        .then(() => console.log('MongoDB connected'))
        .catch(err => {
            console.error('MongoDB connection error:', err);
            throw err;
        });
}

module.exports = connectDB;