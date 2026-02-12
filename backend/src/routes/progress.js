const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const router = express.Router();

// GET progress logs for a goal
router.get('/goal/:goalId', async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const [rows] = await pool.query(
      'SELECT * FROM progress_logs WHERE goal_id = ? ORDER BY date DESC LIMIT ?',
      [req.params.goalId, parseInt(limit)]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add progress entry
router.post('/', async (req, res) => {
  try {
    const id = uuidv4();
    const { goal_id, date, progress_value, notes, mood, hours_spent, obstacles, achievements } = req.body;
    const entryDate = date || new Date().toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO progress_logs (id, goal_id, date, progress_value, notes, mood, hours_spent, obstacles, achievements)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, goal_id, entryDate, progress_value, notes, mood || 'neutral', hours_spent || 0, obstacles, achievements]
    );

    // Update goal progress
    if (progress_value !== undefined) {
      await pool.query('UPDATE goals SET progress = ? WHERE id = ?', [progress_value, goal_id]);
    }

    const [rows] = await pool.query('SELECT * FROM progress_logs WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
