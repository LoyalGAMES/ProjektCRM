const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const router = express.Router();

// GET milestones for a goal
router.get('/goal/:goalId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM milestones WHERE goal_id = ? ORDER BY sort_order ASC',
      [req.params.goalId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create milestone
router.post('/', async (req, res) => {
  try {
    const id = uuidv4();
    const { goal_id, title, description, target_date, sort_order } = req.body;

    await pool.query(
      'INSERT INTO milestones (id, goal_id, title, description, target_date, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [id, goal_id, title, description, target_date, sort_order || 0]
    );

    const [rows] = await pool.query('SELECT * FROM milestones WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update milestone
router.put('/:id', async (req, res) => {
  try {
    const { title, description, target_date, is_completed, sort_order } = req.body;
    const completed_date = req.body.is_completed ? new Date().toISOString().split('T')[0] : null;

    await pool.query(
      'UPDATE milestones SET title = COALESCE(?, title), description = COALESCE(?, description), target_date = COALESCE(?, target_date), is_completed = COALESCE(?, is_completed), completed_date = ?, sort_order = COALESCE(?, sort_order) WHERE id = ?',
      [title, description, target_date, is_completed, completed_date, sort_order, req.params.id]
    );

    // Update goal progress based on milestones
    const [milestone] = await pool.query('SELECT goal_id FROM milestones WHERE id = ?', [req.params.id]);
    if (milestone.length > 0) {
      const [stats] = await pool.query(
        'SELECT COUNT(*) as total, SUM(is_completed) as completed FROM milestones WHERE goal_id = ?',
        [milestone[0].goal_id]
      );
      if (stats[0].total > 0) {
        const progress = (stats[0].completed / stats[0].total) * 100;
        await pool.query('UPDATE goals SET progress = ? WHERE id = ?', [progress, milestone[0].goal_id]);
      }
    }

    const [rows] = await pool.query('SELECT * FROM milestones WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE milestone
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM milestones WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
