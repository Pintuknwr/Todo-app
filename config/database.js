const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            bufferCommands: false,
            dbName: 'todoapp',
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('✓ MongoDB is connected');
});

mongoose.connection.on('error', (err) => {
    console.error('! MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('! MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
    }
});

module.exports = connectDB; 