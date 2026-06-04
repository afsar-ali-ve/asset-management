const express = require('express');
const router = express.Router();
const {
  getAllSoftwareLicenseTypes,
  getSoftwareLicenseTypeById,
  createSoftwareLicenseType,
  updateSoftwareLicenseType,
  deleteSoftwareLicenseType,
} = require('../controllers/softwareLicenseTypeController');

router.get('/', getAllSoftwareLicenseTypes);
router.get('/:id', getSoftwareLicenseTypeById);
router.post('/', createSoftwareLicenseType);
router.put('/:id', updateSoftwareLicenseType);
router.delete('/:id', deleteSoftwareLicenseType);

module.exports = router;
