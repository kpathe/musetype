const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  wpm: { type: Number, required: true },
  accuracy: { type: Number, required: true }, // Percentage (0-100)
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
