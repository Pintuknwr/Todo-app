require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testRegistration() {
    try {
        console.log('=== Testing User Registration ===\n');
        
        // Connect to database
        console.log('Connecting to MongoDB...');
        let uri = process.env.MONGODB_URI;
        uri = uri.replace(/\/[^/?]+\?/, '/todoapp?');
        
        await mongoose.connect(uri, {
            dbName: 'todoapp'
        });
        
        console.log('Connected to database:', mongoose.connection.db.databaseName);
        
        // Create test user
        const testUsername = `test_user_${Date.now()}`;
        console.log('\nCreating test user:', testUsername);
        
        const user = new User({
            username: testUsername,
            password: 'Test123456'
        });
        
        // Test validation
        console.log('\nValidating user...');
        const validationError = user.validateSync();
        if (validationError) {
            console.error('Validation failed:', validationError.message);
            return;
        }
        console.log('Validation passed');
        
        // Save user
        console.log('\nSaving user...');
        const savedUser = await user.save();
        console.log('User saved successfully:', {
            id: savedUser._id,
            username: savedUser.username,
            created: savedUser.createdAt
        });
        
        // Verify password hashing
        console.log('\nVerifying password hashing...');
        console.log('Password is hashed:', savedUser.password !== 'Test123456');
        
        // Test password comparison
        console.log('\nTesting password comparison...');
        const isMatch = await savedUser.comparePassword('Test123456');
        console.log('Password comparison:', isMatch ? 'Success' : 'Failed');
        
        // Verify in database
        console.log('\nVerifying user in database...');
        const foundUser = await User.findById(savedUser._id);
        console.log('User found in database:', !!foundUser);
        
        // Count users
        const userCount = await User.countDocuments();
        console.log('\nTotal users in database:', userCount);
        
    } catch (error) {
        console.error('\nError:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testRegistration(); 