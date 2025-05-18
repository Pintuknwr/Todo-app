require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testConnection() {
    try {
        // Print the MongoDB URI (masked)
        const maskedUri = process.env.MONGODB_URI.replace(
            /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
            'mongodb+srv://[username]:[password]@'
        );
        console.log('MongoDB URI:', maskedUri);

        // Connect to MongoDB
        console.log('\nConnecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected successfully');
        
        // Print connection details
        console.log('\nConnection Details:');
        console.log('Database Name:', mongoose.connection.db.databaseName);
        console.log('Connection State:', mongoose.connection.readyState);
        
        // List collections
        console.log('\nCollections:');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(collections.map(c => c.name));
        
        // Create a test user
        console.log('\nCreating test user...');
        const testUser = new User({
            username: `test_user_${Date.now()}`,
            password: 'Test123456'
        });
        
        // Save the user
        const savedUser = await testUser.save();
        console.log('✓ Test user created successfully');
        console.log('User ID:', savedUser._id);
        
        // Verify the user exists
        const verifiedUser = await User.findById(savedUser._id);
        console.log('\nVerification:');
        console.log('User found in database:', !!verifiedUser);
        
        // Count total users
        const userCount = await User.countDocuments();
        console.log('\nTotal users in database:', userCount);
        
    } catch (error) {
        console.error('\nError occurred:');
        console.error('Name:', error.name);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testConnection(); 