const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Image = sequelize.define('Image', {
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
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  generatedFileName: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  generatedFilePath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  generatedMimeType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  generatedSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  geminiAnalysis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
  ],
});

Image.associate = (models) => {
  Image.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
};

module.exports = Image;
