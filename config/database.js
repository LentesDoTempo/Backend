const { Sequelize } = require('sequelize');
require('dotenv').config();

const baseOptions = {
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, baseOptions)
  : new Sequelize(
    process.env.DB_NAME || 'backend_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      ...baseOptions,
      host: process.env.DB_HOST || 'localhost',
    }
  );

module.exports = { sequelize };
