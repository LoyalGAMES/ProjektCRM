const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const router = express.Router();

// GET changes since last sync
router.get('/changes', async (req, res) => {
  try {
    const { device_id, since } = req.query;
    if (!device_id || !since) {
      return res.status(400).json({ error: 'device_id and since parameters required' });
    }

    const [changes] = await pool.query(
      'SELECT * FROM sync_log WHERE device_id != ? AND synced_at > ? ORDER BY synced_at ASC',
      [device_id, since]
    );

    res.json({ changes, server_time: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST push local changes
router.post('/push', async (req, res) => {
  try {
    const { device_id, changes } = req.body;

    for (const change of changes) {
      const id = uuidv4();
      await pool.query(
        'INSERT INTO sync_log (id, device_id, table_name, record_id, action, data) VALUES (?, ?, ?, ?, ?, ?)',
        [id, device_id, change.table_name, change.record_id, change.action, JSON.stringify(change.data)]
      );

      // Apply the change to the actual table
      if (change.action === 'create' || change.action === 'update') {
        const columns = Object.keys(change.data);
        const values = Object.values(change.data);
        const placeholders = columns.map(() => '?').join(', ');
        const updateClause = columns.map(c => `${c} = VALUES(${c})`).join(', ');

        await pool.query(
          `INSERT INTO ${change.table_name} (${columns.join(', ')}) VALUES (${placeholders})
           ON DUPLICATE KEY UPDATE ${updateClause}`,
          values
        );
      } else if (change.action === 'delete') {
        await pool.query(`DELETE FROM ${change.table_name} WHERE id = ?`, [change.record_id]);
      }
    }

    res.json({ success: true, synced: changes.length, server_time: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET full data dump (initial sync)
router.get('/full', async (req, res) => {
  try {
    const [goals] = await pool.query('SELECT * FROM goals');
    const [milestones] = await pool.query('SELECT * FROM milestones');
    const [tasks] = await pool.query('SELECT * FROM tasks');
    const [risks] = await pool.query('SELECT * FROM risks');
    const [progressLogs] = await pool.query('SELECT * FROM progress_logs ORDER BY date DESC LIMIT 500');
    const [notes] = await pool.query('SELECT * FROM goal_notes');

    res.json({
      goals, milestones, tasks, risks, progressLogs, notes,
      server_time: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
