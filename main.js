///------------define------
const Puppy = require("./puppy")
const Bridge = require("./bridge")
const ToolBox = require("./tools")
const exec = require('child-process-promise').exec

// const { getDevices, empower } = require("./empower")
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
                // case "--fetch":
                // case "-f":
                //     await this.fetchUser()
                //     break
                case "--delete":
                case "-d":
                    await this.deleteUser(args[1])
                    break
                case "--list":
                case "-l":
                    await this.listUsers()
                    break

                case "--score":
                case "-s":
                    await this.showScore(args[1])
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

        try {
            await exec("taskkill -f -im dnplayer.exe")
        } catch (e) { console.log(e.message); }
        let _users = await this.dbBridge.getUsers()
        if (!_users) {
            console.log("数据库中没有用户");
            return
        }
        for (let _user of _users) {

            let _session = await Puppy.build(_user)
            let _processed=await _session.run().catch((e) => { console.log(e.message); })
            await _session.terminate(_processed).catch((e) => { console.log(e.message); })

        }
    }



    async listUsers() {

        let _dis = await this.dbBridge.getUsers()
        console.log(_dis);
    }
    async addUser() {
        let _session = await Puppy.buildLogin()
        _session.on("evt_got_cookie", async (cookies) => {
            if (cookies) {

                let { userid: _userid, realname: _realname } = await ToolBox.getUserInfo(cookies)
                await this.dbBridge.saveUser(_userid, _realname, cookies)
            }
        })
        await _session.goLoginPage()
        await _session.terminate()


    }

}

///--------------------------------


(async () => {
    let frame = new Framework()
    await frame.main()

})()