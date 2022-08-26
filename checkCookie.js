/**
 * 可用环境变量 请通过环境变量添加量子变量
 *
 * NO_CK_NOTIFY ，说明未提交京东CK时提醒信息。
 * CK_Failure_Notify   （检测到失效CK是否通知管理员，默认通知，不需要通知则配置为 false）
 *
 * */

const got = require('got');

if (!process.env.NO_CK_NOTIFY) {
    process.env.NO_CK_NOTIFY = "您没有提交CK。请按照教程获取CK发送给机器人。";
}
/**
 * 
 * 京东CK失效检查
 * 可用环境变量CK_Failure_Notify  失效CK是否通知管理员， 默认不通知，如果需要通知请设置量子变量CK_Failure_Notify，值为true
 * 
 * */
let CK_Failure_Notify = process.env.CK_Failure_Notify == "true"; //失效CK是否通知管理员

const { disableEnvs, sendNotify, getEnvs
} = require('./quantum');

const api = got.extend({
    retry: { limit: 0 },
});

let isLogin = true;

!(async () => {
    var cookiesArr = await getEnvs("JD_COOKIE", null, 2);
    var managerNotifyMessage = "";
    var overdueCKs = [];
    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i].Value && cookiesArr[i].Enable) {
            cookie = cookiesArr[i].Value;
            var pt_pin = cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
            var UserName = (cookie.match(/pt_pin=([^; ]+)(?=;?)/) && pt_pin)
            var UserName2 = decodeURI(UserName);
            console.log(`开始检测【京东账号】${UserName2} ....\n`);
            try {
                await isLoginByX1a0He();
            } catch (e) {
                console.log("检测CK出现异常，" + cookie);
                console.log("异常信息，" + JSON.stringify(e));
                continue;
            }
            if (!isLogin) {
                console.log(cookie + "失效，自动禁用失效COOKIE！")
                if (cookiesArr[i].UserId && cookie.indexOf("app_open") == -1) {
                    await sendNotify(`账号：${UserName2}，失效了，请重新提交！`, false, cookiesArr[i].UserId);
                }
                if (CK_Failure_Notify) {
                    managerNotifyMessage += `pt_pin：${pt_pin || '-'}，账号名：${UserName2}，过期！\n`
                }
                overdueCKs.push(cookie)
            }
        }
    }
    if (CK_Failure_Notify && managerNotifyMessage) {
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