const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Rota protegida de exemplo
// GET /api/protected - Apenas usuários autenticados
router.get('/protected', protect, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

// Adicione mais rotas protegidas aqui
// router.post('/some-action', protect, (req, res) => { ... });

module.exports = router;
