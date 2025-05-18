# Todo Application

A simple Todo application built with Node.js, Express, and MongoDB.

## Features

- User authentication (register/login)
- Create, read, update, and delete todos
- Priority levels for todos
- Due dates for tasks
- User-specific todo lists

## Tech Stack

- Node.js
- Express.js
- MongoDB (with Mongoose)
- EJS templating
- Express-session for authentication

## Prerequisites

- Node.js (v12 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm (Node Package Manager)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd TodoApp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
PORT=3000
```

Replace `your_mongodb_connection_string` with your MongoDB connection URI and `your_session_secret` with a secure random string.

## Development

To run the application in development mode with auto-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
TodoApp/
├── models/          # Database models
│   ├── Todo.js     # Todo model
│   └── User.js     # User model
├── views/          # EJS templates
│   ├── index.ejs   # Main todo list
│   ├── login.ejs   # Login form
│   └── register.ejs # Registration form
├── public/         # Static files
│   ├── css/       # Stylesheets
│   └── js/        # Client-side JavaScript
├── app.js         # Main application file
├── package.json   # Project dependencies
└── .env          # Environment variables
```

## API Routes

### Authentication
- `GET /login` - Login page
- `POST /login` - Login user
- `GET /register` - Registration page
- `POST /register` - Register new user
- `GET /logout` - Logout user

### Todo Operations
- `GET /` - View all todos
- `POST /add` - Add new todo
- `POST /toggle/:id` - Toggle todo completion
- `POST /delete/:id` - Delete todo

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `SESSION_SECRET`: Secret for session encryption
- `PORT`: Application port (defaults to 3000)

## Important Note

This application uses in-memory storage, which means todos will be reset when the server restarts. For a production environment, consider implementing a database solution. 