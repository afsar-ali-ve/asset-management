const pool = require('../config/db');

const toNumber = (value) => Number(value || 0);

const getDashboardStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE COALESCE(is_active, FALSE) = TRUE) AS active_users,
        (SELECT COUNT(*) FROM users WHERE COALESCE(is_active, FALSE) = FALSE) AS inactive_users,
        (SELECT COUNT(*) FROM assets) AS total_assets,
        (
          SELECT COUNT(*)
          FROM assets
          WHERE NULLIF(BTRIM(COALESCE(assigned_user, '')), '') IS NOT NULL
        ) AS assigned_assets,
        (
          SELECT COUNT(*)
          FROM assets
          WHERE NULLIF(BTRIM(COALESCE(assigned_user, '')), '') IS NULL
        ) AS available_assets,
        (SELECT COUNT(*) FROM product_types) AS total_product_types,
        (SELECT COUNT(*) FROM departments) AS departments_count
    `);

    const stats = result.rows[0] || {};

    res.json({
      totalUsers: toNumber(stats.total_users),
      activeUsers: toNumber(stats.active_users),
      inactiveUsers: toNumber(stats.inactive_users),
      totalAssets: toNumber(stats.total_assets),
      assignedAssets: toNumber(stats.assigned_assets),
      availableAssets: toNumber(stats.available_assets),
      totalProductTypes: toNumber(stats.total_product_types),
      departmentsCount: toNumber(stats.departments_count),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Unable to load dashboard statistics' });
  }
};

module.exports = {
  getDashboardStats,
};
