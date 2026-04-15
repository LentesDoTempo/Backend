const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { protect } = require('../middleware/authMiddleware');
const { handleUpload } = require('../middleware/upload');

router.use(protect);

router.post('/upload', handleUpload, imageController.uploadImage);
router.get('/', imageController.listImages);
router.get('/:id', imageController.getImage);
router.delete('/:id', imageController.deleteImage);

module.exports = router;
