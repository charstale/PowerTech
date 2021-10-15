
const pickle = require("pickle")
const { Sequelize, sequelize } = require("../init")








const TableUsers = sequelize.define('users', {
  userid: { type: Sequelize.STRING, primaryKey: true },
  realname: { type: Sequelize.STRING },
  articleLinkPos: { type: Sequelize.STRING },
  cookie: { type: Sequelize.STRING ,
  get() {
    let _raw = this.getDataValue("cookie")
    if (_raw) {
      return pickle.loadBase64(_raw)
    } else {
      return null
    }
  },
  set(val) {
    if (val) {
      this.setDataValue("cookie", pickle.dumpBase64(val))
    } else {
      this.setDataValue("cookie", null)
    }
  }
}
},

  {
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步      
    tableName: 'users',
    timestamps: false
  })




module.exports = TableUsers