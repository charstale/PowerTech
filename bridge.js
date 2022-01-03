const { Sequelize } = require("./database/init")

const dbUsers = require("./database/models/users")
const dbLinks = require("./database/models/links")
const dbCategory = require("./database/models/category")




class Bridge {

  constructor() {
    // this.cookies = cookies
  }
  static generateLink = async function* (type) {

    Array.prototype.shuffle = function () { //洗牌算法，打乱数组
      var array = this;
      var m = array.length,
        t, i;
      while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
      }
      return array;
    }




    try {

      let _offset = 0
      while (true) {
        let _links = await dbLinks.findAll({
          'order': [['time', 'desc']],
          'where': { type: type },
          'offset': _offset,
          'limit': 50
        })

        _offset += 50
        if (!_links) {
          break
        }
        _links = _links.shuffle()
        for (let _l of _links) {

          let _url = _l["url"]
          // let _url = `https://www.xuexi.cn/lgpage/detail/index.html?id=${_itemId}&item_id=${_itemId}`
          yield _url
        }
      }

    } catch (e) {
      console.log(e.message)
    }




  }
  async getUsers() {

    let _users = await dbUsers.findAll()
    let _all = _users.map((elem) => {
      return {
        userid: elem["userid"],
        realname: elem["realname"],
        cookie: elem["cookie"]
      }
    })
    return _all
  }

  async saveScore(userid, score) {

    await dbUsers.update({
      "score": score
    }, {
      "where": {
        "userid": userid
      }
    })
  }

  async loadScore(userid) {

    let { score: _score } = await dbUsers.findOne(
      {
        "attributes": ["score"],
        "where": {
          "userid": userid
        }
      }
    )

    return _score

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
  // static async loadCookie(userid) {

  //   let { cookie: _cookies } = await dbUsers.findOne(
  //     {
  //       "attributes": ["cookie"],
  //       "where": {
  //         "userid": userid
  //       }
  //     }
  //   )
  //   return _cookies


  // }
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
      console.log("用户删除成功");
    } catch (e) {
      console.log("用户删除失败 " + e.message);
    }
  }

  async saveUser(userid, realname, cookies) {



    Date.prototype.Format = function (fmt) {
      var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "H+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
      };
      if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
      for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      return fmt;
    }



    await dbUsers.bulkCreate(
      [{
        userid: userid,
        realname: realname,
        cookie: cookies,
        updateTime: new Date().Format("yyyy-MM-dd HH:mm:ss")
      }]
      , {
        updateOnDuplicate: ["realname", "cookie", "updateTime"]
      }
    )

  }
  static async saveCategory(categories) {

    await dbCategory.destroy({
      where: {}
    })


    // let _data = []
    // for (let _loc in categories) {

    //   for (let _url of categories[_loc]) {
    //     _data.push({
    //       "loc": _loc,
    //       "url": _url
    //     })
    //   }
    // }
    await dbCategory.bulkCreate(categories)
  }

  static async readCategory() {

    try {
      let _categoris = await dbCategory.findAll({
        attributes: ["id", "url", "title", "loc"],
        'order': [Sequelize.literal('RANDOM()')],
        'limit': 30
      })

      return _categoris.map((x) => { return { channelId: x["id"], url: x["url"], title: x["title"], loc: x["loc"] } })
    } catch (e) {
      console.log(e.message)
    }


  }



}



module.exports = Bridge