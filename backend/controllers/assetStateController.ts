const pool = require('../config/db');

const getAllAssetStates = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM asset_states ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching asset states:', err);
    res.status(500).json({ error: err.message });
  }
};

const getAssetStateById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM asset_states WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset state not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching asset state:', err);
    res.status(500).json({ error: err.message });
  }
};

const createAssetState = async (req, res) => {
  try {
    const { name, description, requires_ownership, requires_scan, active } = req.body;
    const result = await pool.query(
      `INSERT INTO asset_states (name, description, requires_ownership, requires_scan, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, requires_ownership === true, requires_scan === true, active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating asset state:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateAssetState = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, requires_ownership, requires_scan, active } = req.body;
    const result = await pool.query(
      `UPDATE asset_states
       SET name = $1,
           description = $2,
           requires_ownership = $3,
           requires_scan = $4,
           active = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, description, requires_ownership === true, requires_scan === true, active !== false, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset state not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating asset state:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteAssetState = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM asset_states WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset state not found' });
    }
    res.json({ message: 'Asset state deleted' });
  } catch (err) {
    console.error('Error deleting asset state:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllAssetStates,
  getAssetStateById,
  createAssetState,
  updateAssetState,
  deleteAssetState,
};
