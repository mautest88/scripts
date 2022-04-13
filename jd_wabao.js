/**
 * 
 * 挖宝 多线程爆炸版本
 * 可以指定助力次数，链接后面空格+助力次数如：
 * 
 *https://bnzf.jd.com/?activityId=pTTvJeSTrpthgk9ASBVGsw&inviterId=AnGSL6Zn3cdZbSu5yaWZzlto-x3UjipJydBT7cHxeqo&inviterCode=eaa56da106944c6499696f389dc3a03512911649694825215&utm_user=plusmember&ad_od=share&utm_source=androidapp&utm_medium=appshare&utm_campaign=t_335139774&utm_term=Wxfriends 30
 * 
 * 以上链接则只助力30次
 * 
 * 需要量子变量：
 * 
 * QUANTUM_AUTH_CODE  量子授权码，月卡每天可用转链服务3次，年可用10次，永久50次。
 * 
 * WB_USE_SCORE 挖宝需要多少积分 （整数）
 * 
 * 
 * 
 * XM_PROXY 熊猫代理API 地址：
 * 
 * 熊猫代理注册：http://www.xiongmaodaili.com?invitationCode=2E416FEA-9B77-4CD3-B7FE-D5CD4A8C60AB 
 * 注册登录后购买2元1000条的。
 * 购买后回到订管理，点击生成API 
 * 提取数量：1
 * 数据格式：JSON
 * 其他默认
 * 复制生成的API地址添加到量子环境变量。
 * 
 **/
const got = require('got');
var HttpsProxyAgent = require("https-proxy-agent");
const http = require("http");
const https = require("https");
const {
    sendNotify, getUserInfo, updateUserInfo, addOrUpdateCustomDataTitle, addCustomData, getCustomData, sleep, getEnvs, updateCustomData, deleteEnvByIds
} = require('./quantum');
const api = got.extend({
    retry: { limit: 0 },
});
const moment = require('moment');

// 挖宝活动id
let ActivityId = "pTTvJeSTrpthgk9ASBVGsw";
let wabao_url = process.env.wabao_url;
let WB_USE_SCORE = (process.env.WB_USE_SCORE || 0) * 1;

let customerDataType = "wabao_order";
let CommunicationUserId = process.env.CommunicationUserId;
let CommunicationUserName = process.env.CommunicationUserName;
let ManagerQQ = process.env.ManagerQQ;
let QUANTUM_AUTH_CODE = process.env.QUANTUM_AUTH_CODE;
let XM_PROXY = process.env.XM_PROXY;

//最大助力次数
let maxCount = 40;
let count = 0;

var xmProxy = null;
var error = false;
!(async () => {
    if (!QUANTUM_AUTH_CODE) {
        console.log("未指定QUANTUM_AUTH_CODE 量子变量。");
        console.log("QUANTUM_AUTH_CODE变量值为你的量子授权码。");
        console.log("量子授权码可以通过系统设置查看，或者管理员给机器人发“授权”。");
        return;
    }

    var inviterId = wabao_url.match(/inviterId=([^&]+)(?=&?)/)[1]
    var inviterCode = wabao_url.match(/inviterCode=([^&]+)(?=&?)/)[1]
    console.log("inviterId：" + inviterId);
    console.log("inviterCode：" + inviterCode);
    if (!inviterId) {
        console.log(wabao_url + "中未取到inviterId");
        return;
    } if (!inviterCode) {
        console.log(wabao_url + "中未取到inviterCode");
        return;
    }
    var url = `https://bnzf.jd.com/?activityId=${ActivityId}&inviterId=${inviterId}&inviterCode=${inviterCode}&`
    var startTime = moment().format("YYYY-MM-DD")
    var endTime = moment().format("YYYY-MM-DD HH:mm:ss");
    var ss = await getCustomData(customerDataType, startTime, endTime, { Data6: process.env.user_id });

    if (ss && ss.length > 0 && ss.filter((t) => t.Data6.indexOf(inviterId) > -1).length > 0) {
        var msg = "重复的挖宝任务，已自动跳过。";
        console.log(msg);
        await sendNotify(msg)
        return;
    }
    var m = "";
    if (WB_USE_SCORE > 0) {
        user = await getUserInfo();
        user.MaxEnvCount = user.MaxEnvCount - WB_USE_SCORE;
        if (user.MaxEnvCount < 0) {
            await sendNotify(`挖宝需要${WB_USE_SCORE}积分，当前积分：${(user.MaxEnvCount + WB_USE_SCORE)}`);
            return false;
        } else {
            await updateUserInfo(user);
        }
        m = `\n本次扣除${WB_USE_SCORE}个积分。剩余积分：${user.MaxEnvCount}`;
    }

    await addOrUpdateCustomDataTitle({
        Type: customerDataType,
        TypeName: "挖宝订单",
        Title1: "助力链接",
        Title2: "状态",
        Title3: "QQ/WX",
        Title4: "昵称",
        Title5: "任务编号",
        Title6: "原链接",
        Title7: "助力次数"
    })
    var wbOrder = {
        Type: customerDataType,
        Data1: "",
        Data2: "进行中",
        Data3: CommunicationUserId,
        Data4: CommunicationUserName,
        Data6: url,
        Data7: "0"
    }
    var no = (ss.length + 1)
    wbOrder.Data5 = no;

    var cookies = await getEnvs("JD_COOKIE", null, 2);
    if (cookies.length == 0) {
        var message = "未提供JD_COOKIE 无法执行任务！"
        console.log(message);
        await sendNotify(message)
        return;
    }
    var convertResult = await convertUrl(url);
    if (convertResult && convertResult.success) {
        wbOrder.Data1 = convertResult.data;
    } else {
        await sendNotify("挖宝转链失败：" + convertResult.data);
        return;
    }
    var sss = await addCustomData([wbOrder])
    wbOrder = sss[0];
    cookies = cookies.filter((t) => t.Enable).sort(function () {
        return Math.random() - 0.5;
    });
    console.log("cookie数量：" + cookies.length);
    var result = "";
    await sendNotify("开始挖宝任务：" + wbOrder.Data5 + m)
    var threadCount = 0;
    var threadCompleteCount = 0;
    if (wabao_url.split(" ").length == 2) {
        try {
            maxCount = parseInt(wabao_url.split(" ")[1])
            console.log("挖宝指定助力次数：" + maxCount)
        } catch (e) {
        }
    }
    await getProxy();
    for (var index = 0; index <= cookies.length; index++) {
        try {
            var cookie = cookies[index];
            if (!cookie || !cookie.Value) {
                continue;
            }
            var c = cookie.Value.replace(/[\r\n]/g, "");
            var pt_pin = c.match(/pin=([^; ]+)(?=;?)/)[1];
            if (!pt_pin) {
                continue;
            }
            const nm = {
                url: wbOrder.Data1,
                headers: {
                    "User-Agent": "jdltapp;iPhone;3.8.12;;;M/5.0;hasUPPay/0;pushNoticeIsOpen/1;lang/zh_CN;hasOCPay/0;appBuild/1129;supportBestPay/0;jdSupportDarkMode/0;ef/1;ep/%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22ud%22%3A%22DQG2YJuzCJC3CJC4CwDuZJPvZtZuCJHrDwG5YtU3YwVuENS4YzU1Cq%3D%3D%22%2C%22sv%22%3A%22CJUkDK%3D%3D%22%2C%22iad%22%3A%22%22%7D%2C%22ts%22%3A1647603296%2C%22hdid%22%3A%22IdJDIlAUU%2BIuqLovL%5C%2FO7UFEwuvf2f9O%2BazbGA9gGd9w%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.jd.jdmobilelite%22%2C%22ridx%22%3A1%7D;Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1; Edg/99.0.4844.51",
                    "Cookie": cookie.Value,
                    "referer": "https://bnzf.jd.com/",
                    "origin": "https://bnzf.jd.com",
                    "pragma": "no-cache",
                    "Host": "api.m.jd.com",
                    "accept": "application/json, text/plain, */*",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Origin": "https://pushgold.jd.com",
                },
                method: "get",
            }
            if (xmProxy) {
                var agent = new HttpsProxyAgent(`http://${xmProxy.ip}:${xmProxy.port}`);
                nm.agent = {
                    https: agent,
                    http: agent,
                }
            }
            var result = null;
            api(nm).then(async response => {
                result = JSON.parse(response.body);
                console.log("挖宝助力结果：" + result.errMsg);
                result = JSON.parse(response.body);
                if (result.errMsg == "success") {
                    count++;
                    console.log("成功次数：" + count);
                }
                threadCompleteCount++;
            }).catch(async error => {
                console.log(JSON.stringify(error.response));
                threadCompleteCount++;
                if (!XM_PROXY) {
                    error = true;
                } else {
                    await getProxy();
                }
            });
            threadCount++;
            while (threadCount >= maxCount - count && threadCount > threadCompleteCount) {
                await sleep(100);
            }
            if (error) {
                break;
            }
            if (threadCount == threadCompleteCount) {
                threadCount = 0;
                threadCompleteCount = 0;
            }
            if (count >= maxCount) {
                wbOrder.Data2 = "完成";
                wbOrder.Data7 = count;
                console.log("任务编号：" + wbOrder.Data5 + "助力次数达到" + maxCount);
                break;
            }
        } catch (e) {
            console.log(e)
        }
    }
    if (count < maxCount) {
        wbOrder.Data2 = "未完成";
    }
    result = "任务编号：" + wbOrder.Data5 + "执行结束，挖宝结果：" + wbOrder.Data2 + "，助力次数：" + count;
    console.log(result);
    await updateCustomData(wbOrder);
    await sendNotify(result + "\n用户：" + CommunicationUserName, true);
    if (wbOrder.Data3 != ManagerQQ) {
        await sendNotify(result, false, process.env.user_id);
    }
})();

/**
 * 
 * 这里是调用我的挖宝转链服务。
 * 没有post任何CK信息，要黑，带节奏的请带上你全家的骨灰盒
 * 
 * @param {any} url
 */
async function convertUrl(url) {
    console.log("开始获取挖宝助力地址：");
    var result = null;
    try {
        var options = {
            'method': 'POST',
            'url': 'http://47.107.105.249:8002/api/open/ConvertWabaoUrl',
            'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "Url": url,
                "AuthCode": QUANTUM_AUTH_CODE
            })
        };
        var response = await api(options);
        console.log("挖宝转链返回结果信息：");
        console.log(response.body);
        result = JSON.parse(response.body);
    } catch (e) {
        console.log("转链失败：");
        console.log(JSON.stringify(e));
    }
    return result;
}

/**
 * 
 * 获取熊猫代理
 * 
 * */
async function getProxy() {
    if (XM_PROXY == null) {
        console.log("未配置熊猫代理API地址，可能出现403");
        return null;
    }
    console.log("获取熊猫代理：");
    try {
        var options = {
            'method': 'get',
            'url': XM_PROXY,
            'headers': {
                'Content-Type': 'application/json'
            }
        };
        var response = await api(options);
        console.log("获取代理IP结果：" + response.body);
        result = JSON.parse(response.body);
    } catch (e) {
        console.log("熊猫代理获取异常。");
        console.log(JSON.stringify(e));
    }
    if (result.code == "0" && result.obj) {
        xmProxy = result.obj[0];
    } else if (result.code == "-102") {
        console.log(result.msg)
        await sleep(1000);
        await getProxy();
    }
}