const mongoose = require('mongoose');

const buttonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  query: { type: String, required: true },
  category: { type: String, default: '' },
  isPinned: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  imageUrl: { type: String, default: '' },
  userId: { type: String, required: true },
});

buttonSchema.index({ userId: 1 });

module.exports = mongoose.model('Button', buttonSchema);