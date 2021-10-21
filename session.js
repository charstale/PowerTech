const puppy = require('puppeteer-core');
const Events = require("events")
const ToolBox = require("./tools")
const fs = require("fs")

const pickle = require("pickle")
var rm = require('rimraf');
const { v4: uuidv4 } = require('uuid');




// const Scorelimit = {
//     articleCum: 6,  /// 阅读文章
//     videoCum: 6,  /// 观看视频
//     articleSus: 6,  /// 文章时长
//     videoSus: 6,  /// 视频时长
//     login: 1,  /// 每日登陆
//     quizDaily: 5,  /// 每日答题
//     quizWeekly: 5,  /// 每周答题
//     quizEarmarked: 10, /// 专项答题
// }


class Session extends Events {

    constructor(user, client, page, userdir) {
        super()
        this.user = user
        this.client = client
        this.page = page
        this.userdir = userdir





        this.page.on('response', async (_resp) => {

            if (_resp.url().startsWith('https://pc-api.xuexi.cn/open/api/auth/check')) {
                // console.log("更新cookie");
                let _cookies = await this.page.cookies()
                // let _remains = ToolBox.parseExpires(_cookies)
                // console.log(`剩余${_remains}小时`);

                this.user.cookies = _cookies  ///更新当前对象cookie
                this.emit("evt_cookies_updated", _cookies)  ///cookie存数据库

            }
        });



        // this.page.on('dialog', async dialog => {
        //     console.log(dialog.message());
        //     await dialog.dismiss();
        // });
    }



    static async build(user) {
        // let _cookies = user.cookies
        let _user = user
        let _userdir = `./profiles/${uuidv4()}`
        let _client = await puppy.launch({
            executablePath: 'D:/Chrome/Application/chrome.exe',
            userDataDir: _userdir,
            headless: false,
            args: ['--mute-audio', '--app=https://pc.xuexi.cn/points/my-points.html'],
            ignoreDefaultArgs: ['--enable-automation']
        })
        let _pages = await _client.pages();
        let _page = _pages[0]
        ///关闭waitFor系列函数的默认超时设定

        await _page.setCookie(..._user.cookies)
        await _page.setDefaultNavigationTimeout(0);

        ///刷新cookie有效时间
        // await _page.goto("https://pc.xuexi.cn/points/my-points.html")

        return new Session(_user, _client, _page, _userdir)
    }




    async readArticle(lnkIndex) {
        let _aLinkGen = ToolBox.getArticleLinks(lnkIndex)


        while (true) {
            let _num = 6
            let _current = await ToolBox.getCurrentScores(this.user.cookies)

            console.log(_current)
            if (_current.article["currentScore"] >= _current.article["dayMaxScore"]) {

                console.log("文章分数已满")
                break
            }



            // for await (let _link of _aLinkGen) {
            // let _link = 0
            for (let _x = _num; _x > 0; _x--) {

                let _link = await _aLinkGen.next()

                this.emit("evt_alnindex_updated", _link.value["pos"])
                await this.page.goto(_link.value["url"])
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
        }
        // return _index

    }


    async watchVideo() {

        let _vLinkGen = ToolBox.getVideoLinks()

        while (true) {
            let _num = 6
            let _current = await ToolBox.getCurrentScores(this.user.cookies)

            console.log(_current)

            if (_current["videoCum"]["currentScore"] >= _current["videoCum"]["dayMaxScore"]) {

                console.log("视频数量分数已满")
            }
            if (_current["videoSus"]["currentScore"] >= _current["videoSus"]["dayMaxScore"]) {

                console.log("视频时间分数已满")
            }

            if ((_current["videoCum"]["currentScore"] >= _current["videoCum"]["dayMaxScore"]) & (_current["videoSus"]["currentScore"] >= _current["videoSus"]["dayMaxScore"])) {
                console.log("视频分数已满,退出视频操作 ")
                break
            }

            for (let _x = _num; _x > 0; _x--) {

                let _link = await _vLinkGen.next()

                await this.page.goto(_link.value)
                await ToolBox.sleep(1000)
                let _readTime = 65 + Math.floor(Math.random() * 35)

                await this.page.evaluate(() => {
                    window.scrollTo(0, 400)
                })
                await ToolBox.sleep(_readTime * 1000)
            }
        }
    }

    async quizDaily() {

        let _current = await ToolBox.getCurrentScores(this.user.cookies)
        if (_current["quizDaily"]["currentScore"] >= _current["quizDaily"]["dayMaxScore"]) {

            console.log("每日答题分数已满，退出每日答题")
            return
        }

        if (this.page.url() != "https://pc.xuexi.cn/points/my-points.html") {

            await this.page.goto("https://pc.xuexi.cn/points/my-points.html")
            await ToolBox.sleep(2000)
        }

        // await this.page.waitForSelector("#app > div > div.layout-body > div > div.my-points-section > div.my-points-content > div:nth-child(5) > div.my-points-card-footer > div.buttonbox > div")

        // await this.page.click("#app > div > div.layout-body > div > div.my-points-section > div.my-points-content > div:nth-child(5) > div.my-points-card-footer > div.buttonbox > div")

        this.page.goto("https://pc.xuexi.cn/points/exam-practice.html")

        let _url = "https://pc-proxy-api.xuexi.cn/api/exam/service/common/deduplicateRandomSearchV3?limit=5&activityCode=QUIZ_ALL&forced=true"
        let _answers = await this.getAnswers(_url)

        await ToolBox.sleep(5000)
        for (let _an of _answers) {
            // if(_an[0] in "ABCD"){

            await ToolBox.sleep(10 * 1000)


            if ("ABCD".indexOf(_an[0]) != -1) {
                console.log("选择题");

                for (let _s of _an) {

                    let _i = "ABCD".indexOf(_s) + 1
                    await this.page.click(`#app > div > div.layout-body > div > div.detail-body > div.question > div.q-answers > div:nth-child(${_i})`)
                    await ToolBox.sleep(500)
                }

            } else if (_an[0] != null) {
                console.log("填空题");
                await this.page.type('#app > div > div.layout-body > div > div.detail-body > div.question > div.q-body > div > input', _an[0], { delay: 200 });
                await ToolBox.sleep(300)
            }

            await ToolBox.sleep(2000)
            await this.page.click("#app > div > div.layout-body > div > div.detail-body > div.action-row > button")
        }

        await ToolBox.sleep(10 * 1000)

    }


    async getAnswers(url) {


        // while (true) {
        for (let w = 5; w > 0; w--) {
            try {
                let resp = await this.page.waitForResponse(url, { timeout: 20 * 1000 });
                if (resp.request().method() != "GET") {
                    console.log("option 请求，跳过");
                    continue
                }
                let { data_str: _encodeStr } = await resp.json()
                // let _decodeStr = new Buffer.from(_encodeStr, 'base64').toString();
                let { questions: _questions } = pickle.loadBase64(_encodeStr)

                let _answers = []
                for (let _question of _questions) {

                    let _answer = _question["correct"].map((elem) => {
                        return elem["value"]
                    })

                    _answers.push(_answer)
                }

                for (let _an of _answers) {
                    if (!_an[0]) {
                        throw new erro("null in answer")
                    }
                }

                return _answers
            } catch (e) {
                // if (e.message == "Protocol error (Network.getResponseBody): No resource with given identifier found") {
                //     console.log("option 请求，跳过");
                //     continue 
                // }
                console.log(e.message);
                // this.page.goto("about:blank")
                this.page.reload()

                // await ToolBox.sleep(1000)
            }
        }

        throw new error("cant get answers")

    }

    async quizWeek() {

        let _wPracticeGen = ToolBox.getWeekPractices(this.user.cookies)

        let { value: _practice } = await _wPracticeGen.next()

        let _id = _practice.id
        this.page.goto(`https://pc.xuexi.cn/points/exam-weekly-detail.html?id=${_id}`)

        let _url = `https://pc-proxy-api.xuexi.cn/api/exam/service/detail/queryV3?type=2&id=${_id}&forced=true`
        let _answers = await this.getAnswers(_url)

        await ToolBox.sleep(5000)
        for (let _an of _answers) {

            await ToolBox.sleep(10 * 1000)


            if ("ABCD".indexOf(_an[0]) != -1) {
                console.log("选择题");

                for (let _s of _an) {

                    let _i = "ABCD".indexOf(_s) + 1
                    await this.page.click(`#app > div > div.layout-body > div > div.detail-body > div.question > div.q-answers > div:nth-child(${_i})`)
                    await ToolBox.sleep(500)
                }

            } else if (_an[0] != null) {
                console.log("填空题");
                await this.page.type('#app > div > div.layout-body > div > div.detail-body > div.question > div.q-body > div > input', _an[0], { delay: 200 });
                await ToolBox.sleep(300)
            }

            await ToolBox.sleep(2000)
            await this.page.click("#app > div > div.layout-body > div > div.detail-body > div.action-row > button")
        }

        await ToolBox.sleep(10 * 1000)

    }
    async quizEarmarked() {

        let _wPracticeGen = ToolBox.getWeekPractices(this.user.cookies)

        let { value: _practice } = await _wPracticeGen.next()

        let _id = _practice.id
        this.page.goto(`https://pc.xuexi.cn/points/exam-paper-detail.html?id=${_id}`)

        let _url = `https://pc-proxy-api.xuexi.cn/api/exam/service/detail/queryV3?type=1&id=${_id}&forced=true`
        let _answers = await this.getAnswers(_url)

        await ToolBox.sleep(5000)
        for (let _an of _answers) {

            await ToolBox.sleep(10 * 1000)
            if ("ABCD".indexOf(_an[0]) != -1) {
                console.log("选择题");

                for (let _s of _an) {

                    let _i = "ABCD".indexOf(_s) + 1
                    await this.page.click(`#app > div > div.layout-body > div > div.detail-body > div.question > div.q-answers > div:nth-child(${_i})`)
                    await ToolBox.sleep(500)
                }

            } else if (_an[0] != null) {
                console.log("填空题");
                await this.page.type('#app > div > div.layout-body > div > div.detail-body > div.question > div.q-body > div > input', _an[0], { delay: 200 });
                await ToolBox.sleep(300)
            }

            await ToolBox.sleep(2000)
            await this.page.click("#app > div > div.layout-body > div > div.detail-body > div.action-row > button")
        }

        await ToolBox.sleep(10 * 1000)

    }
    async terminate() {
        console.log("浏览器关闭");
        await this.client.close()
        rm(this.userdir, () => {
            // console.log("用户文件夹已删除");
        })///删除chrome的用户数据文件夹，避免数据残留
    }
    async getCookies() {
        let _cookies = await this.page.cookies()
        return _cookies

    }



    static async login() {
        let _userdir = `./profiles/temp`
        rm(_userdir, () => {
            console.log("清理临时用户文件夹");
        })///删除chrome的用户数据文件夹，避免数据残留

        let _client = await puppy.launch({
            executablePath: 'D:/Chrome/Application/chrome.exe',
            userDataDir: _userdir,
            args: ['--mute-audio', '--window-size=900,400', '--app=https://www.xuexi.cn/notFound.html'],
            defaultViewport: {
                width: 900,
                height: 400
            },
            headless: false,
            ignoreDefaultArgs: ['--enable-automation']
        })
        ///打开新页面
        // let _page = await _client.newPage();
        //使用浏览器打开后的第一个页面
        let _pages = await _client.pages()
        let _page = _pages[0]
        ///关闭waitFor系列函数的默认超时设定
        _page.setDefaultNavigationTimeout(0);


        _page.setRequestInterception(true)
        let _js = fs.readFileSync("./resource/body.txt", "utf-8")
        let _css = fs.readFileSync("./resource/style.css", "utf-8")

        ///TODO：直接优化login.html页面
        _page.on("request", (_req) => {
            // _req.continue()
            if ((_js) && (_req.url() == "https://pc.xuexi.cn/points/study-login/login.a3b117f8.js")) {

                _req.respond({
                    status: 200,
                    contentType: "application/x-javascript",
                    body: _js.toString()
                })

            } else if ((_css) && (_req.url() == "https://pc.xuexi.cn/points/study-login/login.54a08a5d.css")) {

                _req.respond({
                    status: 200,
                    contentType: "text/css; charset=utf-8",
                    body: _css.toString()
                })

            } else {
                _req.continue()
            }
        })

        // _page.on("response", resp => {
        //     console.log("------------");
        //     console.log(resp.headers());
        //     console.log("------------");
        //     console.log(resp.body());
        //     // console.log();
        // })


        await _page.goto("https://pc.xuexi.cn/points/login.html")

        //删除红旗图片
        // await _page.evaluate(() => {
        //     let elemFlag = document.getElementsByClassName("redflagbox")[0]
        //     elemFlag.remove()
        // })


        while (true) {
            // for (let _x = 4; _x > 0; _x--) {
            try {
                let resp = await _page.waitForResponse('https://login.xuexi.cn/login/login_with_qr',
                    { timeout: 10000 });
                let { success: _success } = await resp.json()
                if (!_success) {
                    console.log("等待扫码");
                } else {
                    // console.log("break");
                    break
                }
            } catch (e) {

                if (e.message == "Target closed") {
                    console.log("浏览器已关闭");
                    return null
                }

                if (_page.url().startsWith("https://pc.xuexi.cn/points/login.html")) {

                    console.log("二维码已过期，正在刷新");

                    await refreshQr()
                    // await ToolBox.sleep(1000)
                } else {
                    console.log("已跳转到无关页面，程序退出");
                    return null

                }
            }
        }

        let _cookies = null
        //  while (true) {
        for (let w = 5; w > 0; w--) {

            try {
                await _page.waitForResponse("https://pc-api.xuexi.cn/open/api/auth/check", { timeout: 5000 });
                // console.log(_resp.url());
                _cookies = await _page.cookies()
                if (valid(_cookies)) {

                    break
                }

            } catch (e) {
                console.log("验证权限失败 " + e.message);
            }
        }
        rm(_userdir, () => {
            console.log("清理临时用户文件夹");
        })///删除chrome的用户数据文件夹，避免数据残留

        await _client.close()

        return _cookies

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

        async function refreshQr() {
            try {
                _page.click("#app > div > div.layout-body > div.qrcode-box > div.ddloginbox > span")

                let _resp = await _page.waitForResponse('https://login.xuexi.cn/user/qrcode/generate');
                let { success: _success } = await _resp.json()
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
    }
}




module.exports = Session;