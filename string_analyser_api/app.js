const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const stringsRouter = require('./routes/strings');

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// HTTP request logger
app.use(morgan('dev'));

// Mount the strings router at /strings
app.use('/strings', stringsRouter);

// Root route - API welcome message
app.get('/', (req, res) => {
  res.json({
    message: 'String Analyzer API',
    version: '1.0.0',
    endpoints: {
      'POST /strings': 'Create and analyze a new string',
      'GET /strings/:string_value': 'Get a specific string',
      'GET /strings': 'Get all strings (supports filtering)',
      'GET /strings/filter-by-natural-language': 'Filter using natural language',
      'DELETE /strings/:string_value': 'Delete a string'
    }
  });
});

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler - must be last
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;