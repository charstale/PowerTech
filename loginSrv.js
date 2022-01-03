const internetAvailable = require("internet-available");

var express = require("express")
var app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


var router = express.Router()



const Puppy = require("./puppy")
const Bridge = require("./bridge")
const ToolBox = require("./tools")

app.use(express.static("./"))
app.get("/", (req, resp) => {
    resp.send("hello")
})


let status = {}
app.use(router)
router.post("/getCode", async (req, resp) => {


    let _key = req.body.reqId
    //console.log(_key)
    status[_key] = ""
    let _session = await Puppy.buildLogin()
    let _dbBridge = new Bridge()
    _session.on("evt_got_qrcode", async (qrcode) => {
        // console.log(qrcode)
        resp.send(qrcode)
    })
    _session.on("evt_got_cookie", async (cookies) => {
        if (cookies) {
            status[_key] = "succ"

            //console.log("set",status[_key])

            let { userid: _userid, realname: _realname } = await ToolBox.getUserInfo(cookies)
            await _dbBridge.saveUser(_userid, _realname, cookies)
        }
    })

    await _session.goLoginPage()

    //await _session.quizDaily()
    //await _session.quizWeek()
    //await _session.quizEarmarked()

    await _session.terminate()
})

router.get("/jump", async (req, resp) => {

    let _key = req.query.reqId
    //console.log(_key)
    status[_key] = ""
    let _session = await Puppy.buildLogin()
    let _dbBridge = new Bridge()
    _session.on("evt_got_qrcode", async (qrcode) => {
        let _url = `https://login.xuexi.cn/login/qrcommit?code=${qrcode}&appId=dingoankubyrfkttorhpou`
        resp.redirect(302, _url);

    })
    _session.on("evt_got_cookie", async (cookies) => {
        if (cookies) {
            let { userid: _userid, realname: _realname } = await ToolBox.getUserInfo(cookies)
            await _dbBridge.saveUser(_userid, _realname, cookies)

            let _user = { userid: _userid, realname: _realname, cookie: cookies }

            _session.setUser(_user)

            status[_key] = "succ"
        }

    })

    await _session.try2Login().then(() => {
        _session.run()
    }).then((processed) => {
        _session.terminate(processed)
    }).catch((e) => {
        console.log(e.message);
        _session.terminate(false)
    })



})




router.post("/status", (req, resp) => {


    let _key = req.body.reqId

    //console.log("get",_key)
    //console.log("get",status[_key])

    resp.send(status[_key])
    delete status[_key]
})


// router.get("/login", (req, resp) => {
//     resp.sendFile("login.html", { root: __dirname })
// })




internetAvailable({
    timeout: 50000, retries: 10,
    domainName: "login.xuexi.cn",
    host: '61.147.37.1' // 默认，国内请改成114.114.114.114
}).then(function () {
    console.log("Internet available");


    app.listen(2210, () => {
        console.log("网络服务启动成功");
    })

}).catch(function () {
    console.log("No internet");
    process.exit()
});


