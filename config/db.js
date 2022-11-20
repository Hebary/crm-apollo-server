const mongoose = require('mongoose');
require('dotenv').config({ path: 'variables.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO, {
            useNewUrlParser: true,
        });
        console.log('DB connection success!');
    } catch (error) {
        console.log('something went wrong');
        console.log(error);
        process.exit(1); // stop app
    }
}

module.exports = connectDB;