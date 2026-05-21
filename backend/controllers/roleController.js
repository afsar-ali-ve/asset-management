const pool = require('../config/db');

const getRoles = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, role_name, description, created_at, updated_at
       FROM roles
       ORDER BY
         CASE role_name
           WHEN 'Admin' THEN 1
           WHEN 'Manager' THEN 2
           WHEN 'Employee' THEN 3
           WHEN 'Viewer' THEN 4
           ELSE 5
         END,
         role_name ASC`
    );

    res.json({ roles: result.rows });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Unable to load roles' });
  }
};

module.exports = {
  getRoles,
};
