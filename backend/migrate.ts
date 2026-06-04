require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const runMigrations = async () => {
  try {
    // Run users migration
    try {
      const usersSql = fs.readFileSync(path.join(__dirname, './migrations/create_users.sql'), 'utf8');
      await pool.query(usersSql);
      console.log('Users table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Users table already exists, skipping');
      } else {
        throw err;
      }
    }

    // Run user profile migration
    try {
      const userProfileSql = fs.readFileSync(path.join(__dirname, './migrations/add_user_profile_image.sql'), 'utf8');
      await pool.query(userProfileSql);
      console.log('User profile fields ready');
    } catch (err) {
      throw err;
    }

    // Run password reset fields migration
    try {
      const userResetPasswordSql = fs.readFileSync(path.join(__dirname, './migrations/add_user_reset_password_fields.sql'), 'utf8');
      await pool.query(userResetPasswordSql);
      console.log('User password reset fields ready');
    } catch (err) {
      throw err;
    }

    // Run user department and seed migration
    try {
      const userDepartmentSql = fs.readFileSync(path.join(__dirname, './migrations/add_user_department_and_seed.sql'), 'utf8');
      await pool.query(userDepartmentSql);
      console.log('Sample users ready');
    } catch (err) {
      throw err;
    }

    // Run departments migration
    try {
      const departmentsSql = fs.readFileSync(path.join(__dirname, './migrations/create_departments.sql'), 'utf8');
      await pool.query(departmentsSql);
      console.log('Departments table and sample departments ready');
    } catch (err) {
      throw err;
    }

    // Run roles and user management migration after departments, because departments migration normalizes user department fields.
    try {
      const rolesSql = fs.readFileSync(path.join(__dirname, './migrations/create_roles_and_user_management_fields.sql'), 'utf8');
      await pool.query(rolesSql);
      console.log('Roles and user management fields ready');
    } catch (err) {
      throw err;
    }

    // Run product types migration
    try {
      const productTypesSql = fs.readFileSync(path.join(__dirname, './migrations/create_product_types.sql'), 'utf8');
      await pool.query(productTypesSql);
      console.log('✓ Product types table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Product types table already exists, skipping');
      } else {
        throw err;
      }
    }


    // Run software types migration
    try {
      const softwareTypesSql = fs.readFileSync(path.join(__dirname, './migrations/create_software_types.sql'), 'utf8');
      await pool.query(softwareTypesSql);
      console.log('✓ Software types table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Software types table already exists, skipping');
      } else {
        throw err;
      }
    }

    // Run software categories migration
    try {
      const softwareCategoriesSql = fs.readFileSync(path.join(__dirname, './migrations/create_software_categories.sql'), 'utf8');
      await pool.query(softwareCategoriesSql);
      console.log('âœ“ Software categories table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Software categories table already exists, skipping');
      } else {
        throw err;
      }
    }

    // Run vendors migration
    try {
      const vendorsSql = fs.readFileSync(path.join(__dirname, './migrations/create_vendors.sql'), 'utf8');
      await pool.query(vendorsSql);
      console.log('✓ Vendors table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Vendors table already exists, skipping');
      } else {
        throw err;
      }
    }

    // Run software license types migration
    try {
      const softwareLicenseTypesSql = fs.readFileSync(path.join(__dirname, './migrations/create_software_license_types.sql'), 'utf8');
      await pool.query(softwareLicenseTypesSql);
      console.log('Software license types table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Software license types table already exists, skipping');
      } else {
        throw err;
      }
    }

    // Run asset states migration
    try {
      const assetStatesSql = fs.readFileSync(path.join(__dirname, './migrations/create_asset_states.sql'), 'utf8');
      await pool.query(assetStatesSql);
      console.log('Asset states table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Asset states table already exists, skipping');
      } else {
        throw err;
      }
    }

    // Run manufacturers migration
    try {
      const manufacturersSql = fs.readFileSync(path.join(__dirname, './migrations/create_manufacturers.sql'), 'utf8');
      await pool.query(manufacturersSql);
      console.log('Manufacturers table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Manufacturers table already exists, skipping');
      } else {
        throw err;
      }
    }

    // Run assets migration
    try {
      const assetsSql = fs.readFileSync(path.join(__dirname, './migrations/create_assets.sql'), 'utf8');
      await pool.query(assetsSql);
      console.log('Assets table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Assets table already exists, skipping');
      } else {
        throw err;
      }
    }

    // Run asset extended fields migration
    try {
      const assetExtendedFieldsSql = fs.readFileSync(path.join(__dirname, './migrations/add_asset_extended_fields.sql'), 'utf8');
      await pool.query(assetExtendedFieldsSql);
      console.log('Asset extended fields ready');
    } catch (err) {
      throw err;
    }

    // Remove static printer fields. Printer-specific fields will be added dynamically later.
    try {
      const dropAssetPrinterFieldsSql = fs.readFileSync(path.join(__dirname, './migrations/drop_asset_printer_fields.sql'), 'utf8');
      await pool.query(dropAssetPrinterFieldsSql);
      console.log('Static asset printer fields removed');
    } catch (err) {
      throw err;
    }

    // Run workstation-specific asset details migration
    try {
      const assetWorkstationDetailsSql = fs.readFileSync(path.join(__dirname, './migrations/create_asset_workstation_details.sql'), 'utf8');
      await pool.query(assetWorkstationDetailsSql);
      console.log('Asset workstation details table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Asset workstation details table already exists, skipping');
      } else {
        throw err;
      }
    }

    // Run workstation-specific hardware detail migrations
    try {
      const assetWorkstationHardwareSql = fs.readFileSync(path.join(__dirname, './migrations/create_asset_workstation_hardware_tables.sql'), 'utf8');
      await pool.query(assetWorkstationHardwareSql);
      console.log('Asset workstation hardware tables created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Asset workstation hardware tables already exist, skipping');
      } else {
        throw err;
      }
    }

    // Run asset assignment history migration
    try {
      const assetAssignmentHistorySql = fs.readFileSync(path.join(__dirname, './migrations/create_asset_assignment_history.sql'), 'utf8');
      await pool.query(assetAssignmentHistorySql);
      console.log('Asset assignment history table created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Asset assignment history table already exists, skipping');
      } else {
        throw err;
      }
    }

    // Run task management migration
    try {
      const taskManagementSql = fs.readFileSync(path.join(__dirname, './migrations/create_task_management.sql'), 'utf8');
      await pool.query(taskManagementSql);
      console.log('Task management tables ready');
    } catch (err) {
      throw err;
    }

    console.log('All migrations completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
};

runMigrations();
