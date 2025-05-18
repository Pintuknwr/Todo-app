const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Todo = require('./models/Todo');

const app = express();

// MongoDB Connection Configuration
const isDev = process.env.NODE_ENV !== 'production';

// Enable mongoose debug mode in development
if (isDev) {
    mongoose.set('debug', true);
}

// Prevent multiple connections in serverless environment
let cachedConnection = null;

async function connectToDatabase() {
    if (cachedConnection) {
        console.log('Using cached database connection');
        return cachedConnection;
    }

    console.log('Establishing new database connection');
    try {
        // Ensure we're connecting to the todoapp database
        let uri = process.env.MONGODB_URI;
        if (!uri.includes('/todoapp?')) {
            uri = uri.replace('/?', '/todoapp?');
        }
        
        const connection = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            maxIdleTimeMS: 10000,
            connectTimeoutMS: 10000,
            dbName: 'todoapp' // Explicitly set database name
        });
        
        console.log(`✓ Connected to MongoDB (${isDev ? 'Development' : 'Production'})`);
        console.log('Database name:', connection.connection.db.databaseName);
        
        cachedConnection = connection;
        return connection;
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        throw error;
    }
}

// Connect to database before handling requests
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('Database connection middleware error:', error);
        res.status(500).send('Database connection error');
    }
});

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        sameSite: 'lax',
        httpOnly: true
    },
    name: 'sessionId' // Change default session cookie name
}));

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Auth routes
app.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user || !(await user.comparePassword(password))) {
            return res.render('login', { error: 'Invalid username or password' });
        }

        req.session.userId = user._id;
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred during login' });
    }
});

app.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt started');
        const { username, password } = req.body;
        
        // Log request body (excluding password)
        console.log('Registration request:', { 
            username,
            hasPassword: !!password,
            bodyKeys: Object.keys(req.body)
        });

        // Input validation
        if (!username || !password) {
            console.error('Missing required fields');
            return res.render('register', { error: 'Username and password are required' });
        }

        // Check database connection
        const dbState = mongoose.connection.readyState;
        console.log('Database connection state:', dbState);
        
        if (dbState !== 1) {
            console.error('Database not connected. Current state:', dbState);
            return res.render('register', { error: 'Database connection error. Please try again.' });
        }

        try {
            // Check for existing user
            console.log('Checking for existing user:', username);
            const existingUser = await User.findOne({ username }).exec();
            
            if (existingUser) {
                console.log('Username already exists');
                return res.render('register', { error: 'Username already exists' });
            }

            // Create and validate user
            console.log('Creating new user object');
            const user = new User({ username, password });
            
            // Manual validation
            const validationError = user.validateSync();
            if (validationError) {
                console.error('Validation error:', validationError.message);
                return res.render('register', { error: validationError.message });
            }

            // Save user
            console.log('Attempting to save user');
            const savedUser = await user.save();
            console.log('User saved successfully:', {
                id: savedUser._id,
                username: savedUser.username
            });

            // Verify save
            console.log('Verifying user save');
            const verifiedUser = await User.findById(savedUser._id).exec();
            
            if (!verifiedUser) {
                throw new Error('User save verification failed');
            }
            
            console.log('User verified in database');

            // Set session
            req.session.userId = savedUser._id;
            req.session.username = savedUser.username;
            
            // Save session explicitly
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            console.log('Session saved successfully');
            return res.redirect('/');
            
        } catch (dbError) {
            console.error('Database operation error:', dbError);
            throw dbError;
        }
    } catch (error) {
        console.error('Registration error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        let errorMessage = 'An error occurred during registration.';
        
        if (error.name === 'ValidationError') {
            errorMessage = 'Invalid input: ' + Object.values(error.errors).map(e => e.message).join(', ');
        } else if (error.code === 11000) {
            errorMessage = 'Username already exists';
        } else if (error.message.includes('Database connection')) {
            errorMessage = 'Database connection error. Please try again.';
        }

        return res.render('register', { error: errorMessage });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Protected routes
app.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const todos = await Todo.find({ userId: req.session.userId })
            .sort({ dueDate: 1, priority: -1 });
        
        res.render('index', { 
            todos,
            username: user.username
        });
    } catch (error) {
        console.error('Error rendering index:', error);
        res.status(500).send('Error rendering page');
    }
});

app.post('/add', isAuthenticated, async (req, res) => {
    try {
        const { todo, dueDate, priority } = req.body;
        const newTodo = new Todo({
            text: todo,
            dueDate: new Date(dueDate),
            priority,
            userId: req.session.userId
        });
        await newTodo.save();
        res.redirect('/');
    } catch (error) {
        console.error('Error adding todo:', error);
        res.status(500).send('Error adding todo');
    }
});

app.post('/toggle/:id', isAuthenticated, async (req, res) => {
    try {
        const todo = await Todo.findOne({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });
        
        if (todo) {
            todo.completed = !todo.completed;
            await todo.save();
        }
        res.redirect('/');
    } catch (error) {
        console.error('Error toggling todo:', error);
        res.status(500).send('Error updating todo');
    }
});

app.post('/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await Todo.deleteOne({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });
        res.redirect('/');
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).send('Error deleting todo');
    }
});

// Add this route before the error handling middleware
app.get('/test-db', async (req, res) => {
    try {
        // Check database connection
        const dbState = mongoose.connection.readyState;
        const dbName = mongoose.connection.db.databaseName;
        
        // Count users
        const userCount = await User.countDocuments();
        
        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        res.json({
            connected: dbState === 1,
            databaseName: dbName,
            userCount: userCount,
            collections: collections.map(c => c.name),
            mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Add this route before error handling middleware
app.get('/test-db-write', async (req, res) => {
    try {
        // Check connection state
        console.log('Database connection state:', mongoose.connection.readyState);
        
        // Try to write a test user
        const testUser = new User({
            username: `test_${Date.now()}`,
            password: 'testpassword123'
        });
        
        console.log('Attempting to save test user');
        const savedUser = await testUser.save();
        
        // Try to read it back
        const verifiedUser = await User.findById(savedUser._id);
        
        res.json({
            success: true,
            connectionState: mongoose.connection.readyState,
            databaseName: mongoose.connection.db.databaseName,
            savedUser: {
                id: savedUser._id,
                username: savedUser.username,
                created: savedUser.createdAt
            },
            verified: !!verifiedUser,
            totalUsers: await User.countDocuments()
        });
    } catch (error) {
        console.error('Test DB write error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            connectionState: mongoose.connection.readyState,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).render('error', { 
        error: process.env.NODE_ENV === 'production' 
            ? 'An error occurred' 
            : err.message 
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).render('error', { error: 'Page not found' });
});

// Export the app
module.exports = app;

// Start the server if running locally
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Todo app listening at http://localhost:${port}`);
    });
} 