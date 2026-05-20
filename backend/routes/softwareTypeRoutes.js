const express = require('express');
const router = express.Router();
const {
  getAllSoftwareTypes,
  getSoftwareTypeById,
  createSoftwareType,
  updateSoftwareType,
  deleteSoftwareType,
} = require('../controllers/softwareTypeController');

router.get('/', getAllSoftwareTypes);
router.get('/:id', getSoftwareTypeById);
router.post('/', createSoftwareType);
router.put('/:id', updateSoftwareType);
router.delete('/:id', deleteSoftwareType);

module.exports = router;
