// Lokale SQL Server API - Secured Version
// Installeer dependencies: npm install express mssql cors express-rate-limit helmet dotenv

const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security: API Key from environment
const API_KEY = process.env.SQL_API_KEY;
if (!API_KEY) {
  console.error('FATAL: SQL_API_KEY environment variable is required');
  process.exit(1);
}

// Security: Database credentials from environment (never from client)
const DB_CONFIG = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: process.env.SQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQL_TRUST_CERT === 'true'
  }
};

// Validate required database config
if (!DB_CONFIG.server || !DB_CONFIG.database || !DB_CONFIG.user) {
  console.error('FATAL: Missing required database configuration in environment variables');
  console.error('Required: SQL_SERVER, SQL_DATABASE, SQL_USER, SQL_PASSWORD');
  process.exit(1);
}

// Security: Helmet for HTTP headers
app.use(helmet());

// Security: Rate limiting - max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests', message: 'Rate limit exceeded. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Security: Strict CORS - only allow specific origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Limit body size

// Security: API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'];
  if (!providedKey || providedKey !== API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or missing API key' 
    });
  }
  next();
};

// Predefined safe queries (whitelist approach)
const ALLOWED_QUERIES = {
  'orders': 'SELECT TOP 1000 * FROM Orders ORDER BY OrderDate DESC',
  'orders_by_date': 'SELECT TOP 1000 * FROM Orders WHERE OrderDate >= @startDate AND OrderDate <= @endDate ORDER BY OrderDate DESC',
  'customers': 'SELECT TOP 1000 CustomerID, CustomerName, ContactName, City, Country FROM Customers ORDER BY CustomerName',
  'products': 'SELECT TOP 1000 ProductID, ProductName, Category, Price FROM Products ORDER BY ProductName',
  'tables': "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
};

// Execute predefined query with optional parameters
app.post('/api/sql', authenticateApiKey, async (req, res) => {
  const { queryName, parameters } = req.body;

  // Validate query name
  if (!queryName || typeof queryName !== 'string') {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'queryName is required'
    });
  }

  // Security: Only allow whitelisted queries
  const queryTemplate = ALLOWED_QUERIES[queryName.toLowerCase()];
  if (!queryTemplate) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: `Unknown query: ${queryName}. Allowed queries: ${Object.keys(ALLOWED_QUERIES).join(', ')}`
    });
  }

  let pool;
  try {
    // Connect to SQL Server using server-side credentials
    pool = await sql.connect(DB_CONFIG);
    
    // Create request with parameterized inputs
    const request = pool.request();
    
    // Add parameters if provided (safe parameterized queries)
    if (parameters && typeof parameters === 'object') {
      for (const [key, value] of Object.entries(parameters)) {
        // Only allow specific parameter types
        if (typeof value === 'string') {
          request.input(key, sql.NVarChar(255), value);
        } else if (typeof value === 'number') {
          request.input(key, sql.Int, value);
        } else if (value instanceof Date) {
          request.input(key, sql.DateTime, value);
        }
      }
    }
    
    // Execute parameterized query
    const result = await request.query(queryTemplate);
    
    res.json({
      success: true,
      data: result.recordset,
      rowCount: result.recordset.length
    });

  } catch (error) {
    console.error('SQL Server Error:', error.message);
    
    // Security: Generic error message, no internal details
    res.status(500).json({
      error: 'Database error',
      message: 'An error occurred while executing the query'
    });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        console.error('Error closing connection:', e.message);
      }
    }
  }
});

// Get available query names
app.get('/api/sql/queries', authenticateApiKey, (req, res) => {
  res.json({
    success: true,
    queries: Object.keys(ALLOWED_QUERIES)
  });
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SQL Server API is running' });
});

// Error handler - no stack traces in production
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ 
    error: 'Server error', 
    message: 'An unexpected error occurred' 
  });
});

app.listen(PORT, () => {
  console.log(`SQL Server API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('Security features enabled: API Key auth, Rate limiting, CORS, Helmet');
});
