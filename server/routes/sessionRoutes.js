const express = require('express');
const Session = require('../models/Session');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user's sessions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id })
      .populate('lessonId', 'title')
      .sort({ date: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save a new typing session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { lessonId, wpm, accuracy } = req.body;
    const session = new Session({
      userId: req.user.id,
      lessonId,
      wpm,
      accuracy
    });
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
