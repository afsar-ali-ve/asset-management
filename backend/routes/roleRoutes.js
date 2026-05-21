const express = require('express');
const requireAdmin = require('../middleware/adminMiddleware');
const { getRoles } = require('../controllers/roleController');

const router = express.Router();

router.get('/', requireAdmin, getRoles);

module.exports = router;
