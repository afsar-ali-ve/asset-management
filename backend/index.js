require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const productTypeRoutes = require('./routes/productTypeRoutes');
const productRoutes = require('./routes/productRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const softwareTypeRoutes = require('./routes/softwareTypeRoutes');
const softwareCategoryRoutes = require('./routes/softwareCategoryRoutes');
const manufacturerRoutes = require('./routes/manufacturerRoutes');
const softwareLicenseTypeRoutes = require('./routes/softwareLicenseTypeRoutes');
const assetStateRoutes = require('./routes/assetStateRoutes');
const assetRoutes = require('./routes/assetRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const roleRoutes = require('./routes/roleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authenticateToken = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  ...(process.env.CORS_ORIGIN || '').split(','),
  ...(process.env.FRONTEND_URL || '').split(','),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/roles', authenticateToken, roleRoutes);
app.use('/api/assets', authenticateToken, assetRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api', authenticateToken, taskRoutes);
app.use('/api/departments', authenticateToken, departmentRoutes);
app.use('/api/product-types', authenticateToken, productTypeRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/vendors', authenticateToken, vendorRoutes);
app.use('/api/software-types', authenticateToken, softwareTypeRoutes);
app.use('/api/software-categories', authenticateToken, softwareCategoryRoutes);
app.use('/api/manufacturers', authenticateToken, manufacturerRoutes);
app.use('/api/software-license-types', authenticateToken, softwareLicenseTypeRoutes);
app.use('/api/asset-states', authenticateToken, assetStateRoutes);
app.use('/product-types', authenticateToken, productTypeRoutes);
app.use('/products', authenticateToken, productRoutes);
app.use('/vendors', authenticateToken, vendorRoutes);
app.use('/software-types', authenticateToken, softwareTypeRoutes);
app.use('/software-categories', authenticateToken, softwareCategoryRoutes);
app.use('/manufacturers', authenticateToken, manufacturerRoutes);
app.use('/software-license-types', authenticateToken, softwareLicenseTypeRoutes);
app.use('/asset-states', authenticateToken, assetStateRoutes);
app.use('/assets', authenticateToken, assetRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
