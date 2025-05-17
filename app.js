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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/todoapp')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
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
        const { username, password } = req.body;
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('register', { error: 'Username already exists' });
        }

        const user = new User({ username, password });
        await user.save();
        
        req.session.userId = user._id;
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { error: 'An error occurred during registration' });
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