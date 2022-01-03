
const { Sequelize, sequelize } = require("../init")


const TableCategory = sequelize.define('category', {
  id: { type: Sequelize.STRING, primaryKey: true },
  title: { type: Sequelize.STRING },
  url: { type: Sequelize.STRING },
  loc: { type: Sequelize.STRING },
  // channelId:{},
},

  {
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步      
    tableName: 'category',
    timestamps: false
  })




module.exports = TableCategory