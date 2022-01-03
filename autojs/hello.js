


// app = launchApp("学习强国")
// sleep(5000)




//login();




//new Shell().exec("am start -n cn.xuexi.android/com.alibaba.lightapp.runtime.activity.CommonWebViewActivity -d https://login.xuexi.cn/login/qrcommit?showmenu=false&code=qr:34373CA1-C00F-43D8-9602-32295CF26597&appId=dingoankubyrfkttorhpou")


app.startActivity({
  className: "com.alibaba.lightapp.runtime.activity.CommonWebViewActivity",
  data: "https://login.xuexi.cn/login/qrcommit?showmenu=false&code=qr:34373CA1-C00F-43D8-9602-32295CF26597&appId=dingoankubyrfkttorhpou",
  packageName: "cn.xuexi.android"
})


// app.startActivity({
//   className: "com.alibaba.android.rimet.biz.home.activity.HomeActivity",
//   packageName: "cn.xuexi.android"
// })


function login() {

  id("et_phone_input").waitFor()
  id("et_phone_input").setText("18398279027")

  id("et_pwd_login").setText("holyshit233")

  id("btn_next").click()
}