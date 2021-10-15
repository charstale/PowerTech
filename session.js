const puppy = require('puppeteer-core');
const axios = require("axios")
axios.defaults.withCredentials = true
// const fs = require("fs")
// const dbCookie = require("./database/models/cookie")
// const dbResource = require("./database/models/resource")
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function cookieFromJson(jsonCookie) {
    let _arr = []
    for (let _elem of jsonCookie) {
        _arr.push(`${_elem['name']} = ${_elem['value']}`)
    }
    let _cookieStr = _arr.join(";")

    return _cookieStr
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



    async getUserInfo() {
        try {

            let _cookieStr = cookieFromJson(this.user.cookies)
            let _url = "https://pc-api.xuexi.cn/open/api/user/info"
            // let { data: { data: { uid: _userid } } } = await axios.get(_url,
            // let _abc = await axios.get(_url,
            let { data: { data: { nick: _username, uid: _userid } } } = await axios.get(_url,

                {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Cookie': _cookieStr
                    }
                })



            return {
                username: _username,
                userid: _userid
            }

            // return _total
        } catch (e) {
            console.log("get_score 获取失败" + e.message)
        }
    }


    async getTotalScore() {
        try {

            let _cookieStr = cookieFromJson(this.user.cookies)
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
            console.log("get_score 获取失败" + e.message)
        }
    }
    async getTodayScore() {
        try {

            let _cookieStr = cookieFromJson(this.user.cookies)
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
            console.log("get_score 获取失败" + e.message)
        }
    }
    async getCurrentScores() {
        while (true) {
            try {

                let _cookieStr = cookieFromJson(this.user.cookies)
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
                console.log("获取分数详情失败，停1秒");
                await sleep(1000)
            }
        }
    }

    async readArticle(linkGen) {
        for await (let _url of linkGen) {

            let _current = await this.getCurrentScores()
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
            await this.page.goto(_url)
            await sleep(1500)
            let _readTime = 65 + Math.floor(Math.random() * 35)
            // let _maxScrollTimes=2+Math.floor(Math.random()*4)
            let _ypos = 400

            let _maxScrollPos = await this.page.evaluate(() => {
                return document.body.scrollHeight - 1400
            })

            let _count = 0
            while (_ypos < _maxScrollPos) {
                _count += 1
                _ypos += 100
                await this.page.evaluate((_ypos) => {

                    window.scrollTo(0, _ypos)

                }, _ypos)

                await sleep(2000)
                ///剩余多少秒
            }

            _ypos = _maxScrollPos * 3 / 4
            await this.page.evaluate((_ypos) => {
                window.scrollTo(0, _ypos)
            }, _ypos)
            await sleep((_readTime - _count * 2) * 1000)


        }
    }

    async watchVideo(linkGen) {
        // let _links_gen = this.getVideoLinks()
        for await (let _url of linkGen) {
            let _current = await this.getCurrentScores()
            console.log(_current);
            if (_current["videoCum"] >= Scorelimit["videoCum"]) {

                console.log("视频数量分数已满")
            }
            if (_current["videoSus"] >= Scorelimit["videoSus"]) {

                console.log("视频时间分数已满")
            }

            if ((_current["videoCum"] >= Scorelimit["videoCum"]) & (_current["videoSus"] >= Scorelimit["videoSus"])) {

                console.log("检测到视频分数已满,退出视频操作 ")
                break
            }
            await this.page.goto(_url)
            await sleep(1000)
            let _readTime = 65 + Math.floor(Math.random() * 35)

            let _ypos = 400
            await this.page.evaluate((_ypos) => {
                window.scrollTo(0, _ypos)
            }, _ypos)
            await sleep(_readTime * 1000)



        }
    }


    // async watchTask() {
    //     // this.readArticle()
    //     this.watchVideo()
    // }


    // quizeTask() {


    // }


    // async runXuexi() {
    //     let _current = await this.getCurrentScores()
    //     console.log(_current)
    //     await this.watchTask();
    //     // await this.quizeTask();
    // }
    async terminate() {
        console.log("浏览器关闭");
        await this.client.close()
        rm(this.userdir, () => {
            console.log("用户文件夹已删除");
        })///删除chrome的用户数据文件夹，避免数据残留
    }
    async run() {


        await this.runXuexi()






        // await this.getTotalScore();
        // await this.getTodayScore();
        // await this.getDetailScore();
        // await this.getUserInfo();



        // await client.close()
        // 
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