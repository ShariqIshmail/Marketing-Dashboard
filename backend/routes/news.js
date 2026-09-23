const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// GET all news items
router.get('/', async (req, res) => {
  try {
    const { category, competitor_name, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM news_items WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = $' + (params.length + 1);
      params.push(category);
    }

    if (competitor_name) {
      query += ' AND competitor_name = $' + (params.length + 1);
      params.push(competitor_name);
    }

    query += ' ORDER BY found_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET news summary (latest trends)
router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        category,
        COUNT(*) as count,
        MAX(found_at) as latest
      FROM news_items
      WHERE found_at >= NOW() - INTERVAL '7 days'
      GROUP BY category
      ORDER BY latest DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE news item (typically called by agents)
router.post('/', async (req, res) => {
  try {
    const { title, summary, url, category, competitor_name, sentiment } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'title and category are required' });
    }

    const result = await pool.query(
      `INSERT INTO news_items (title, summary, url, category, competitor_name, sentiment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, summary || null, url || null, category, competitor_name || null, sentiment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE news item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM news_items WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'News item not found' });
    }

    res.json({ message: 'News item deleted', item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
