const axios = require("axios")
// const { parse } = require("uuid")
const dbLinks = require("./database/models/links")
const { Op } = require("sequelize");
const Bridge = require("./bridge");
const ToolBox = require("./tools")
const CryptoJS = require('crypto-js');  //引用AES源码js

const FS = require("fs")
const util = require("util")
const stat = util.promisify(FS.stat)

const exec = require('child-process-promise').exec

const chief = {
  articles: [
    { title: "首页", addr: "https://www.xuexi.cn/lgdata/3uoe1tg20en0.json" },
    { title: "头条新闻", addr: "https://www.xuexi.cn/lgdata/1crqb964p71.json" },
    { title: "学习重点", addr: "https://www.xuexi.cn/lgdata/35il6fpn0ohq.json" },
    { title: "重要新闻", addr: "https://www.xuexi.cn/lgdata/1jscb6pu1n2.json" },
    { title: "学习时评", addr: "https://www.xuexi.cn/lgdata/1ap1igfgdn2.json" },

    { title: "综合新闻", addr: "https://www.xuexi.cn/lgdata/1ajhkle8l72.json" },
    { title: "中宣部发布", addr: "https://www.xuexi.cn/lgdata/slu9169f72.json" },
    { title: "学习实践", addr: "https://www.xuexi.cn/lgdata/17aeesljm72.json" },

    { title: "新时代纪实", addr: "https://www.xuexi.cn/lgdata/1i30sdhg0n3.json" },


  ],
  videos: [

    { title: "新闻联播", addr: "https://www.xuexi.cn/lgdata/17th9fq5c7l.json" },
    { title: "学习专题报道", addr: "https://www.xuexi.cn/lgdata/1koo357ronk.json" },
    { title: "学习新视界", addr: "https://www.xuexi.cn/lgdata/1742g60067k.json" },
    { title: "党史", addr: "https://www.xuexi.cn/lgdata/3o3ufqgl8rsn.json" },
    { title: "政论", addr: "https://www.xuexi.cn/lgdata/t1jk1cdl7l.json" },



    { title: "实播平台", addr: "https://www.xuexi.cn/lgdata/12qjrq6gm7c.json" },
    { title: "身边的感动", addr: "https://www.xuexi.cn/lgdata/1okif07b5nl.json" },
    { title: "国防军事新闻", addr: "https://www.xuexi.cn/lgdata/2qfjjjrprmdh.json" },
    { title: "政策新视界", addr: "https://www.xuexi.cn/lgdata/4quf2tm5quad.json" },


  ]
}

const local = [

  { title: "北京-首善之区", addr: "https://bj.xuexi.cn/local/bj/channel/bdf8a54f-3a67-4967-ab69-7148acd9c2a1.json" },
  { title: "北京-古都新貌", addr: "https://bj.xuexi.cn/local/bj/channel/c8e030ce-fa58-4db0-8c92-8440498f835c.json" },
  { title: "北京-人文北京", addr: "https://bj.xuexi.cn/local/bj/channel/e92bf26b-d933-4a68-be9c-0b452470dcdd.json" },

  { title: "重庆-殷殷嘱托", addr: "https://cq.xuexi.cn/local/cq/channel/8819a104-8839-4933-b038-8dd0cbdf178c.json" },
  { title: "重庆-重庆新闻", addr: "https://cq.xuexi.cn/local/cq/channel/261035d2-0289-4fcd-b83b-2bb56d1f4653.json" },
  { title: "重庆-党史教育", addr: "https://cq.xuexi.cn/local/cq/channel/d9bfac3a-afdf-4f5e-b97e-e67786841091.json" },
  { title: "重庆-乡村振兴", addr: "https://cq.xuexi.cn/local/cq/channel/05a84ed2-ff85-446c-962b-fa5b42e36482.json" },
  { title: "重庆-区县融媒", addr: "https://cq.xuexi.cn/local/cq/channel/c96d2cfe-2104-4e9f-a6d8-768c03c767ab.json" },
  { title: "重庆-我爱重庆", addr: "https://cq.xuexi.cn/local/cq/channel/089ebb4c-1c31-4327-b80d-41f2db0742ca.json" },


  { title: "江苏-江苏要闻", addr: "https://js.xuexi.cn/local/js/channel/7dc88927-824a-466f-bde4-cf422857ef67.json" },
  { title: "江苏-党史学习", addr: "https://js.xuexi.cn/local/js/channel/b338e549-38b5-49ff-8e9f-74450f2b8e78.json" },
  { title: "江苏-江苏学习", addr: "https://js.xuexi.cn/local/js/channel/2cfd6770-8397-4ea0-80d5-d8aa49c21cfc.json" },
  { title: "江苏-江苏实践", addr: "https://js.xuexi.cn/local/js/channel/701ea521-e5ea-4bf6-a276-e80c3ea81da8.json" },
  { title: "江苏-全面小康", addr: "https://js.xuexi.cn/local/js/channel/e6e2970a-bf46-4deb-9c5e-8c8e98193e54.json" },
  { title: "江苏-美丽江苏", addr: "https://js.xuexi.cn/local/js/channel/9a0bc1ee-98f1-4f1d-8571-3fd7792dfde6.json" },
  { title: "江苏-江苏文化", addr: "https://js.xuexi.cn/local/js/channel/682998c0-4075-40f3-b8c8-84d25a7d9262.json" },

]

const HEAER = {
  "Content-type": "text/html",
  "charset": "UTF-8",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36"
}

const today = new Date(new Date().toLocaleDateString()).getTime()


class Fetcher {
  constructor() { }

  static async getLocations() {

    let _url = "https://www.xuexi.cn/lgdata/e8cb7e8132ee33125793b020f6a63180/df59e7a5427508e62df34eb36f5c0223.json"

    let { data: _data } = await axios.get(_url, { headers: HEAER })

    let _zhanbo = _data["pageData"]["zhanBo-list"]

    let _locations = _zhanbo.map((x) => { return parseLoc(x) })

    return _locations

    function parseLoc(elem) {

      let _source = elem["link"]
      let _pattn = /https:\/\/(.+)\.xuexi\.cn/i
      let _rlt = _source.match(_pattn)
      return _rlt[1]

    }
  }


  static async getCategories() {

    if (!await goon()) { return }

    let _locations = await this.getLocations()


    let _categories = []
    for (let _loc of _locations) {

      // _categories[loc] = []

      let _url = `https://${_loc}.xuexi.cn/local/${_loc}/main/index.json`
      let { data: _data } = await axios.get(_url, { headers: HEAER })


      for (let _slot of _data["slots"]) {
        if ("headerMoreUrl" in _slot) {
          let _jsonUrl = `https://${_loc}.xuexi.cn${_slot["headerMoreUrl"].substring(14)}`
          let _title = `[${_loc}]${_slot["raw_channel_name"]}`
          let _channelId = _slot["channelId"]
          _categories.push({
            loc: _loc,
            title: _title,
            url: _jsonUrl,
            id: _channelId
          })
        }
      }

      await Bridge.saveCategory(_categories)
    }



    async function goon() {

      if (!FS.existsSync("flag.tmp")) {
        exec(`echo > flag.tmp`)
        return true
      }

      let _state = await stat("flag.tmp")
      let _lastTime = _state.ctime

      let _now = new Date().getTime();
      if (_now - _lastTime < 2626560000) {
        console.log("未满一个月，不获取栏目链接");
        return false
      }    //1638958212636一个月的毫秒数

      exec(`echo > flag.tmp`)
      return true
    }
  }




  static async fetchInChief() {
    for (let _link of chief.articles) {

      console.log(`正在处理【${_link.title}】`)

      let _items = await this.parseChiefItem(_link.addr, 0)
      if ((!_items) || (_items.length == 0)) {
        console.log("--------未获取到今日链接");
        continue
      }
      this.save(_items)
    }

    for (let _link of chief.videos) {

      console.log(`正在处理【${_link.title}】`)

      let _items = await this.parseChiefItem(_link.addr, 1)
      if ((!_items) || (_items.length == 0)) {
        console.log("--------未获取到今日链接");
        continue
      }
      this.save(_items)

    }
  }

  static async fetchInLocal() {

    let _localCategoris = await Bridge.readCategory()



    for (let _link of _localCategoris) {

      console.log(`正在处理【${_link.title}】`)

      try {
        let _items = await this.parseLocalItem(_link)
        if ((!_items) || (_items.length == 0)) {
          console.log("--------未获取到今日链接");
          continue
        }
        this.save(_items)

      } catch (e) {
        console.log(e.message);
        continue
      }
    }
  }


  static async run() {
    await this.obsolete()
    // this.fetchInChief()
    this.fetchInLocal()

  }

  static async parseChiefItem(addr, type) {

    let _rlt = []
    let _items = null
    let { data: _data } = await axios.get(addr, { headers: HEAER })

    _items = _data

    for (let _item of _items) {

      let _stamp = null

      if (_item.hasOwnProperty("auditTIme")) {
        _stamp = (new Date(_item["auditTime"])).getTime()
      } else if (_item.hasOwnProperty("publishTime")) {

        _stamp = (new Date(_item["publishTime"])).getTime()
      } else {
        continue
      }

      let _itemId = _item["itemId"]
      let _url = `https://www.xuexi.cn/lgpage/detail/index.html?id=${_itemId}&item_id=${_itemId}`
      if (_stamp < today) { continue }
      _rlt.push(
        {
          url: _url,
          type: type,
          time: _stamp
        }
      )
    }
    return _rlt
  }

  static async parseLocalItem(channel) {
    let _rlt = []
    let _items = null
    let { data: _data } = await axios.get(channel.url, { headers: HEAER }).catch((e) => {
      console.log(channel.url);
      throw new Error("栏目数据链接访问失败")
    })


    // if (_data.hasOwnProperty("items")) {
    _items = _data["items"]

    for (let _item of _items) {
      let _stamp = null

      _stamp = (new Date(_item["insertTime"])).getTime()
      if (_stamp < today) { continue }

      let _type = null
      if (_item.itemType == 1) {
        _type = 0
      } else if (_item.itemType == 30) {
        _type = 1
      } else {
        continue
      }


      let _itemId = _item["itemId"]
      let _url = ""
      if (_item["url"].indexOf("article.xuexi.cn") > 0) {
        _url = `https://www.xuexi.cn/lgpage/detail/index.html?id=${_itemId}&item_id=${_itemId}`
      } else {
        let _cdn = this.parseCDN(_item["url"])
        if (!_cdn) {
          continue
        }

        let _itemInput = {
          channel_id: channel.channelId,
          item_id: _itemId,
          cdn: _cdn
        }

        let _code = this.aesEncode(_itemInput)
        _url = `https://${channel.loc}.xuexi.cn/local/detail.html?${_code}`


      }

      _rlt.push(
        {
          url: _url,
          type: _type,
          time: _stamp
        }
      )
    }

    return _rlt
  }



  static async save(items) {

    await dbLinks.bulkCreate(items, {
      ignoreDuplicates: true
    })

  }

  static async obsolete() {

    let _oldStamp = today - 432000000///5天前
    await dbLinks.destroy({
      where: {
        time: { [Op.lt]: _oldStamp }
      }
    })
  }


  static parseCDN(input) {
    // let pattn = /channel_id=(\d+)&/
    // let rlt = input.match(pattn)
    // console.log(rlt[1])
    // let _channelId = rlt[1]
    try {
      let pattn2 = /https:\/\/region-.+-resource/
      let rlt2 = input.match(pattn2)
      // console.log(rlt2[0]);
      let _cnd = rlt2[0]

      return _cnd
    } catch (e) {
      console.log(e.message);
      return null
    }

  }

  static aesEncode(item) {
    let _all = []
    for (let n in item) {
      // console.log("key", this.aesEncrypt(n));
      // console.log("value", this.aesEncrypt(item[n]));

      let _strs = `${this.aesEncrypt(n)}=${this.aesEncrypt(item[n])}`

      _all.push(_strs)
    }

    return _all.join("&")

  }

  static aesEncrypt(input) {
    let _src = CryptoJS.enc.Utf8.parse(input);
    let _key = CryptoJS.enc.Utf8.parse("2018111411ABCDEF");  //a
    let _iv = CryptoJS.enc.Utf8.parse("ABCDEF2018111411");   //i

    let encrypted = CryptoJS.AES.encrypt(_src, _key, { iv: _iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    return encrypted.ciphertext.toString().toLowerCase();
  }

}


(async () => {

  // await Fetcher.getCategories()
  await Fetcher.run()
})()


// module.exports = Fetcher