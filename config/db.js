const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // The process.env.MONGO_URI pulls the string you saved earlier
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;