const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const PasswordReset = sequelize.define('PasswordReset', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  code: {
    type: DataTypes.STRING(6),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['code'] },
    { fields: ['expiresAt'] },
  ],
});

PasswordReset.generateCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

PasswordReset.associate = (models) => {
  PasswordReset.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
};

module.exports = PasswordReset;
