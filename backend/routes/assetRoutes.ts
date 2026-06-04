const express = require('express');
const router = express.Router();
const {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  assignAsset,
  getAssignmentHistory,
  deleteAsset,
} = require('../controllers/assetController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', getAllAssets);
router.get('/:assetId/assignment-history', getAssignmentHistory);
router.post('/:assetId/assign', authenticateToken, assignAsset);
router.get('/:id', getAssetById);
router.post('/', createAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

module.exports = router;
