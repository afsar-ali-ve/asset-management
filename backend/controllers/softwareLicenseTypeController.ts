const pool = require('../config/db');

const getAllSoftwareLicenseTypes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM software_license_types ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching software license types:', err);
    res.status(500).json({ error: err.message });
  }
};

const getSoftwareLicenseTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM software_license_types WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Software license type not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching software license type:', err);
    res.status(500).json({ error: err.message });
  }
};

const createSoftwareLicenseType = async (req, res) => {
  try {
    const {
      license_type,
      manufacturer,
      track_by,
      installation_allowed,
      is_perpetual,
      is_free_license,
      license_option,
      active,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO software_license_types
        (license_type, manufacturer, track_by, installation_allowed, is_perpetual, is_free_license, license_option, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        license_type,
        manufacturer,
        track_by,
        installation_allowed,
        is_perpetual === true,
        is_free_license === true,
        license_option,
        active !== false,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating software license type:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateSoftwareLicenseType = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      license_type,
      manufacturer,
      track_by,
      installation_allowed,
      is_perpetual,
      is_free_license,
      license_option,
      active,
    } = req.body;

    const result = await pool.query(
      `UPDATE software_license_types
       SET license_type = $1,
           manufacturer = $2,
           track_by = $3,
           installation_allowed = $4,
           is_perpetual = $5,
           is_free_license = $6,
           license_option = $7,
           active = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        license_type,
        manufacturer,
        track_by,
        installation_allowed,
        is_perpetual === true,
        is_free_license === true,
        license_option,
        active !== false,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Software license type not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating software license type:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteSoftwareLicenseType = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM software_license_types WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Software license type not found' });
    }
    res.json({ message: 'Software license type deleted' });
  } catch (err) {
    console.error('Error deleting software license type:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllSoftwareLicenseTypes,
  getSoftwareLicenseTypeById,
  createSoftwareLicenseType,
  updateSoftwareLicenseType,
  deleteSoftwareLicenseType,
};
