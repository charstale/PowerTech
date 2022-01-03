
require("./yoyoLog")

const puppy = require('puppeteer-core');
const Events = require("events")
const ToolBox = require("./tools")
const Bridge = require("./bridge")
const fs = require("fs")

const pickle = require("./pickle")
var rm = require('rimraf');
const { v4: uuidv4 } = require('uuid');
const { sleep } = require("./tools");

const CHROMEPATH = 'D:/Chrome/Application/chrome.exe'

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

class Session extends Events {

    constructor(user, client, page, userdir) {
        super()
        this.user = user
        this.client = client
        this.page = page
        this.userdir = userdir

        this.score = null

        this.dbBridge = new Bridge()
    }



    static async build(user) {
        // let _cookies = user.cookies
        let _user = user
        let _userdir = `./profiles/${uuidv4()}`
        let _client = await puppy.launch({
            executablePath: CHROMEPATH,
            userDataDir: _userdir,
            headless: false,
            args: ['--mute-audio', '--window-size=1600,900', '--app=https://www.xuexi.cn/notFound.html'],
            defaultViewport: {
                width: 1600,
                height: 900
            },
            ignoreDefaultArgs: ['--enable-automation']
        })
        let _pages = await _client.pages();
        let _page = _pages[0]
        ///关闭waitFor系列函数的默认超时设定


        await _page.setCookie(...user.cookie)
        // await _page.setDefaultNavigationTimeout(0);

        // await _page.goto("https://pc.xuexi.cn/points/login.html?ref=https%3A%2F%2Fwww.xuexi.cn%2F")

        return new Session(_user, _client, _page, _userdir)
    }

    static async buildLogin() {

        let _userdir = `./profiles/${uuidv4()}`

        let _client = await puppy.launch({
            executablePath: CHROMEPATH,
            userDataDir: _userdir,
            args: ['--mute-audio', '--app=https://www.xuexi.cn/notFound.html'],

            headless: false,
            ignoreDefaultArgs: ['--enable-automation']
        })
        let _pages = await _client.pages()
        let _page = _pages[0]


        return new Session(null, _client, _page, _userdir)
    }

    async setUser(user) {
        this.user = user
    }

    async readArticle() {
        console.log("处理文章");
        let _aLinkGen = Bridge.generateLink(0)
        // let _cookies = this.user.cookie
        if (!this.score) { this.score = await ToolBox.getCurrentScores(this.user.cookie) }
        console.log(this.score);
        if (this.score.article["currentScore"] >= this.score.article["dayMaxScore"]) {
            console.log("文章分数已满")
            return
        }
        // this.score = null

        let _num = this.score.article["dayMaxScore"] - this.score.article["currentScore"]
        for (let _c = _num; _c > 0; _c = Math.floor(_c / 2)) {

            for (let _x = _c; _x > 0; _x--) {

                let { value: _target } = await _aLinkGen.next()

                // if (!await ToolBox.isValidItem(_itemId)) { _x += 1
                //     continue
                // }

                // let _target = `https://www.xuexi.cn/lgpage/detail/index.html?id=${_itemId}&item_id=${_itemId}`
                let _resp = await this.page.goto(_target)
                // if (_resp._status == 404) {
                //     continue
                // }

                await ToolBox.sleep(1500)

                // if (this.page.url().indexOf("notFound") >= 0) { continue }

                let _readTime = 65 + Math.floor(Math.random() * 35)
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


            this.score = await ToolBox.getCurrentScores(this.user.cookie)
            console.log(this.score)
            if (this.score.article["currentScore"] == this.score.article["dayMaxScore"]) {

                console.log("文章分数已满")
                break
            }
            // _num = Math.ceil(_num / 2)
        }
        // return _index
        console.log("文章处理完毕");
        this.user.cookie = await this.getCookie()
    }


    async watchVideo() {

        console.log("处理视频");
        let _vLinkGen = Bridge.generateLink(1)

        // let _cookies = this.user.cookie
        if (!this.score) { this.score = await ToolBox.getCurrentScores(this.user.cookie) }
        console.log(this.score);
        if ((this.score["videoCum"]["currentScore"] >= this.score["videoCum"]["dayMaxScore"]) & (this.score["videoSus"]["currentScore"] >= this.score["videoSus"]["dayMaxScore"])) {
            console.log("视频分数已满,退出视频操作 ")
            return
        }



        let _num = this.score["videoCum"]["dayMaxScore"] - this.score["videoCum"]["currentScore"]

        for (let _c = _num; _c > 0; _c = Math.floor(_c / 2)) {

            for (let _x = _c; _x > 0; _x--) {
                let { value: _target } = await _vLinkGen.next()

                // if (!await ToolBox.isValidItem(_itemId)) {
                //     _x += 1
                //     continue
                // }
                // let _target = `https://www.xuexi.cn/lgpage/detail/index.html?id=${_itemId}&item_id=${_itemId}`
                await this.page.goto(_target)
                await ToolBox.sleep(1500)
                let _readTime = 65 + Math.floor(Math.random() * 35)

                await this.page.evaluate(() => {
                    window.scrollTo(0, 400)
                })

                await this.page.click(".prism-big-play-btn").catch(() => {
                    console.log("播放按钮不存在,视频正在播放");
                })

                await ToolBox.sleep(_readTime * 1000)
            }

            this.score = await ToolBox.getCurrentScores(this.user.cookie)
            console.log(this.score)

            if (this.score["videoCum"]["currentScore"] >= this.score["videoCum"]["dayMaxScore"]) {
                console.log("视频数量分数已满")
            }
            if (this.score["videoSus"]["currentScore"] >= this.score["videoSus"]["dayMaxScore"]) {
                console.log("视频时间分数已满")
            }

            if ((this.score["videoCum"]["currentScore"] >= this.score["videoCum"]["dayMaxScore"]) & (this.score["videoSus"]["currentScore"] >= this.score["videoSus"]["dayMaxScore"])) {
                console.log("视频分数已满,退出视频操作 ")
                break
            }
        }
        console.log("视频处理结束");
        this.user.cookie = await this.getCookie()
    }


    async handled() {


        let _chosen = await this.page.$$eval('.chosen', (opts) => {
            console.log(opts);

            for (let opt of opts) {
                if (opt) { return true }
            }
            return false
        }).catch((e) => {
            ///目前是填空题，没有选项
            console.log(e.message);
        })

        let _blank = await this.page.$$eval(".blank", (blanks) => {

            console.log(blanks);
            for (let blank of blanks) {

                if (blank.value != "") { return true }
            }
            return false

        }).catch((e) => {
            ///目前是选择题，没有填空
            console.log(e.message);
        })



        return Boolean(_chosen || _blank)


    }
    async quiz(data) {


        if (!this.score) { this.score = await ToolBox.getCurrentScores(this.user.cookie) }
        console.log(this.score);
        if (this.score[data.title]["currentScore"] > 0) {
            console.log("分数已满，退出")
            return
        }
        this.score = null


        let _loaded = false
        this.page.goto(data.practiceUrl).then(() => { _loaded = true })

        let _answers = await data.answerFunc.call(this, data.answerUrl)


        console.log("---");
        console.log(_answers);
        console.log("---");

        if (!_answers) { return }

        await ToolBox.sleep(2000)

        while (!_loaded) {///确保页面加载完成
            await ToolBox.sleep(1000)
        }

        await this.page.click(".block").catch((e) => { console.log("不能进行题目页面选择"); })///点击专项答题的第一页
        for (let _an of _answers) {

            if (!await this.handled()) {

                // await ToolBox.sleep(10 * 1000)///等待题目页面加载完毕

                // console.log(_an[0]);
                if ("ABCD".indexOf(_an[0]) != -1) {
                    console.log("选择题--");
                    let _options = await this.page.$$(".q-answer.choosable")
                    for (let _c of _an) {
                        console.log(" ", _c);
                        let _i = "ABCD".indexOf(_c)
                        await _options[_i].click()
                        await ToolBox.sleep(500)
                    }

                } else if (_an[0] != null) {
                    console.log("填空题--");
                    let _blanks = await this.page.$$(".blank")

                    try {
                        for (let _i in _an) {
                            // await _blanks[_i].click()
                            console.log(" ", _an[_i]);
                            await _blanks[_i].type(_an[_i], { delay: 200 })
                            await ToolBox.sleep(300)
                        }
                    } catch (e) {
                        console.log(e.message);
                        continue
                    }

                }

            }
            await ToolBox.sleep(1500)
            let _btnNext = await this.page.$(".next-btn")

            let _isDisabled = await this.page.$eval('.next-btn', (button) => {
                return button.disabled;
            });
            if (!_isDisabled) {
                await _btnNext.click()
                await ToolBox.sleep(10 * 1000)///等待题目页面加载完毕
                // await this.page.waitForNavigation()
            }
        }
        let _btnSubmit = await this.page.$(".submit-btn");
        if (_btnSubmit) {
            _btnSubmit.click()


        }

        await ToolBox.sleep(10 * 1000)

    }
    async quizDaily() {

        console.log("处理每日答题");
        let _data = {
            title: "quizDaily",
            practiceUrl: "https://pc.xuexi.cn/points/exam-practice.html",
            answerUrl: "https://pc-proxy-api.xuexi.cn/api/exam/service/common/deduplicateRandomSearchV3?limit=5&activityCode=QUIZ_ALL&forced=true",
            answerFunc: this.getAnswers
        }

        await this.quiz(_data)


    }
    async quizWeek() {

        console.log("处理每周答题");
        let _wPracticeGen = ToolBox.getWeekPractices(this.user.cookie)
        let { value: _practice } = await _wPracticeGen.next()
        let _id = _practice.id


        let _data = {
            title: "quizWeekly",
            practiceUrl: `https://pc.xuexi.cn/points/exam-weekly-detail.html?id=${_id}`,
            answerUrl: `https://pc-proxy-api.xuexi.cn/api/exam/service/detail/queryV3?type=2&id=${_id}&forced=true`,
            answerFunc: this.getAnswers
        }
        await this.quiz(_data)

    }
    async quizEarmarked() {
        // await this.page.goto("https://pc.xuexi.cn/points/my-points.html")

        console.log("处理专项答题");

        try {
            let _wPracticeGen = ToolBox.getEarmrkedPractices(this.user.cookie)
            let { value: _practice } = await _wPracticeGen.next()
            let _id = _practice.id

            let _data = {
                title: "quizEarmarked",
                practiceUrl: `https://pc.xuexi.cn/points/exam-paper-detail.html?id=${_id}`,
                answerUrl: `https://pc-proxy-api.xuexi.cn/api/exam/service/detail/queryV3?type=1&id=${_id}&forced=true`,
                answerFunc: this.getEarmarkedAnswers
            }
            await this.quiz(_data)
        } catch (e) {
            console.log(e.message);
        }


        await ToolBox.sleep(10 * 1000)
    }
    async getAnswers(url) {

        for (let w = 5; w > 0; w--) {
            try {
                let resp = await this.page.waitForResponse(url, { timeout: 20 * 1000 });
                if (resp.request().method() != "GET") {
                    // console.log("option 请求，跳过");
                    continue
                }
                let { data_str: _encodeStr } = await resp.json()
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
                        throw new Error("null in answer")
                    }
                }

                return _answers
            } catch (e) {

                console.log(e.message);
                // this.page.reload()

                // await ToolBox.sleep(1000)
                // throw new Error("acquire answers failed")
                return null
            }
        }

        // throw new Error("cant get answers")
        return null

    }

    async getEarmarkedAnswers(url) {


        for (let w = 5; w > 0; w--) {
            try {
                let resp = await this.page.waitForResponse(url, { timeout: 20 * 1000 });
                if (resp.request().method() != "GET") {
                    // console.log("option 请求，跳过");
                    continue
                }
                let { data_str: _encodeStr } = await resp.json()
                let { questions: _questions } = pickle.loadBase64(_encodeStr)

                let _answers = []
                for (let _question of _questions) {


                    let pattn = /(?<=">)(.+?)(?=<)/g
                    let _correct = _question.questionDesc.match(pattn)

                    let _blanks = _question["answers"]
                    let _options = _question["answers"]

                    let _answer = []

                    if (_blanks[0]["content"] == "") {
                        for (let _i = 0; _i < _blanks.length; _i++) {
                            _answer.push(_correct[_i])
                        }
                    } else {
                        for (let _o of _options) {
                            if (_correct.indexOf(_o["content"]) != -1) {
                                _answer.push(_o["label"])
                            }
                        }
                    }

                    if (_answer.length == 0) { _answer.push("A") }
                    _answers.push(_answer)
                }

                return _answers
            } catch (e) {

                console.log(e.message);
                // throw new Error("acquire answers failed")
                return null
            }
        }

        // throw new Error("cant get answers")
        return null

    }

    async terminate(processed) {


        if (processed) {
            let _todayScore = await ToolBox.getTodayScore(this.user.cookie)
            if (_todayScore >= 0) {
                ToolBox.sendTelegramMessage(`【${this.user.realname}】今日分数${_todayScore}`)
                this.dbBridge.saveScore(this.user.userid, { value: _todayScore, timestamp: Date.now() })
            }

        }



        console.log("结束会话");

        await this.client.close()
        rm(this.userdir, () => {
            // console.log("用户文件夹已删除");
        })///删除chrome的用户数据文件夹，避免数据残留



        console.log("************************************");
    }
    async getCookie() {
        let _cookies = await this.page.cookies()
        if (valid(_cookies)) {
            // return _cookies

            // this.emit("evt_got_cookie", _cookies)  ///cookie存数据库

            return _cookies
        }


    }



    async try2Login(timeout = 30000) {

        let _wait = true

        this.page.on('response', async (_resp) => {
            let _url = _resp.url()
            // if (_url.startsWith('https://login.xuexi.cn/login/xuexiWeb')) {
            //     let _state = parseState(_url)
            //     this.emit("evt_got_state", _state)
            // }

            if (_url == "https://login.xuexi.cn/user/qrcode/generate") {
                let { result: _qrcode } = await _resp.json()

                this.emit("evt_got_qrcode", _qrcode)
            }

            if (_url.startsWith('https://pc-api.xuexi.cn/open/api/auth/check')) {
                // console.log("更新cookie");
                let _cookies = await this.page.cookies()
                if (valid(_cookies)) {
                    this.emit("evt_got_cookie", _cookies)  ///cookie存数据库
                }
                this.page.off("response")//接触绑定
                _wait = false
                console.log("cookie获取成功");
                await ToolBox.sleep(5000)///等待抓取cookie
            }
        });

        await this.page.goto("https://pc.xuexi.cn/points/login.html")
        // await sleep(timeout)

        let _count = 0
        while (_wait) {
            await sleep(1000)
            _count += 1000
            if (_count >= timeout) {
                console.log("等待超时");
                throw new Error("login timeout")
                break
            }
            // console.log("zzzzzz~");
        }

        //------------local func---------------------------


        async function refreshQr() {
            try {
                _page.click("#app > div > div.layout-body > div.qrcode-box > div.ddloginbox > span")

                let _resp = await _page.waitForResponse('https://login.xuexi.cn/user/qrcode/generate', { timeout: 10 * 1000 });
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



        function parseState(url) {
            let _pattn = /(?<=state=).+?(?=(&|$))/
            let _rlt = url.match(_pattn)
            let _state = _rlt[0]

            return _state
        }
    }

    async run() {

        console.log("=========================================");

        let _remains = ToolBox.parseExpires(this.user.cookie)
        console.log(`剩余${_remains}小时`);
        if (_remains < 0) {
            console.log("用户cookie无效或已过期,请重新登陆");
            this.dbBridge.deleteUser(this.user.userid)
            return false
        }



        let _today = new Date(new Date().toLocaleDateString()).getTime()
        let _score = await this.dbBridge.loadScore(this.user.userid)

        if ((_score) && (_score.value > 40) && (_score.timestamp > _today)) {

            console.log(`【${this.user.realname}】的分数为${_score.value},今日无需再学习`);
            return false
        }

        // _session.score = await ToolBox.getCurrentScores(user.cookie)

        console.log(`【${this.user.realname}】开始学习`);
        console.log("-----------------------------------------------");
        this.on("evt_got_cookie", cbSaveCookie)

        await this.quizDaily().catch((e) => { console.log("每日答题异常"); })
        await this.quizWeek().catch((e) => { console.log("每周答题异常"); })
        await this.quizEarmarked().catch((e) => { console.log("专项答题异常"); })
        await this.readArticle().catch((e) => { console.log("处理文章异常"); })
        await this.watchVideo().catch((e) => { console.log("处理视频异常"); })

        console.log("-----------------------------------------------");

        this.off('evt_got_cookie', cbSaveCookie)

        return true

        function cbSaveCookie(cookies) {
            if (cookies) {
                this.dbBridge.updateCookie(this.user.userid, cookies)
            }
        }
    }
}




module.exports = Session;