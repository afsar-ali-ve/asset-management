const pool = require('../config/db');

const getAllManufacturers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM manufacturers ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching manufacturers:', err);
    res.status(500).json({ error: err.message });
  }
};

const getManufacturerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM manufacturers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching manufacturer:', err);
    res.status(500).json({ error: err.message });
  }
};

const createManufacturer = async (req, res) => {
  try {
    const { name, description, active } = req.body;
    const result = await pool.query(
      'INSERT INTO manufacturers (name, description, active) VALUES ($1, $2, $3) RETURNING *',
      [name, description, active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating manufacturer:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, active } = req.body;
    const result = await pool.query(
      'UPDATE manufacturers SET name = $1, description = $2, active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, description, active !== false, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating manufacturer:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM manufacturers WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }
    res.json({ message: 'Manufacturer deleted' });
  } catch (err) {
    console.error('Error deleting manufacturer:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllManufacturers,
  getManufacturerById,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
};
