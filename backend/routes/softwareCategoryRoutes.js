const express = require('express');
const router = express.Router();
const {
  getAllSoftwareCategories,
  getSoftwareCategoryById,
  createSoftwareCategory,
  updateSoftwareCategory,
  deleteSoftwareCategory,
} = require('../controllers/softwareCategoryController');

router.get('/', getAllSoftwareCategories);
router.get('/:id', getSoftwareCategoryById);
router.post('/', createSoftwareCategory);
router.put('/:id', updateSoftwareCategory);
router.delete('/:id', deleteSoftwareCategory);

module.exports = router;
