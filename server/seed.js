const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/musetype';

const lessonsToSeed = [
  {
    title: 'The Great Composer',
    text: 'music expresses that which cannot be put into words and that which cannot remain silent. the true beauty of a piano lies in its ability to translate human emotion into a physical vibration that echoes through the room and touches the soul of anyone who stops to listen.',
    difficulty: 'beginner',
    trackSequence: []
  },
  {
    title: 'Synthesizer Dreams',
    text: 'in the neon glow of the city lights the analog synthesizers hummed with a life of their own. arpeggiators cascaded down the octaves creating a digital waterfall of sound that washed over the crowd. every frequency was perfectly tuned to resonate with the heartbeat of the night.',
    difficulty: 'intermediate',
    trackSequence: []
  },
  {
    title: 'Classical Virtuoso',
    text: 'the swift graceful movements of your fingers across the keyboard bring the music to life. it takes years of dedicated practice to master the delicate balance between striking the keys with enough force to project the sound and maintaining the gentle touch required for emotional resonance. true artistry is found in the spaces between the notes.',
    difficulty: 'advanced',
    trackSequence: []
  },
  {
    title: 'Rhythmic Flow',
    text: 'typing is a lot like playing a percussion instrument. finding your rhythm and locking into the groove allows your hands to glide effortlessly across the keys. speed is merely a byproduct of consistency and muscle memory built over thousands of hours of repetitive motion.',
    difficulty: 'intermediate',
    trackSequence: []
  }
];

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Seeding...');
    await Lesson.deleteMany({}); // clear existing
    await Lesson.insertMany(lessonsToSeed);
    console.log('Successfully seeded database with lessons!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
