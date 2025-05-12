const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const Button = require('./models/Button');

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
mongoose
  .connect('mongodb://localhost/note-keeper', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const authenticate = async (req, res, next) => {
=======
// Initialize Firebase Admin SDK
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(require('./firebase-service-account.json')),
});

// MongoDB Schema
const buttonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  query: { type: String, required: true },
  category: String,
  isPinned: Boolean,
  isPrivate: Boolean,
  password: String,
  imageUrl: String,
  voiceUrl: String,
  userId: String,
  type: { type: String, default: 'text' },
});

const Button = mongoose.model('Button', buttonSchema);

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
>>>>>>> main
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

app.get('/buttons', authenticate, async (req, res) => {
  try {
    const buttons = await Button.find({
      $or: [{ isPrivate: false }, { userId: req.user.uid }],
    });
    res.json(buttons);
  } catch (error) {
    console.error('Error fetching buttons:', error.message);
    res.status(500).json({ message: 'Error fetching buttons' });
  }
});

app.post('/buttons', authenticate, async (req, res) => {
  try {
    const { name, query, category, isPinned, isPrivate, password, imageUrl, voiceUrl, type } = req.body;
    if (!name?.trim() || !query?.trim()) {
      return res.status(400).json({ message: 'Name and query are required' });
    }
    if (isPrivate && !password?.trim()) {
      return res.status(400).json({ message: 'Password is required for private notes' });
    }
    const button = new Button({
      name: name.trim(),
      query: query.trim(),
      category,
      isPinned,
      isPrivate,
      password: isPrivate ? password : '',
      imageUrl,
      voiceUrl,
      userId: req.user.uid,
      type: type || 'text',
    });
    await button.save();
    res.status(201).json(button);
  } catch (error) {
    console.error('Error creating button:', error.message);
    res.status(500).json({ message: 'Error creating button' });
  }
});

app.put('/buttons/:id', authenticate, async (req, res) => {
  try {
    const { name, query, category, isPinned, isPrivate, password, imageUrl, voiceUrl, type } = req.body;
    if (!name?.trim() || !query?.trim()) {
      return res.status(400).json({ message: 'Name and query are required' });
    }
    const button = await Button.findById(req.params.id);
    if (!button) return res.status(404).json({ message: 'Button not found' });
    if (button.userId !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    button.name = name.trim();
    button.query = query.trim();
    button.category = category;
    button.isPinned = isPinned;
    button.isPrivate = isPrivate;
    button.password = isPrivate ? password : '';
    button.imageUrl = imageUrl;
    button.voiceUrl = voiceUrl;
    button.type = type || 'text';
    await button.save();
    res.json(button);
  } catch (error) {
    console.error('Error updating button:', error.message);
    res.status(500).json({ message: 'Error updating button' });
  }
});

app.delete('/buttons/:id', authenticate, async (req, res) => {
  try {
    const button = await Button.findById(req.params.id);
    if (!button) {
      console.log(`Button not found for ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Button not found' });
    }
    if (button.userId !== req.user.uid) {
      console.log(`Unauthorized delete attempt by user ${req.user.uid} for button ${req.params.id}`);
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (button.isPrivate) {
      const { password } = req.body;
      if (!password) {
        console.log(`Password missing for private button delete: ${req.params.id}`);
        return res.status(400).json({ message: 'Password required for private note' });
      }
      if (button.password !== password) {
        console.log(`Incorrect password for private button delete: ${req.params.id}`);
        return res.status(403).json({ message: 'Incorrect password' });
      }
    }
    await button.deleteOne();
    console.log(`Button deleted: ${req.params.id}`);
    res.json({ message: 'Button deleted' });
  } catch (error) {
    console.error('Error deleting button:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

<<<<<<< HEAD
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
=======
// POST /buttons/:id/verify-password
app.post('/buttons/:id/verify-password', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid ObjectId format: ${id}`);
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    console.log(`Verifying password for button ID: ${id}, User: ${req.user.uid}`);
    const button = await Button.findById(id);
    if (!button) {
      console.log(`Button not found for ID: ${id}`);
      return res.status(404).json({ message: 'Note not found' });
    }
    if (!button.isPrivate) {
      console.log(`Button is not private: ${id}`);
      return res.status(400).json({ message: 'Note is not private' });
    }
    if (button.userId !== req.user.uid) {
      console.log(`Unauthorized access attempt by user ${req.user.uid} for button ${id}`);
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const verified = button.password === password;
    console.log(`Password verification result for button ${id}: ${verified}`);
    res.json({ verified });
  } catch (error) {
    console.error('Error verifying password:', error.message);
    res.status(500).json({ message: 'Error verifying password' });
  }
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
>>>>>>> main
