const express = require('express');
const Lesson = require('../models/Lesson');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all lessons
router.get('/', async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ createdAt: -1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single lesson
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a lesson (Admin only normally, but open for this demo)
router.post('/', async (req, res) => {
  try {
    const { title, text, trackSequence, difficulty } = req.body;
    const lesson = new Lesson({ title, text, trackSequence, difficulty });
    await lesson.save();
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
