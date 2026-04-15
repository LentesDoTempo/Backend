const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register - Registrar novo usuário
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login - Login usuário
router.post('/login', validateLogin, authController.login);

// GET /api/auth/me - Perfil do usuário autenticado
router.get('/me', protect, authController.getProfile);

module.exports = router;
