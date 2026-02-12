const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const goalsRouter = require('./routes/goals');
const milestonesRouter = require('./routes/milestones');
const tasksRouter = require('./routes/tasks');
const risksRouter = require('./routes/risks');
const progressRouter = require('./routes/progress');
const syncRouter = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/goals', goalsRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/risks', risksRouter);
app.use('/api/progress', progressRouter);
app.use('/api/sync', syncRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Goal Tracker API running on port ${PORT}`);
  });
}

start();
