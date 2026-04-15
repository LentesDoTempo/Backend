const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail } = require('../services/emailService');
const { sequelize } = require('../config/database');

const forgotPassword = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Email not found' });
    }

    const code = PasswordReset.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordReset.destroy({
      where: {
        userId: user.id,
        used: false,
      },
      transaction,
    });

    await PasswordReset.create(
      {
        userId: user.id,
        code,
        expiresAt,
        used: false,
      },
      { transaction }
    );

    await sendPasswordResetEmail(user.email, code, user.name);

    await transaction.commit();

    res.json({
      message: 'Password reset code sent to email',
      expiresIn: '15 minutes',
      // Apenas para desenvolvimento - remover em produção
      code: process.env.NODE_ENV === 'development' ? code : undefined,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
};

const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const resetRequest = await PasswordReset.findOne({
      where: {
        userId: user.id,
        code,
        used: false,
      },
    });

    if (!resetRequest) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    if (new Date() > resetRequest.expiresAt) {
      return res.status(400).json({ error: 'Code expired' });
    }

    res.json({ message: 'Code verified successfully' });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
};

const resetPassword = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        error: 'Email, code and newPassword are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const resetRequest = await PasswordReset.findOne({
      where: {
        userId: user.id,
        code,
        used: false,
      },
    });

    if (!resetRequest) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    if (new Date() > resetRequest.expiresAt) {
      await resetRequest.destroy({ transaction });
      return res.status(400).json({ error: 'Code expired' });
    }

    user.password = newPassword;
    await user.save({ transaction });

    resetRequest.used = true;
    await resetRequest.save({ transaction });

    await transaction.commit();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = {
  forgotPassword,
  verifyCode,
  resetPassword,
};
