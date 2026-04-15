const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');
const { validateEmail } = require('../middleware/validationMiddleware');

router.post('/forgot-password', validateEmail, passwordResetController.forgotPassword);
router.post('/verify-code', passwordResetController.verifyCode);
router.post('/reset-password', passwordResetController.resetPassword);

module.exports = router;
