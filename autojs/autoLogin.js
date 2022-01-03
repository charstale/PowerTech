




function run() {


  // let _rndTime = random(1 * 60 * 1000, 5 * 60 * 1000)//随机15-20分钟休眠

  // log("休眠" + _rndTime / 60000 + "分钟")
  // sleep(_rndTime)//此时可以人工介入时间

  for (let _i = 0; _i < 3; _i++) {
    //let _url = "http://192.168.8.2:2210/getCode"
    let _reqId = randomString(10)
    //let _code = http.postJson(_url, { reqId: _reqId }).body.string()


    let _cmd = " am start -n cn.xuexi.android/com.alibaba.lightapp.runtime.activity.CommonWebViewActivity -d http://192.168.8.2:2210/jump?reqId=" + _reqId


    log(_cmd)
    shell(_cmd, true)

    sleep(2000)

    className("android.view.View").text("登录网页版学习强国").waitFor()
    // className("android.view.View").text("登录学习强国").waitFor()
    sleep(2000)
    className("android.view.View").text("登录网页版学习强国").click()
    // className("android.view.View").text("登录学习强国").click()


    sleep(10000)//等待10s，服务器获取cookie后再取状态

    _url = "http://192.168.8.2:2210/status"
    let _status = http.postJson(_url, { reqId: _reqId }).body.string()


    log(_status)

    if (_status == "succ") {
      log("auth success")
      break
    } else {
      log("auth failed")
      sleep(10 * 1000)
      continue
    }
  }
  shutdown()
}


function randomString(length) {
  var str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i)
    result += str[Math.floor(Math.random() * str.length)];
  return result;
}

function shutdown() {
  let _cmd = "halt"
  shell(_cmd, true)

}

run();