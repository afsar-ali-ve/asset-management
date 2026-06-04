const pool = require('../config/db');

const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.product_type_id,
        pt.display_name as product_type,
        p.manufacturer,
        p.part_no as "partNo",
        p.cost,
        p.description,
        p.active,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.product_type_id,
        pt.display_name as product_type,
        p.manufacturer,
        p.part_no as "partNo",
        p.cost,
        p.description,
        p.active,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      WHERE p.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: err.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, product_type, manufacturer, part_no, cost, description, active } = req.body;
    
    // Get product_type_id from display_name
    let product_type_id = null;
    if (product_type) {
      const typeResult = await pool.query(
        'SELECT id FROM product_types WHERE display_name = $1',
        [product_type]
      );
      if (typeResult.rows.length > 0) {
        product_type_id = typeResult.rows[0].id;
      }
    }

    const result = await pool.query(
      `INSERT INTO products (name, product_type_id, manufacturer, part_no, cost, description, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING 
         id,
         name,
         product_type_id,
         (SELECT display_name FROM product_types WHERE id = product_type_id) as product_type,
         manufacturer,
         part_no as "partNo",
         cost,
         description,
         active,
         created_at,
         updated_at`,
      [name, product_type_id, manufacturer, part_no, cost, description, active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, product_type, manufacturer, part_no, cost, description, active } = req.body;
    
    // Get product_type_id from display_name
    let product_type_id = null;
    if (product_type) {
      const typeResult = await pool.query(
        'SELECT id FROM product_types WHERE display_name = $1',
        [product_type]
      );
      if (typeResult.rows.length > 0) {
        product_type_id = typeResult.rows[0].id;
      }
    }

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, product_type_id = $2, manufacturer = $3, part_no = $4, cost = $5, description = $6, active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING 
         id,
         name,
         product_type_id,
         (SELECT display_name FROM product_types WHERE id = product_type_id) as product_type,
         manufacturer,
         part_no as "partNo",
         cost,
         description,
         active,
         created_at,
         updated_at`,
      [name, product_type_id, manufacturer, part_no, cost, description, active !== false, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
