const pool = require('../config/db');

const getAllSoftwareCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM software_categories ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching software categories:', err);
    res.status(500).json({ error: err.message });
  }
};

const getSoftwareCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM software_categories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Software category not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching software category:', err);
    res.status(500).json({ error: err.message });
  }
};

const createSoftwareCategory = async (req, res) => {
  try {
    const { display_name, description, active } = req.body;
    const result = await pool.query(
      'INSERT INTO software_categories (display_name, description, active) VALUES ($1, $2, $3) RETURNING *',
      [display_name, description, active]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating software category:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateSoftwareCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, description, active } = req.body;
    const result = await pool.query(
      'UPDATE software_categories SET display_name = $1, description = $2, active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [display_name, description, active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Software category not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating software category:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteSoftwareCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM software_categories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Software category not found' });
    }
    res.json({ message: 'Software category deleted' });
  } catch (err) {
    console.error('Error deleting software category:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllSoftwareCategories,
  getSoftwareCategoryById,
  createSoftwareCategory,
  updateSoftwareCategory,
  deleteSoftwareCategory,
};
