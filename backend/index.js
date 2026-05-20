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

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  ...(process.env.CORS_ORIGIN || '').split(','),
  ...(process.env.FRONTEND_URL || '').split(','),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
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
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/product-types', productTypeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/software-types', softwareTypeRoutes);
app.use('/api/software-categories', softwareCategoryRoutes);
app.use('/api/manufacturers', manufacturerRoutes);
app.use('/api/software-license-types', softwareLicenseTypeRoutes);
app.use('/api/asset-states', assetStateRoutes);
app.use('/product-types', productTypeRoutes);
app.use('/products', productRoutes);
app.use('/vendors', vendorRoutes);
app.use('/software-types', softwareTypeRoutes);
app.use('/software-categories', softwareCategoryRoutes);
app.use('/manufacturers', manufacturerRoutes);
app.use('/software-license-types', softwareLicenseTypeRoutes);
app.use('/asset-states', assetStateRoutes);
app.use('/assets', assetRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
