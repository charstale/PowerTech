const axios = require("axios");
axios.defaults.withCredentials = true;




class Tools {
  constructor() { }
  static getArticleLinks = async function* (pos) {
    let _url = "https://www.xuexi.cn/c06bf4acc7eef6ef0a560328938b5771/data9a3668c13f6e303932b5e0e100fc248b.js"
    let _resp = await axios.get(_url)

    let pattn = /(?<=\"static_page_url\":\")(.+?)(?=\")/g
    let _links = _resp.data.match(pattn)

    if (!_links) { return null }

    let _pos = pos //= await that.readArticleLinkIndex(user)
    if (!_pos) { _pos = 0 }


    for (let _p = _pos; _p < _links.length; _p++) {

      // that.saveArticleLinkIndex(_p, user)

      let _url = _links[_p]
      yield { url: _url, pos: _p }
    }

  }

  static getVideoLinks = async function* () {
    let _url = "https://www.xuexi.cn/lgdata/4426aa87b0b64ac671c96379a3a8bd26/db086044562a57b441c24f2af1c8e101.json"
    let { data: { DataSet: _dataSet } } = await axios.get(_url)

    let _json_urls = []
    let _links = []
    for (let _elem of _dataSet) {
      _json_urls.push("https://www.xuexi.cn/lgdata/" + _elem.split('!')[1])
    }

    while (true) {

      while (_links.length < 20) {
        let _randomUrl = _json_urls[Math.floor(Math.random() * _json_urls.length)];

        let { data: _arrData } = await axios.get(_randomUrl)

        let _length = _arrData.length
        let _x1 = Math.floor(Math.random() * _length)

        let _count = 0
        for (let _i = 0; _i < _x1; _i++) {
          if (Math.random > 0.5) { continue }
          _links.push(_arrData[_i]["url"])
          _count += 1
          if (_count > 5) { break }
        }
      }
      _links.sort(function () { return 0.5 - Math.random() })

      for (let _url of _links) {
        yield _url
      }
    }
  }

  static async getUserInfo(cookies) {
    try {

      let _cookieStr = this.cookieFromJson(cookies)
      let _url = "https://pc-api.xuexi.cn/open/api/user/info"
      let { data: { data: { nick: _realname, uid: _userid } } } = await axios.get(_url,

        {
          headers: {
            'Cache-Control': 'no-cache',
            'Cookie': _cookieStr
          }
        })

      return {
        realname: _realname,
        userid: _userid
      }

      // return _total
    } catch (e) {
      console.log("用户信息获取失败" + e.message)
      return null
    }
  }


  static async getTotalScore(cookies) {
    try {

      let _cookieStr = this.cookieFromJson(cookies)
      let _url = "https://pc-api.xuexi.cn/open/api/score/get"
      let { data: { data: { score: _total } } } = await axios.get(_url,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Cookie': _cookieStr
          }
        })

      return _total
    } catch (e) {
      console.log("get_total_score 获取失败" + e.message)
    }
  }
  static async getTodayScore(cookies) {
    try {

      let _cookieStr = this.cookieFromJson(cookies)
      let _url = "https://pc-api.xuexi.cn/open/api/score/today/query"
      let { data: { data: { score: _today } } } = await axios.get(_url,
        // let _today = await axios.get(_url,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Cookie': _cookieStr
          }
        })

      return _today
    } catch (e) {
      console.log("get_today_score 获取失败" + e.message)
    }
  }
  static async getCurrentScores(cookies) {
    // while (true) {
    for (let x = 5; x > 0; x++) {
      try {

        let _cookieStr = this.cookieFromJson(cookies)
        let _url = "https://pc-api.xuexi.cn/open/api/score/today/queryrate"
        let { data: { data: { dayScoreDtos: _detail } } } = await axios.get(_url,
          {
            headers: {
              'Cache-Control': 'no-cache',
              'Cookie': _cookieStr
            }
          })

        let _scores = {
          "articleCum": _detail[0]["currentScore"],
          "videoCum": _detail[1]["currentScore"],
          "login": _detail[7]["currentScore"],
          "articleSus": _detail[8]["currentScore"],
          "videoSus": _detail[10]["currentScore"],
          "quizDaily": _detail[4]["currentScore"],
          "quizWeekly": _detail[3]["currentScore"],
          "quizEarmarked": _detail[2]["currentScore"]
        }
        return _scores
      } catch (e) {
        console.log("获取分数详情失败，停1秒 " + e.message);
        await this.sleep(1000)
      }
    }
  }


  static cookieFromJson(jsonCookie) {
    let _arr = []
    for (let _elem of jsonCookie) {
      _arr.push(`${_elem['name']} = ${_elem['value']}`)
    }
    let _cookieStr = _arr.join(";")

    return _cookieStr
  }


  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static parseExpires(cookies) {
    for (let _elem of cookies) {
      if (_elem.name == "token") {
        let _expires = _elem.expires
        let _now = Date.now() / 1000

        let _remains = (_expires - _now) / 3600

        return _remains.toFixed(2)
      }
    }
  }

}




module.exports = Tools