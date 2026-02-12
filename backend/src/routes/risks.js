const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const router = express.Router();

const PROBABILITY_VALUES = { very_low: 0.1, low: 0.3, medium: 0.5, high: 0.7, very_high: 0.9 };
const IMPACT_VALUES = { negligible: 0.1, minor: 0.3, moderate: 0.5, major: 0.7, critical: 0.9 };

function calculateRiskScore(probability, impact) {
  return (PROBABILITY_VALUES[probability] || 0.5) * (IMPACT_VALUES[impact] || 0.5);
}

// GET risks for a goal
router.get('/goal/:goalId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM risks WHERE goal_id = ? ORDER BY risk_score DESC',
      [req.params.goalId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET risk matrix data
router.get('/matrix/:goalId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM risks WHERE goal_id = ? AND status NOT IN ('resolved')",
      [req.params.goalId]
    );

    // Build 5x5 risk matrix
    const probabilities = ['very_low', 'low', 'medium', 'high', 'very_high'];
    const impacts = ['negligible', 'minor', 'moderate', 'major', 'critical'];
    const matrix = {};

    for (const p of probabilities) {
      matrix[p] = {};
      for (const i of impacts) {
        matrix[p][i] = rows.filter(r => r.probability === p && r.impact === i);
      }
    }

    res.json({ matrix, risks: rows, probabilities, impacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create risk
router.post('/', async (req, res) => {
  try {
    const id = uuidv4();
    const {
      goal_id, title, description, category, probability, impact,
      mitigation_plan, contingency_plan, trigger_conditions, owner
    } = req.body;

    const risk_score = calculateRiskScore(probability, impact);

    await pool.query(
      `INSERT INTO risks (id, goal_id, title, description, category, probability, impact,
        risk_score, mitigation_plan, contingency_plan, trigger_conditions, owner)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, goal_id, title, description, category || 'other', probability || 'medium',
       impact || 'moderate', risk_score, mitigation_plan, contingency_plan, trigger_conditions, owner]
    );

    const [rows] = await pool.query('SELECT * FROM risks WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update risk
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;

    // Recalculate risk score
    if (fields.probability || fields.impact) {
      const [current] = await pool.query('SELECT * FROM risks WHERE id = ?', [req.params.id]);
      if (current.length > 0) {
        const prob = fields.probability || current[0].probability;
        const imp = fields.impact || current[0].impact;
        fields.risk_score = calculateRiskScore(prob, imp);
      }
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
    await pool.query(`UPDATE risks SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM risks WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE risk
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM risks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
