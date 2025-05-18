require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Set production environment
process.env.NODE_ENV = 'production';

async function testProductionConnection() {
    try {
        // Ensure we're using the todoapp database
        let uri = process.env.MONGODB_URI;
        if (!uri.includes('/todoapp?')) {
            uri = uri.replace('/?', '/todoapp?');
        }

        console.log('Testing production configuration...');
        console.log('Environment:', process.env.NODE_ENV);
        console.log('MongoDB URI (masked):', uri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://[username]:[password]@'));

        // Connect with production settings
        await mongoose.connect(uri, {
            dbName: 'todoapp',
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10
        });

        console.log('\nConnection successful!');
        console.log('Connected to database:', mongoose.connection.db.databaseName);
        
        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nCollections:', collections.map(c => c.name));

        // Count existing users
        const userCount = await User.countDocuments();
        console.log('Current user count:', userCount);

        // Create test user
        const testUser = new User({
            username: `prod_test_${Date.now()}`,
            password: 'ProdTest123!'
        });

        const savedUser = await testUser.save();
        console.log('\nTest user created successfully:', {
            id: savedUser._id,
            username: savedUser.username
        });

        // Verify user was saved
        const verifiedUser = await User.findById(savedUser._id);
        console.log('User verification:', verifiedUser ? 'Success' : 'Failed');

        // Updated user count
        const newUserCount = await User.countDocuments();
        console.log('New user count:', newUserCount);

    } catch (error) {
        console.error('\nError occurred:');
        console.error('Name:', error.name);
        console.error('Message:', error.message);
        if (error.codeName) console.error('Code Name:', error.codeName);
        console.error('\nStack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testProductionConnection(); 