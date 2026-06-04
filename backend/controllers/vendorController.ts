const pool = require('../config/db');

// Get all vendors
const getVendors = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendors');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

// Create a new vendor
const createVendor = async (req, res) => {
  const { name, currency, contactPerson, email, phone, website, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vendors (name, currency, contact_person, email, phone, website, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, currency, contactPerson, email, phone, website, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
};

// Update a vendor
const updateVendor = async (req, res) => {
  const { id } = req.params;
  const { name, currency, contactPerson, email, phone, website, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE vendors SET name = $1, currency = $2, contact_person = $3, email = $4, phone = $5, website = $6, description = $7 WHERE id = $8 RETURNING *',
      [name, currency, contactPerson, email, phone, website, description, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
};

// Delete a vendor
const deleteVendor = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM vendors WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
};

module.exports = {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
};