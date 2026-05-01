const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  trackSequence: { type: [String], required: true }, // Array of notes e.g. ["C4", "E4", "G4"]
  difficulty: { type: String, default: 'beginner' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lesson', lessonSchema);
