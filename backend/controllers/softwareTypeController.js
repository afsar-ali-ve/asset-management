const pool = require('../config/db');

const getAllSoftwareTypes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM software_types ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching software types:', err);
    res.status(500).json({ error: err.message });
  }
};

const getSoftwareTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM software_types WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Software type not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching software type:', err);
    res.status(500).json({ error: err.message });
  }
};

const createSoftwareType = async (req, res) => {
  try {
    const { display_name, description, enable_compliance } = req.body;
    const result = await pool.query(
      'INSERT INTO software_types (display_name, description, enable_compliance) VALUES ($1, $2, $3) RETURNING *',
      [display_name, description, enable_compliance]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating software type:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateSoftwareType = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, description, enable_compliance } = req.body;
    const result = await pool.query(
      'UPDATE software_types SET display_name = $1, description = $2, enable_compliance = $3 WHERE id = $4 RETURNING *',
      [display_name, description, enable_compliance, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Software type not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating software type:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteSoftwareType = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM software_types WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Software type not found' });
    }
    res.json({ message: 'Software type deleted' });
  } catch (err) {
    console.error('Error deleting software type:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllSoftwareTypes,
  getSoftwareTypeById,
  createSoftwareType,
  updateSoftwareType,
  deleteSoftwareType,
};
