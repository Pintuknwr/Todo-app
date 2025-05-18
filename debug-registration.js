require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function debugRegistration() {
    try {
        console.log('=== Debug Registration Process ===\n');

        // 1. Test Database Connection
        console.log('1. Testing Database Connection...');
        let uri = process.env.MONGODB_URI;
        console.log('MongoDB URI (masked):', 
            uri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://[username]:[password]@'));

        // Ensure todoapp database
        uri = uri.replace(/\/[^/?]+\?/, '/todoapp?');
        
        await mongoose.connect(uri, {
            dbName: 'todoapp',
            serverSelectionTimeoutMS: 5000
        });

        console.log('✓ Connected to database:', mongoose.connection.db.databaseName);
        
        // 2. Check Collections
        console.log('\n2. Checking Collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));

        // 3. Test User Schema
        console.log('\n3. Testing User Schema...');
        const testUser = new User({
            username: `debug_user_${Date.now()}`,
            password: 'Debug123!'
        });

        const validationError = testUser.validateSync();
        if (validationError) {
            console.error('Schema validation failed:', validationError);
        } else {
            console.log('✓ Schema validation passed');
        }

        // 4. Test Password Hashing
        console.log('\n4. Testing Password Hashing...');
        const originalPassword = 'Debug123!';
        const hashedPassword = await bcrypt.hash(originalPassword, 10);
        const passwordMatch = await bcrypt.compare(originalPassword, hashedPassword);
        console.log('Password hashing working:', passwordMatch ? '✓ Yes' : '× No');

        // 5. Test User Creation
        console.log('\n5. Testing User Creation...');
        try {
            const savedUser = await testUser.save();
            console.log('✓ User saved successfully:', {
                id: savedUser._id,
                username: savedUser.username,
                hashedPassword: !!savedUser.password
            });

            // 6. Verify User in Database
            console.log('\n6. Verifying User in Database...');
            const foundUser = await User.findById(savedUser._id);
            if (foundUser) {
                console.log('✓ User found in database');
                console.log('User details:', {
                    id: foundUser._id,
                    username: foundUser.username,
                    created: foundUser.createdAt
                });
            } else {
                console.error('× User not found in database after save');
            }

            // 7. Test Password Verification
            console.log('\n7. Testing Password Verification...');
            const passwordVerification = await foundUser.comparePassword('Debug123!');
            console.log('Password verification:', passwordVerification ? '✓ Success' : '× Failed');

            // 8. Database Stats
            console.log('\n8. Database Statistics:');
            const userCount = await User.countDocuments();
            console.log('Total users in database:', userCount);

            // 9. Clean up test user
            console.log('\n9. Cleaning up test user...');
            await User.deleteOne({ _id: savedUser._id });
            console.log('✓ Test user removed');

        } catch (saveError) {
            console.error('Error during user creation:', saveError);
            console.error('Error details:', {
                name: saveError.name,
                code: saveError.code,
                message: saveError.message
            });
        }

    } catch (error) {
        console.error('\nMain Error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

debugRegistration(); 