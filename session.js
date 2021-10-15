const puppy = require('puppeteer-core');
// const axios = require("axios")
// axios.defaults.withCredentials = true
// const fs = require("fs")
// const dbCookie = require("./database/models/cookie")
// const dbResource = require("./database/models/resource")

const ToolBox = require("./delivery")


var rm = require('rimraf');
const { v4: uuidv4 } = require('uuid');



const Scorelimit = {
    articleCum: 6,  /// 阅读文章
    videoCum: 6,  /// 观看视频
    articleSus: 6,  /// 文章时长
    videoSus: 6,  /// 视频时长
    login: 1,  /// 每日登陆
    quizDaily: 5,  /// 每日答题
    quizWeekly: 5,  /// 每周答题
    quizEarmarked: 10, /// 专项答题
}


class Session {

    constructor(user, client, page, userdir) {
        this.user = user
        this.client = client
        this.page = page
        this.userdir = userdir



        this.page.on('response', async (_resp) => {

            if (_resp.url().startsWith('https://pc-api.xuexi.cn/open/api/auth/check')) {
                console.log("更新cookie");
                let _cookies = await this.page.cookies()
                this.user.cookies = _cookies
            }
        });
    }

    static async login() {
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
                // this.refreshQr()
                console.log("二维码已过期，请刷新");
                await ToolBox.sleep(1000)
            }
        }
        while (_page.url() == "https://pc.xuexi.cn/points/my-study.html") {
            try {
                // await _page.waitForResponse('https://pc-api.xuexi.cn/open/api/auth/check', { timeout: 10000 });

                let _cookies = await _page.cookies()
                if (!valid(_cookies)) { continue }


                rm(_userdir, () => {
                    console.log("清理临时用户文件夹");
                })///删除chrome的用户数据文件夹，避免数据残留
                await _client.close()

                return _cookies

            } catch (e) {
                console.log(e.message);
            }
        }

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


    static async build(user) {
        // let _cookies = user.cookies
        let _user = user
        let _userdir = `./profiles/${uuidv4()}`
        let _client = await puppy.launch({
            executablePath: 'D:/Chrome/Application/chrome.exe',
            userDataDir: _userdir,
            headless: false,
            ignoreDefaultArgs: ['--enable-automation', '--mute-audio']
        })
        let _page = await _client.newPage();
        ///关闭waitFor系列函数的默认超时设定

        await _page.setCookie(..._user.cookies)
        await _page.setDefaultNavigationTimeout(0);


        return new Session(_user, _client, _page, _userdir)
    }




    async readArticle(linkGen) {
        let _index = 0
        for await (let _link of linkGen) {
            let _current = await ToolBox.getCurrentScores(this.user.cookies)
            console.log(_current)
            if (_current["articleCum"] >= Scorelimit["articleCum"]) {

                console.log("文章数量分数已满")
            }
            if (_current["articleSus"] >= Scorelimit["articleSus"]) {

                console.log("文章时间分数已满")
            }

            if ((_current["articleCum"] >= Scorelimit["articleCum"]) & (_current["articleSus"] >= Scorelimit["articleSus"])) {
                console.log("检测到文章分数已满,退出文章操作 ")
                break
            }

            _index = _link.pos
            await this.page.goto(_link.url)
            await ToolBox.sleep(1500)
            let _readTime = 65 + Math.floor(Math.random() * 35)
            // let _maxScrollTimes=2+Math.floor(Math.random()*4)
            let _ypos = 400

            let _maxScrollPos = await this.page.evaluate(() => {
                return document.body.scrollHeight - 1400
            })

            let _count = 0
            if (_ypos < _maxScrollPos) {
                _count += 1
                _ypos += 100
                await this.page.evaluate((_ypos) => {

                    window.scrollTo(0, _ypos)

                }, _ypos)

                await ToolBox.sleep(2000)
                ///剩余多少秒
            }

            _ypos = _maxScrollPos * 3 / 4
            await this.page.evaluate((_ypos) => {
                window.scrollTo(0, _ypos)
            }, _ypos)
            await ToolBox.sleep((_readTime - _count * 2) * 1000)

        }

        return _index

    }


    async watchVideo(linkGen) {
        for await (let _url of linkGen) {
            let _current = await ToolBox.getCurrentScores(this.user.cookies)
            console.log(_current);
            if (_current["videoCum"] >= Scorelimit["videoCum"]) {

                console.log("视频数量分数已满")
            }
            if (_current["videoSus"] >= Scorelimit["videoSus"]) {

                console.log("视频时间分数已满")
            }

            if ((_current["videoCum"] >= Scorelimit["videoCum"]) & (_current["videoSus"] >= Scorelimit["videoSus"])) {
                console.log("检测到视频分数已满,退出视频操作 ")
                // break
            }
            await this.page.goto(_url)
            await ToolBox.sleep(1000)
            let _readTime = 65 + Math.floor(Math.random() * 35)

            await this.page.evaluate(() => {
                window.scrollTo(0, 400)
            })
            await ToolBox.sleep(_readTime * 1000)
        }
    }


    async terminate() {
        console.log("浏览器关闭");
        await this.client.close()
        rm(this.userdir, () => {
            console.log("用户文件夹已删除");
        })///删除chrome的用户数据文件夹，避免数据残留
    }
    async getCookies() {
        let _cookies = await this.page.cookies()
        return _cookies

    }
}




// (async () => {
//     let session = await Session.build()
//     await session.run()
//     await session.terminate()
// })()

// foo()

// async function foo () {
//     let framework=await Frame.build()
// framework.run()
// }



module.exports = Session;