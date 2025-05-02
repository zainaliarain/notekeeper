const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const Button = require('./models/Button');

// Initialize Firebase Admin SDK with service account
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors({ origin: ['http://localhost:5173'] }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/note-keeper', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware to authenticate Firebase tokens
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all accessible buttons (user's or public)
app.get('/buttons', authenticate, async (req, res) => {
  try {
    const buttons = await Button.find({
      $or: [{ userId: req.user.uid }, { isPrivate: false }],
    });
    res.json(buttons);
  } catch (error) {
    console.error('Error fetching buttons:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new button
app.post('/buttons', authenticate, async (req, res) => {
  try {
    const { name, query, category, isPinned, isPrivate, imageUrl } = req.body;
    const button = new Button({
      name,
      query,
      category,
      isPinned: isPinned || false,
      isPrivate: isPrivate || false,
      imageUrl: imageUrl || '',
      userId: req.user.uid,
    });
    await button.save();
    res.json(button);
  } catch (error) {
    console.error('Error saving button:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update an existing button
app.put('/buttons/:id', authenticate, async (req, res) => {
  try {
    const { name, query, category, isPinned, isPrivate, imageUrl } = req.body;
    const button = await Button.findOne({ _id: req.params.id, userId: req.user.uid });
    if (!button) return res.status(403).json({ error: 'Unauthorized or button not found' });

    button.name = name;
    button.query = query;
    button.category = category;
    button.isPinned = isPinned || false;
    button.isPrivate = isPrivate || false;
    button.imageUrl = imageUrl || '';
    await button.save();
    res.json(button);
  } catch (error) {
    console.error('Error updating button:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a button
app.delete('/buttons/:id', authenticate, async (req, res) => {
  try {
    const button = await Button.findOneAndDelete({ _id: req.params.id, userId: req.user.uid });
    if (!button) return res.status(403).json({ error: 'Unauthorized or button not found' });
    res.json({ message: 'Button deleted' });
  } catch (error) {
    console.error('Error deleting button:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));