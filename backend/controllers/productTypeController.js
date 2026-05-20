const pool = require('../config/db');

const normalizeEmpty = (value) => (value === '' || value === undefined ? null : value);

const validateParentProductType = async ({ parentProductType, allowNoParent, currentId = null }) => {
  const normalizedParentId = normalizeEmpty(parentProductType);
  if (!normalizedParentId && !allowNoParent) {
    return { error: 'Please select Parent Product Type' };
  }

  if (!normalizedParentId) {
    return { parentId: null };
  }

  if (currentId && normalizedParentId === currentId) {
    return { error: 'Product Type cannot be its own parent' };
  }

  const parentResult = await pool.query('SELECT id FROM product_types WHERE id = $1', [normalizedParentId]);
  if (parentResult.rows.length === 0) {
    return { error: 'Selected Parent Product Type does not exist' };
  }

  return { parentId: normalizedParentId };
};

const getAllProductTypes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product_types');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM product_types WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product type not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProductType = async (req, res) => {
  try {
    const { display_name, api_name, display_plural_name, api_plural_name, category, parent_product_type, asset_type, asset_category_type, description, allow_no_parent } = req.body;
    const parentValidation = await validateParentProductType({
      parentProductType: parent_product_type,
      allowNoParent: allow_no_parent === true,
    });
    if (parentValidation.error) {
      return res.status(400).json({ error: parentValidation.error });
    }

    const result = await pool.query(
      'INSERT INTO product_types (display_name, api_name, display_plural_name, api_plural_name, category, parent_product_type, asset_type, asset_category_type, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [display_name, api_name, display_plural_name, api_plural_name, category, parentValidation.parentId, asset_type, asset_category_type, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, api_name, display_plural_name, api_plural_name, category, parent_product_type, asset_type, asset_category_type, description, allow_no_parent } = req.body;
    const parentValidation = await validateParentProductType({
      parentProductType: parent_product_type,
      allowNoParent: allow_no_parent === true,
      currentId: id,
    });
    if (parentValidation.error) {
      return res.status(400).json({ error: parentValidation.error });
    }

    const result = await pool.query(
      'UPDATE product_types SET display_name = $1, api_name = $2, display_plural_name = $3, api_plural_name = $4, category = $5, parent_product_type = $6, asset_type = $7, asset_category_type = $8, description = $9 WHERE id = $10 RETURNING *',
      [display_name, api_name, display_plural_name, api_plural_name, category, parentValidation.parentId, asset_type, asset_category_type, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product type not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteProductType = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM product_types WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product type not found' });
    }
    res.json({ message: 'Product type deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllProductTypes,
  getProductTypeById,
  createProductType,
  updateProductType,
  deleteProductType,
};
