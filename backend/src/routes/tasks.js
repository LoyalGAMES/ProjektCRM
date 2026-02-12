const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const router = express.Router();

// GET tasks for a goal
router.get('/goal/:goalId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tasks WHERE goal_id = ? ORDER BY sort_order ASC',
      [req.params.goalId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const id = uuidv4();
    const { goal_id, milestone_id, title, description, priority, due_date, estimated_hours, sort_order } = req.body;

    await pool.query(
      `INSERT INTO tasks (id, goal_id, milestone_id, title, description, priority, due_date, estimated_hours, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, goal_id, milestone_id, title, description, priority || 'medium', due_date, estimated_hours, sort_order || 0]
    );

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    if (fields.status === 'done' && !fields.completed_date) {
      fields.completed_date = new Date().toISOString().split('T')[0];
    }

    const updates = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      if (key !== 'id' && key !== 'created_at') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    values.push(req.params.id);
    await pool.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
