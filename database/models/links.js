
const { Sequelize, sequelize } = require("../init")


const TableLinks = sequelize.define('linkItem', {
  id: { type: Sequelize.STRING, primaryKey: true, autoIncrement: true },
  url: { type: Sequelize.STRING, unique: true },
  type: { type: Sequelize.INTEGER },
  time: { type: Sequelize.REAL },

},

  {
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步      
    tableName: 'linkItem',
    timestamps: false
  })




module.exports = TableLinks