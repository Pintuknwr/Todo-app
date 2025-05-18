require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testDatabase() {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Successfully connected to MongoDB');
        console.log('Database name:', mongoose.connection.db.databaseName);
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        // Count existing users
        const userCount = await User.countDocuments();
        console.log('Current number of users:', userCount);
        
        // Try to create a test user
        const testUser = new User({
            username: 'testuser_' + Date.now(),
            password: 'testpassword123'
        });
        
        console.log('Attempting to save test user...');
        await testUser.save();
        console.log('Successfully created test user:', testUser._id);
        
        // Verify the user was saved
        const savedUser = await User.findById(testUser._id);
        console.log('Retrieved saved user:', {
            id: savedUser._id,
            username: savedUser.username,
            createdAt: savedUser.createdAt
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testDatabase(); 