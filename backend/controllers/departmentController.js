const pool = require('../config/db');

const getDepartments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, status, created_at, updated_at
       FROM departments
       WHERE LOWER(status) = 'active'
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Unable to load departments' });
  }
};

module.exports = {
  getDepartments,
};
