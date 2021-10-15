
const dbCookie = require("./database/models/cookie")
const dbResource = require("./database/models/resource")









class User {

  constructor(cookies) {
    this.cookies = cookies
    // this.userdir = userdir
  }

  static async build(cookies) {
    let _cookies = cookies
    let _userdir = `./profiles/${uuidv4()}`
    let _client = await puppy.launch({
      // executablePath: 'D:/Chromium/chrome.exe',
      executablePath: 'D:/Chrome/Application/chrome.exe',
      userDataDir: _userdir,
      headless: false,
      ignoreDefaultArgs: ['--enable-automation']
    })
    let _page = await _client.newPage();
    ///关闭waitFor系列函数的默认超时设定
    await _page.setDefaultNavigationTimeout(0);


    return new Frame(_cookies, _client, _page, _userdir)
  }
  async readArticleLinkIndex() {
    let { articleLinkPos: _index } = await dbResource.findOne({
      attributes: ["articleLinkPos"],
      where: { "id": 0 }
    })
    return _index
  }
  async saveArticleLinkIndex(index) {
    await dbResource.update({ "articleLinkPos": index }), { "where": { "id": 0 } }
  }
  async readCookies() {

    try {
      // let _cookie_str = fs.readFileSync("cookie.json")
      // let _cookies = JSON.parse(_cookie_str)
      // return _cookies
      let _result = await dbCookie.findAll()
      let _cookies = _result.map(getData)
      return _cookies
    } catch (e) {
      return null
    }


    function getData(elem) {
      let _elem = {
        "name": elem["name"],
        "value": elem["value"],
        "domain": elem["domain"],
        "httpOnly": elem["httpOnly"]
      }
      // console.log(elem);
      return _elem
    }
  }


  async saveCookies(cookies) {

    let _pac = []
    for (let _elem of cookies) {
      let _a = { name: _elem.name, value: _elem.value, domain: _elem.domain, httpOnly: _elem.httpOnly }
      _pac.push(_a)

    }

    try {
      // fs.writeFile('cookie.json', JSON.stringify(_all), function (err) { })
      await dbCookie.bulkCreate(_pac, { updateOnDuplicate: ['value'] })

      return true
    } catch (e) {
      return null
    }
  }

  async verifyCookie(cookie) {
    let _url = ""

  }




}