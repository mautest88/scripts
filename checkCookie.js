/**
 * 可用环境变量 请通过环境变量添加量子变量
 *
 * NO_CK_NOTIFY ，说明未提交京东CK时提醒信息。
 * CK_Failure_Notify   （检测到失效CK是否通知管理员，默认通知，不需要通知则配置为 false）
 *
 * */

require('./env.js');

const got = require('got');

if (!process.env.NO_CK_NOTIFY) {
    process.env.NO_CK_NOTIFY = "您没有提交CK。请按照教程获取CK发送给机器人。";
}
const moment = require('moment');
// const $ = new Env('京东CK检测');

let IsSystem = process.env.IsSystem == "true";
let cookiesArr = [];
//是否开启并发
if (process.env.JD_COOKIE) {
    cookiesArr = process.env.JD_COOKIE.split("&");
}

let CK_Failure_Notify = process.env.CK_Failure_Notify != "false"; //失效CK是否通知管理员

const { disableEnvs, sendNotify, getEnvs
} = require('./quantum');


const api = got.extend({
    retry: { limit: 0 },
});

let isLogin = true;

!(async () => {


    if (cookiesArr.length == 0) {
        console.log("没有Cookies信息结束任务。");
        if (process.env.NO_CK_NOTIFY) {
            await sendNotify(process.env.NO_CK_NOTIFY);
        }
        return;
    }
    var userNotifyMessage = "";
    var managerNotifyMessage = "";
    var overdueCKs = [];

    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            var pt_pin = cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
            var UserName = (cookie.match(/pt_pin=([^; ]+)(?=;?)/) && pt_pin)
            var UserName2 = decodeURI(UserName);
            var t = (await getEnvs("JD_COOKIE", pt_pin, 2, null));
            if (t.length > 0) {
                t = t[0];
                UserName2 = t.UserRemark || UserName2;
                if (!t.Enable) {
                    console.log("账号：" + UserName2 + "本身就失效，不检查状态。");
                    if (!IsSystem) {
                        userNotifyMessage += `【账号名称】：${UserName2}，过期了！请重新获取提交。\n`
                    }
                    continue;
                }
            }
            console.log(`开始检测【京东账号】${UserName2} ....\n`);
            await isLoginByX1a0He();
            if (isLogin) {
                console.log("cookie有效！")
                if (!IsSystem) {
                    var overdueDate = moment(t.UpdateTime).add(30, 'days');
                    var day = overdueDate.diff(new Date(), 'day');
                    userNotifyMessage += `【东东账号】：${UserName2}，有效！
【预计失效】${day}天后，${moment(t.overdueDate).format("MM月DD日")}失效。\n`
                }
            }
            else {
                console.log(cookie + "失效！")
                userNotifyMessage += `账号名称：${UserName2}，失效！\n`
                if (CK_Failure_Notify) {
                    managerNotifyMessage += `pt_pin：${pt_pin || '-'}，账号名：${UserName2}，过期！\n`
                }
                console.log("自动禁用失效COOKIE！")
                overdueCKs.push(cookie)
            }
        }
    }
    if (userNotifyMessage) {
        await sendNotify(userNotifyMessage);
    }
    if (userNotifyMessage) {
        await sendNotify(managerNotifyMessage, true);
    }
    if (overdueCKs && overdueCKs.length > 0) {
        console.log("禁用失效返回结果:" + JSON.stringify(await disableEnvs(overdueCKs)));
    } else {
        console.log("无过期CK.");
    }
})()
    .catch((e) => console.log(JSON.stringify(e)))

async function isLoginByX1a0He() {
    console.log("isLoginByX1a0He")
    const options = {
        url: 'https://plogin.m.jd.com/cgi-bin/ml/islogin',
        headers: {
            "Cookie": cookie,
            "referer": "https://h5.m.jd.com/",
            "User-Agent": "jdapp;iPhone;10.1.2;15.0;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        },
        method: 'get',
    }
    const body = await api(options).json();
    isLogin = (body.islogin == "1");
}