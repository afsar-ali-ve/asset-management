const express = require('express');
const router = express.Router();
const {
  getAllAssetStates,
  getAssetStateById,
  createAssetState,
  updateAssetState,
  deleteAssetState,
} = require('../controllers/assetStateController');

router.get('/', getAllAssetStates);
router.get('/:id', getAssetStateById);
router.post('/', createAssetState);
router.put('/:id', updateAssetState);
router.delete('/:id', deleteAssetState);

module.exports = router;
