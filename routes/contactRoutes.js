const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { validateServiceRequest } = require('../middleware/validationMiddleware');

router.post('/service-request', validateServiceRequest, contactController.serviceRequest);

module.exports = router;
