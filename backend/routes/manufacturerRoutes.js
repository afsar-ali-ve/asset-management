const express = require('express');
const router = express.Router();
const {
  getAllManufacturers,
  getManufacturerById,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
} = require('../controllers/manufacturerController');

router.get('/', getAllManufacturers);
router.get('/:id', getManufacturerById);
router.post('/', createManufacturer);
router.put('/:id', updateManufacturer);
router.delete('/:id', deleteManufacturer);

module.exports = router;
