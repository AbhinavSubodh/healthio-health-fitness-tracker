// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/wellness-hub', (req, res) => {
    res.sendFile(path.join(__dirname, 'wellness-hub.html'));
});

app.get('/fitness-zone', (req, res) => {
    res.sendFile(path.join(__dirname, 'fitness-zone.html'));
});

app.get('/sleep-cycle', (req, res) => {
    res.sendFile(path.join(__dirname, 'sleep-cycle.html'));
});

app.get('/gym-connect', (req, res) => {
    res.sendFile(path.join(__dirname, 'gym-connect.html'));
});

app.get('/consult-expert', (req, res) => {
    res.sendFile(path.join(__dirname, 'consult-expert.html'));
});

app.get('/nutrition-meter', (req, res) => {
    res.sendFile(path.join(__dirname, 'nutrition-meter.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;