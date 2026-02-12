const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const router = express.Router();

// GET all goals
router.get('/', async (req, res) => {
  try {
    const { status, category, sort } = req.query;
    let query = 'SELECT * FROM goals WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const sortMap = {
      'deadline': 'target_date ASC',
      'priority': "FIELD(priority, 'critical', 'high', 'medium', 'low')",
      'progress': 'progress DESC',
      'created': 'created_at DESC',
    };
    query += ` ORDER BY ${sortMap[sort] || 'sort_order ASC, created_at DESC'}`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single goal with all relations
router.get('/:id', async (req, res) => {
  try {
    const [goals] = await pool.query('SELECT * FROM goals WHERE id = ?', [req.params.id]);
    if (goals.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goals[0];
    const [milestones] = await pool.query(
      'SELECT * FROM milestones WHERE goal_id = ? ORDER BY sort_order ASC', [goal.id]
    );
    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE goal_id = ? ORDER BY sort_order ASC', [goal.id]
    );
    const [risks] = await pool.query(
      'SELECT * FROM risks WHERE goal_id = ? ORDER BY risk_score DESC', [goal.id]
    );
    const [progressLogs] = await pool.query(
      'SELECT * FROM progress_logs WHERE goal_id = ? ORDER BY date DESC LIMIT 30', [goal.id]
    );
    const [subGoals] = await pool.query(
      'SELECT * FROM goals WHERE parent_goal_id = ? ORDER BY sort_order ASC', [goal.id]
    );

    res.json({
      ...goal,
      milestones,
      tasks,
      risks,
      progressLogs,
      subGoals,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create goal
router.post('/', async (req, res) => {
  try {
    const id = uuidv4();
    const {
      title, description, category, priority, status,
      smart_specific, smart_measurable, smart_achievable, smart_relevant, smart_time_bound,
      start_date, target_date, color, icon, parent_goal_id, sort_order
    } = req.body;

    // Calculate SMART score
    const smartFields = [smart_specific, smart_measurable, smart_achievable, smart_relevant, smart_time_bound];
    const filledCount = smartFields.filter(f => f && f.trim().length > 10).length;
    const smart_score = filledCount / 5;

    await pool.query(
      `INSERT INTO goals (id, title, description, category, priority, status,
        smart_specific, smart_measurable, smart_achievable, smart_relevant, smart_time_bound,
        smart_score, start_date, target_date, color, icon, parent_goal_id, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description, category || 'personal', priority || 'medium', status || 'draft',
       smart_specific, smart_measurable, smart_achievable, smart_relevant, smart_time_bound,
       smart_score, start_date, target_date, color || '#4A90D9', icon || 'target',
       parent_goal_id, sort_order || 0]
    );

    const [rows] = await pool.query('SELECT * FROM goals WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update goal
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    const updates = [];
    const values = [];

    // Recalculate SMART score if any SMART field changed
    if (['smart_specific', 'smart_measurable', 'smart_achievable', 'smart_relevant', 'smart_time_bound']
        .some(f => f in fields)) {
      const [current] = await pool.query('SELECT * FROM goals WHERE id = ?', [req.params.id]);
      if (current.length > 0) {
        const merged = { ...current[0], ...fields };
        const smartFields = [merged.smart_specific, merged.smart_measurable, merged.smart_achievable,
                            merged.smart_relevant, merged.smart_time_bound];
        const filledCount = smartFields.filter(f => f && f.trim().length > 10).length;
        fields.smart_score = filledCount / 5;
      }
    }

    for (const [key, value] of Object.entries(fields)) {
      if (key !== 'id' && key !== 'created_at') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE goals SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM goals WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE goal
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM goals WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET goal statistics / dashboard data
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalGoals] = await pool.query('SELECT COUNT(*) as count FROM goals');
    const [activeGoals] = await pool.query("SELECT COUNT(*) as count FROM goals WHERE status = 'active'");
    const [completedGoals] = await pool.query("SELECT COUNT(*) as count FROM goals WHERE status = 'completed'");
    const [avgProgress] = await pool.query("SELECT AVG(progress) as avg FROM goals WHERE status = 'active'");
    const [upcomingDeadlines] = await pool.query(
      "SELECT * FROM goals WHERE status = 'active' AND target_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) ORDER BY target_date ASC"
    );
    const [highRisks] = await pool.query(
      "SELECT r.*, g.title as goal_title FROM risks r JOIN goals g ON r.goal_id = g.id WHERE r.risk_score >= 0.6 AND r.status NOT IN ('resolved') ORDER BY r.risk_score DESC LIMIT 10"
    );

    res.json({
      total: totalGoals[0].count,
      active: activeGoals[0].count,
      completed: completedGoals[0].count,
      averageProgress: avgProgress[0].avg || 0,
      upcomingDeadlines,
      highRisks,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
