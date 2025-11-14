// Lokale SQL Server API
// Installeer dependencies: npm install express mssql cors

const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/sql', async (req, res) => {
  const { server, database, username, password, query } = req.body;

  // Validatie
  if (!server || !database || !username || !query) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'Server, database, username en query zijn verplicht'
    });
  }

  // SQL Server configuratie
  const config = {
    user: username,
    password: password || '',
    server: server,
    database: database,
    options: {
      encrypt: true, // Gebruik true voor Azure
      trustServerCertificate: true // Verander naar false in productie
    }
  };

  try {
    // Verbind met SQL Server
    await sql.connect(config);
    
    // Voer query uit
    const result = await sql.query(query);
    
    // Sluit verbinding
    await sql.close();
    
    // Stuur resultaat terug
    res.json({
      success: true,
      data: result.recordset,
      rowCount: result.recordset.length
    });

  } catch (error) {
    console.error('SQL Server Error:', error);
    
    await sql.close();
    
    res.status(500).json({
      error: 'SQL Server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SQL Server API is running' });
});

app.listen(PORT, () => {
  console.log(`SQL Server API draait op http://localhost:${PORT}`);
  console.log(`Test de API: http://localhost:${PORT}/health`);
});
