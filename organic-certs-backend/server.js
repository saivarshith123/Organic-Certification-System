const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// --- Database Connection Configuration ---
const db = mysql.createPool({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: 'sai123', // Replace with your MySQL password
  database: 'organic_certs'
});

async function testDbConnection() {
  try {
    await db.getConnection();
    console.log('Successfully connected to the MySQL database.');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}
testDbConnection();

// --- API Endpoints ---

// NEW: Endpoint for user registration (without hashing)
app.post('/api/register', async (req, res) => {
  const { username, password, userType } = req.body;
  try {
    const [rows] = await db.query('SELECT username FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    // Save plain text password directly
    await db.query('INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)', [username, password, userType]);

    console.log(`New user registered: ${username} (${userType})`);
    res.status(200).json({ message: 'User registered successfully.' });

  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// NEW: Endpoint for user login (without hashing)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = rows[0];

    // Compare plain text passwords
    if (password === user.password) {
      console.log(`User logged in: ${username}`);
      res.status(200).json({ message: 'Login successful.', userType: user.user_type, username: user.username });
    } else {
      res.status(401).json({ message: 'Invalid credentials.' });
    }

  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ message: 'Login failed.' });
  }
});

// --- Other Endpoints (Placeholders) ---
app.post('/api/products', (req, res) => {
  // ... Blockchain logic placeholder ...
  res.status(200).json({ message: 'Product creation request received.', productId: `PROD-${Date.now()}` });
});

app.get('/api/uncertified-products', (req, res) => {
  // ... Blockchain logic placeholder ...
  res.status(200).json([]);
});

app.post('/api/certify', (req, res) => {
  // ... Blockchain logic placeholder ...
  res.status(200).json({ message: 'Product certified successfully.' });
});

app.get('/api/products/:id', (req, res) => {
  // ... Blockchain logic placeholder ...
  res.status(404).json({ message: 'Product not found.' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
