///------------define------
const Session = require("./session")
const Bridge = require("./bridge")
const ToolBox = require("./tools")


//--------------------test




class Framework {
    constructor(client, page) {
        this.client = client
        this.page = page

        this.dbBridge = new Bridge()
    }

    static async build() {
        return new Framework(_client, _page)
    }
    async main() {
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

    async run() {

        let _users = await this.dbBridge.getUsers()
        if (!_users) {
            console.log("数据库中没有用户");
            return
        }
        for (let _user of _users) {

            // let _rlt = await ToolBox.getUserInfo(_user.cookies)
            // if (_rlt) {
            console.log("=========================================");
            console.log(`【${_user.realname}】开始学习`);
            let _remains = ToolBox.parseExpires(_user.cookies)
            console.log(`剩余${_remains}小时`);
            if (_remains > 0) {
                await this.runSession(_user)

            } else {
                this.deleteUser(_user.userid)
                console.log("用户cookie无效或已过期,正在删除该用户");
            }
        }
    }

    async runSession(user) {

        let _session = await Session.build(user)
        let _cookies = await _session.getCookies()


        _session.on("evt_alnindex_updated", (index) => {
            if (index) {
                this.dbBridge.saveArticleLinkIndex(user.userid, index)
            }
        })

        _session.on("evt_cookies_updated", (cookies) => {
            if (cookies) {
                this.dbBridge.updateCookie(user.userid, cookies)
            }
        })


        let _current = await ToolBox.getCurrentScores(user.cookies)
        console.log(_current)

        ///------------------------------

        let _linkpos = await this.dbBridge.readArticleLinkIndex(user.userid)
        await _session.readArticle(_linkpos)
        await _session.watchVideo()
        ///------------------------------
        await _session.quizDaily()


        // _cookies = await _session.getCookies()
        // this.dbBridge.updateCookie(user.userid, _cookies)
        console.log("----------------------------------------");
        console.log(`【${user.realname}】学习任务完成`);
        await _session.terminate()
    }



    async deleteUser(userid) {///ok
        this.dbBridge.deleteUser(userid)
    }

    async listUsers() {//ok

        let _dis = await this.dbBridge.getUsers(true)
        console.log(_dis);
    }
    async addUser() {//ok

        let _cookies = await Session.login()
        if (!_cookies) {
            console.log("登录失败，cookies获取失败");
            return null
        }
        let { userid: _userid, realname: _realname } = await ToolBox.getUserInfo(_cookies)

        await this.dbBridge.saveUser(_userid, _realname, _cookies)


    }


}

///--------------------------------


(async () => {
    let frame = new Framework()
    await frame.main()

})()