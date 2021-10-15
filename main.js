const puppy = require('puppeteer-core');
const axios = require("axios");
axios.defaults.withCredentials = true;

var rm = require('rimraf');

///------------define------
const dbUsers = require("./database/models/users")
const Session = require("./session")



//--------------------test



function cookieFromJson(jsonCookie) {
    let _arr = []
    for (let _elem of jsonCookie) {
        _arr.push(`${_elem['name']} = ${_elem['value']}`)
    }
    let _cookieStr = _arr.join(";")

    return _cookieStr
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


class Framework {
    constructor(client, page) {
        this.client = client
        this.page = page
    }

    static async build() {



        return new Framework(_client, _page)
    }
    async handlArgvs() {
        let args = process.argv.splice(2)


        try {
            switch (args[0]) {
                case "--run":
                case "-r":
                    await this.run()
                    break
                case "--add":
                case "-a":
                    await this.addUser()
                    break
                case "--delete":
                case "-d":
                    await this.deleteUser(args[1])
                    break
                case "--list":
                case "-l":
                    await this.listUsers()
                    break
                case "--help":
                case "-h":
                    showHelp()
                    break
                default:
                    await this.run()

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
                articleLinkPos: elem["articleLinkPos"],
                cookies: elem["cookie"]
            }
        })
        // console.log(_dis);
        return _all
    }
    async run() {

        let users = await this.getUsers()
        for (let user of users) {

            let _rlt = await this.getUserInfo(user.cookies)
            if (_rlt) {
                let _session = await Session.build(user)

                let _current = await _session.getCurrentScores()
                console.log(_current)
                let _aLinkGen = this.getArticleLinks(this, user)
                await _session.readArticle(_aLinkGen)
                let _vLinkGen = this.getVideoLinks(this)
                await _session.watchVideo(_vLinkGen)

                console.log(`【${user.realname}】学习任务完成`);
                await _session.terminate()

            } else {
                this.deleteUser(user.userid)
                console.log("用户cookie无效或已过期,正在删除该用户");
            }
        }
    }

    async refreshQr() {
        try {
            await this.page.click("#app > div > div.layout-body > div.qrcode-box > div.ddloginbox > span")

            let _resp = await page.waitForRequest('https://login.xuexi.cn/user/qrcode/generate');
            let { success: _success } = _resp.json()
            if (_success) {
                console.log("二维码刷新成功");
                return true
            }
            console.log("二维码刷新失败");
            return false
        } catch (e) {
            console.log("二维码刷新失败 " + e.message);
            return false
        }
    }

    getArticleLinks = async function* (that, user) {
        let _url = "https://www.xuexi.cn/c06bf4acc7eef6ef0a560328938b5771/data9a3668c13f6e303932b5e0e100fc248b.js"
        let _resp = await axios.get(_url)

        let pattn = /(?<=\"static_page_url\":\")(.+?)(?=\")/g
        let _links = _resp.data.match(pattn)

        if (!_links) { return null }

        let _pos = await that.readArticleLinkIndex(user)
        if (!_pos) { _pos = 0 }


        for (let _p = _pos; _p < _links.length; _p++) {

            that.saveArticleLinkIndex(_p, user)

            let _url = _links[_p]
            yield _url
        }

    }

    getVideoLinks = async function* () {
        let _url = "https://www.xuexi.cn/lgdata/4426aa87b0b64ac671c96379a3a8bd26/db086044562a57b441c24f2af1c8e101.json"
        let { data: { DataSet: _dataSet } } = await axios.get(_url)

        // _dataSet = _resp["DataSet"]
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

    async saveArticleLinkIndex(pos, user) {
        await dbUsers.update({
            "articleLinkPos": pos
        }, {
            "where": {
                "userid": user.userid
            }
        })
    }

    async readArticleLinkIndex(user) {
        let { articleLinkPos: _pos } = await dbUsers.findOne(
            {
                "attributes": ["articleLinkPos"],
                "where": {
                    "userid": user.userid
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

    async listUsers() {

        let _users = await dbUsers.findAll()
        let _dis = _users.map((elem) => {
            return {
                userid: elem["userid"],
                realname: elem["realname"]
            }
        })
        console.log(_dis);
    }
    async addUser() {

        let _userdir = `./profiles/temp`
        rm(_userdir, () => {
            console.log("清理临时用户文件夹");
        })///删除chrome的用户数据文件夹，避免数据残留

        let _client = await puppy.launch({
            executablePath: 'D:/Chrome/Application/chrome.exe',
            userDataDir: _userdir,
            headless: false,
            ignoreDefaultArgs: ['--enable-automation']
        })
        let _page = await _client.newPage();
        ///关闭waitFor系列函数的默认超时设定
        await _page.setDefaultNavigationTimeout(0);

        await _page.goto("https://pc.xuexi.cn/points/login.html")

        while (_page.url().startsWith("https://pc.xuexi.cn/points/login.html")) {
            try {
                let resp = await _page.waitForResponse('https://login.xuexi.cn/login/login_with_qr',
                    { timeout: 10000 });
                let { success: _success } = resp.json()
                if (!_success) {
                    console.log("等待扫码");
                } else {
                    break
                }
            } catch (e) {
                console.log(e.message);
                this.refreshQr()
                console.log(_client)
            }
        }
        while (_page.url() == "https://pc.xuexi.cn/points/my-study.html") {
            try {
                // await _page.waitForResponse('https://pc-api.xuexi.cn/open/api/auth/check', { timeout: 10000 });

                let _cookies = await _page.cookies()
                if (!valid(_cookies)) { continue }

                let { userid: _userid, realname: _realname } = await this.getUserInfo(_cookies)

                await this.saveUser(_userid, _realname, _cookies)
                break

            } catch (e) {
                console.log(e.message);
            }
        }

        console.log("-------------");

        rm(_userdir, () => {
            console.log("清理临时用户文件夹");
        })///删除chrome的用户数据文件夹，避免数据残留
        await _client.close()




        //------------local func---------------------------
        function valid(cookies) {
            let _arr = cookies.map((elem) => {
                return elem.name
            })
            if (_arr.includes("token")) {
                return true
            } else {
                return false
            }
        }

    }


    async saveUser(userid, realname, cookies) {

        // await dbUsers.bulkCreate(
        //     [{
        //         userid: userid,
        //         realname: realname,
        //         cookie: cookies
        //     }]
        //     , {
        //         updateOnDuplicate: ["realname", "cookie"]
        //     }
        // )

    }
    async getUserInfo(cookies) {
        try {

            let _cookieStr = cookieFromJson(cookies)
            let _url = "https://pc-api.xuexi.cn/open/api/user/info"
            // let { data: { data: { uid: _userid } } } = await axios.get(_url,
            // let _abc = await axios.get(_url,
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
            console.log("get_score 获取失败" + e.message)
            return null
        }
    }


}

///--------------------------------


(async () => {
    let frame = new Framework()
    await frame.handlArgvs()

})()