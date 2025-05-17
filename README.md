# Todo App

A simple Todo application built with Express.js and EJS templating engine.

## Features

- Add new todos
- Mark todos as complete/incomplete
- Delete todos
- Clean and responsive UI

## Prerequisites

- Node.js installed on your system
- Vercel CLI (for deployment)

## Installation

1. Clone this repository or download the files
2. Open a terminal in the project directory
3. Install dependencies:
```bash
npm install
```

## Running the Application Locally

1. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

## Deploying to Vercel

1. Install Vercel CLI globally (if not already installed):
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy the application:
```bash
vercel
```

4. For subsequent deployments:
```bash
vercel --prod
```

## Usage

- To add a todo: Type your todo in the input field and click "Add Todo"
- To mark a todo as complete/incomplete: Click the "Complete"/"Undo" button
- To delete a todo: Click the "Delete" button

## Important Note

This application uses in-memory storage, which means todos will be reset when the server restarts. For a production environment, consider implementing a database solution. 