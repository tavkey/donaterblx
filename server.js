const express = require('express');
const cors = require('cors');
const path = require('path');
const scanHandler = require('./api/scan');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Serverless handler wrapper for Express
app.get('/api/scan', (req, res) => {
  scanHandler(req, res);
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎮 Roblox Gamepass Scanner running at http://localhost:${PORT}`);
});
