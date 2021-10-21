

const Sequelize = require('sequelize');
const sequelize = new Sequelize({
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,///不显示SQL语句

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  storage: './local.sqlite',
  // operatorsAliases: false,
  define: {
    freezeTableName: false,
    timestamps: false
  }

});

module.exports = { Sequelize, sequelize }