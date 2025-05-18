require('dotenv').config();
const mongoose = require('mongoose');

async function verifyDatabase() {
    try {
        // Format the connection string to ensure todoapp database
        let uri = process.env.MONGODB_URI;
        
        // Remove any existing database name
        uri = uri.replace(/\/[^/?]+\?/, '/todoapp?');
        
        console.log('\nConnection URI (masked):');
        console.log(uri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://[username]:[password]@'));
        
        console.log('\nConnecting to MongoDB...');
        const connection = await mongoose.connect(uri, {
            dbName: 'todoapp',  // Force todoapp database
            serverSelectionTimeoutMS: 5000
        });

        const dbName = connection.connection.db.databaseName;
        console.log('\nConnected to database:', dbName);
        
        if (dbName !== 'todoapp') {
            console.error('WARNING: Connected to wrong database!');
            console.error('Expected: todoapp');
            console.error('Connected to:', dbName);
        }

        // List all collections
        const collections = await connection.connection.db.listCollections().toArray();
        console.log('\nCollections in database:');
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });

        // Get counts
        const db = connection.connection.db;
        const usersCount = await db.collection('users').countDocuments();
        const todosCount = await db.collection('todos').countDocuments();
        
        console.log('\nCollection counts:');
        console.log('- Users:', usersCount);
        console.log('- Todos:', todosCount);

    } catch (error) {
        console.error('\nError:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

verifyDatabase(); 