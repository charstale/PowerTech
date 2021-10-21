
const dbUsers = require("./database/models/users")


class Bridge {

  constructor() {
    // this.cookies = cookies
  }

  async getUsers(simple) {

    let _users = await dbUsers.findAll()
    let _all = null
    if (simple) {
      _all = _users.map((elem) => {
        return {
          userid: elem["userid"],
          realname: elem["realname"]
        }
      })
    } else {
      _all = _users.map((elem) => {
        return {
          userid: elem["userid"],
          realname: elem["realname"],
          articleLinkPos: elem["articleLinkPos"],
          cookies: elem["cookie"],

        }
      })
    }
    return _all
  }

  async updateCookie(userid, cookies) {
    await dbUsers.update({
      "cookie": cookies
    }, {
      "where": {
        "userid": userid
      }
    })
  }

  async saveArticleLinkIndex(userid, pos) {
    await dbUsers.update({
      "articleLinkPos": pos
    }, {
      "where": {
        "userid": userid
      }
    })
  }

  async readArticleLinkIndex(userid) {
    let { articleLinkPos: _pos } = await dbUsers.findOne(
      {
        "attributes": ["articleLinkPos"],
        "where": {
          "userid": userid
        }
      }
    )
    return _pos
  }
  async deleteUser(userid) {

    try {
      await dbUsers.destroy({
        where: {
          userid: userid
        }
      })
      console.log("删除成功");
    } catch (e) {
      console.log("删除失败 " + e.message);
    }
  }

  async saveUser(userid, realname, cookies) {

    await dbUsers.bulkCreate(
      [{
        userid: userid,
        realname: realname,
        cookie: cookies
      }]
      , {
        updateOnDuplicate: ["realname", "cookie"]
      }
    )

  }
}



module.exports = Bridge