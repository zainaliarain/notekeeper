const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');

  const app = express();
  app.use(cors());
  app.use(express.json());

  mongoose.connect('mongodb://localhost:27017/notekeeper', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const buttonSchema = new mongoose.Schema({
    name: String,
    query: String,
    category: String,
    isPinned: Boolean,
    isPrivate: Boolean,
    imageUrl: String,
    userId: String,
    password: String,
  });

  const Button = mongoose.model('Button', buttonSchema);

  const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send('Unauthorized');
    try {
      const decoded = jwt.verify(token, 'your_jwt_secret');
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).send('Invalid token');
    }
  };

  app.get('/buttons', verifyToken, async (req, res) => {
    try {
      const buttons = await Button.find({
        $or: [
          { isPrivate: false },
          { userId: req.user.uid },
        ],
      });
      res.json(buttons);
    } catch (error) {
      res.status(500).send('Server error');
    }
  });

  app.post('/buttons', verifyToken, async (req, res) => {
    try {
      const { name, query, category, isPinned, isPrivate, imageUrl, password } = req.body;
      let hashedPassword = '';
      if (isPrivate && password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      const button = new Button({
        name,
        query,
        category,
        isPinned,
        isPrivate,
        imageUrl,
        userId: req.user.uid,
        password: hashedPassword,
      });
      await button.save();
      res.json(button);
    } catch (error) {
      res.status(500).send('Server error');
    }
  });

  app.put('/buttons/:id', verifyToken, async (req, res) => {
    try {
      const { name, query, category, isPinned, isPrivate, imageUrl, password } = req.body;
      const button = await Button.findById(req.params.id);
      if (!button) return res.status(404).send('Note not found');
      if (button.userId !== req.user.uid) return res.status(403).send('Unauthorized');
      let hashedPassword = button.password;
      if (isPrivate && password) {
        hashedPassword = await bcrypt.hash(password, 10);
      } else if (!isPrivate) {
        hashedPassword = '';
      }
      button.name = name;
      button.query = query;
      button.category = category;
      button.isPinned = isPinned;
      button.isPrivate = isPrivate;
      button.imageUrl = imageUrl;
      button.password = hashedPassword;
      await button.save();
      res.json(button);
    } catch (error) {
      res.status(500).send('Server error');
    }
  });

  app.delete('/buttons/:id', verifyToken, async (req, res) => {
    try {
      const button = await Button.findById(req.params.id);
      if (!button) return res.status(404).send('Note not found');
      if (button.userId !== req.user.uid) return res.status(403).send('Unauthorized');
      await button.deleteOne();
      res.send('Note deleted');
    } catch (error) {
      res.status(500).send('Server error');
    }
  });

  app.listen(5000, () => console.log('Server running on port 5000'));