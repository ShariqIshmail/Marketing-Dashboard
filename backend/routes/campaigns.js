const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// GET all campaigns
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM campaigns ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single campaign with metrics
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1',
      [id]
    );

    if (campaign.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const metrics = await pool.query(
      'SELECT * FROM ad_metrics WHERE campaign_id = $1 ORDER BY date DESC',
      [id]
    );

    const result = {
      ...campaign.rows[0],
      metrics: metrics.rows
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE campaign
router.post('/', async (req, res) => {
  try {
    const { name, platform, external_id, status, description } = req.body;

    if (!name || !platform) {
      return res.status(400).json({ error: 'name and platform are required' });
    }

    const result = await pool.query(
      'INSERT INTO campaigns (name, platform, external_id, status, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, platform, external_id || null, status || 'active', description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE campaign
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, platform, status, description } = req.body;

    const result = await pool.query(
      'UPDATE campaigns SET name = COALESCE($1, name), platform = COALESCE($2, platform), status = COALESCE($3, status), description = COALESCE($4, description), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, platform, status, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM campaigns WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted', campaign: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
