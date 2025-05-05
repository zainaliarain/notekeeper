const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const firebaseAdmin = require('firebase-admin');
const net = require('net');

const app = express();
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request headers:', { Authorization: req.headers.authorization || 'None' });
  next();
});

// Initialize Firebase Admin SDK
try {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(require('./serviceAccountKey.json')),
  });
  console.log('Firebase Admin SDK initialized');
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error.message);
  process.exit(1);
}

// MongoDB Schema
const buttonSchema = new mongoose.Schema({
  name: String,
  query: String,
  category: String,
  isPinned: Boolean,
  isPrivate: Boolean,
  password: String,
  imageUrl: String,
  userId: String,
});

const Button = mongoose.model('Button', buttonSchema);

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  console.log('verifyToken: Raw Authorization header:', req.headers.authorization);
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    console.log('verifyToken: No token provided in request');
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = decoded;
    console.log(`verifyToken: Token verified for user: ${req.user.uid}`);
    next();
  } catch (error) {
    console.error('verifyToken: Token verification error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/note-keeper', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error.message);
  process.exit(1);
});

// Test route
app.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.json({ message: 'Server is running' });
});

// Diagnostic route to list all registered routes
app.get('/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(method => method.toUpperCase());
      routes.push({ path: middleware.route.path, methods });
    }
  });
  console.log('Listing registered routes:', routes);
  res.json({ routes });
});

// Log route registration
console.log('Registering routes...');

// GET /buttons
app.get('/buttons', verifyToken, async (req, res) => {
  try {
    console.log(`Fetching buttons for user: ${req.user.uid}`);
    const buttons = await Button.find({
      $or: [{ isPrivate: false }, { userId: req.user.uid }],
    });
    console.log(`Found ${buttons.length} buttons:`, buttons.map(b => ({ id: b._id, name: b.name })));
    res.json(buttons);
  } catch (error) {
    console.error('Error fetching buttons:', error.message);
    res.status(500).json({ error: 'Error fetching buttons' });
  }
});
console.log('Registered GET /buttons');

// POST /buttons
app.post('/buttons', verifyToken, async (req, res) => {
  try {
    const { name, query, category, isPinned, isPrivate, password, imageUrl } = req.body;
    console.log(`Creating button for user: ${req.user.uid}, isPrivate: ${isPrivate}`);
    if (!name || !query) {
      console.log('Missing name or query in request body');
      return res.status(400).json({ error: 'Name and query are required' });
    }
    if (isPrivate && !password) {
      console.log('Missing password for private note');
      return res.status(400).json({ error: 'Password is required for private notes' });
    }
    const button = new Button({
      name,
      query,
      category,
      isPinned,
      isPrivate,
      password: isPrivate ? password : '',
      imageUrl,
      userId: req.user.uid,
    });
    await button.save();
    console.log(`Button created with ID: ${button._id}`);
    res.status(201).json(button);
  } catch (error) {
    console.error('Error creating button:', error.message);
    res.status(500).json({ error: 'Error creating button' });
  }
});
console.log('Registered POST /buttons');

// PUT /buttons/:id
app.put('/buttons/:id', verifyToken, async (req, res) => {
  try {
    const { name, query, category, isPinned, isPrivate, password, imageUrl } = req.body;
    console.log(`Updating button ID: ${req.params.id} for user: ${req.user.uid}`);
    const button = await Button.findById(req.params.id);
    if (!button) {
      console.log(`Button not found for ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Button not found' });
    }
    if (button.userId !== req.user.uid) {
      console.log(`Unauthorized update attempt by user ${req.user.uid} for button ${req.params.id}`);
      return res.status(403).json({ error: 'Unauthorized' });
    }
    button.name = name;
    button.query = query;
    button.category = category;
    button.isPinned = isPinned;
    button.isPrivate = isPrivate;
    button.password = isPrivate ? password : '';
    button.imageUrl = imageUrl;
    await button.save();
    console.log(`Button updated: ${req.params.id}`);
    res.json(button);
  } catch (error) {
    console.error('Error updating button:', error.message);
    res.status(500).json({ error: 'Error updating button' });
  }
});
console.log('Registered PUT /buttons/:id');

// DELETE /buttons/:id
app.delete('/buttons/:id', verifyToken, async (req, res) => {
  try {
    console.log(`Deleting button ID: ${req.params.id} for user: ${req.user.uid}`);
    const button = await Button.findById(req.params.id);
    if (!button) {
      console.log(`Button not found for ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Button not found' });
    }
    if (button.userId !== req.user.uid) {
      console.log(`Unauthorized delete attempt by user ${req.user.uid} for button ${req.params.id}`);
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (button.isPrivate) {
      const { password } = req.body;
      if (!password) {
        console.log(`Password missing for private button delete: ${req.params.id}`);
        return res.status(400).json({ error: 'Password required for private note' });
      }
      if (button.password !== password) {
        console.log(`Incorrect password for private button delete: ${req.params.id}`);
        return res.status(403).json({ error: 'Incorrect password' });
      }
    }
    await button.deleteOne();
    console.log(`Button deleted: ${req.params.id}`);
    res.json({ message: 'Button deleted' });
  } catch (error) {
    console.error('Error deleting button:', error.message);
    res.status(500).json({ error: 'Error deleting button' });
  }
});
console.log('Registered DELETE /buttons/:id');

// POST /buttons/:id/verify-password
app.post('/buttons/:id/verify-password', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    console.log(`Verifying password for button ID: ${req.params.id}, user: ${req.user.uid}`);
    const button = await Button.findById(req.params.id);
    if (!button) {
      console.log(`Button not found for ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Button not found' });
    }
    console.log(`Button found: isPrivate: ${button.isPrivate}, userId: ${button.userId}`);
    if (!button.isPrivate) {
      console.log(`Button is not private: ${req.params.id}`);
      return res.status(400).json({ error: 'Note is not private' });
    }
    if (button.userId !== req.user.uid) {
      console.log(`Unauthorized access attempt by user ${req.user.uid} for button ${req.params.id}`);
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const verified = button.password === password;
    console.log(`Password verification result for button ${req.params.id}: ${verified}`);
    res.json({ verified });
  } catch (error) {
    console.error('Error verifying password:', error.message);
    res.status(500).json({ error: 'Error verifying password' });
  }
});
console.log('Registered POST /buttons/:id/verify-password');

// Catch-all route for API routes to ensure JSON response
app.use((req, res) => {
  console.log(`Unrecognized route: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});
console.log('Registered catch-all route');

// Check if port 5000 is available
const checkPort = (port, callback) => {
  const server = net.createServer();
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
      process.exit(1);
    }
  });
  server.once('listening', () => {
    server.close();
    callback();
  });
  server.listen(port);
};

// Start server
checkPort(5000, () => {
  app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
  });
});