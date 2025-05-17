const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Store todos in memory (in a real app, you'd use a database)
let todos = [];

// Routes
app.get('/', (req, res) => {
    res.render('index', { todos });
});

app.post('/add', (req, res) => {
    const todo = {
        id: Date.now(),
        text: req.body.todo,
        completed: false
    };
    todos.push(todo);
    res.redirect('/');
});

app.post('/toggle/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
    }
    res.redirect('/');
});

app.post('/delete/:id', (req, res) => {
    const id = parseInt(req.params.id);
    todos = todos.filter(t => t.id !== id);
    res.redirect('/');
});

// Export the app for Vercel
module.exports = app;

// Only listen directly if not running on Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Todo app listening at http://localhost:${port}`);
    });
} 