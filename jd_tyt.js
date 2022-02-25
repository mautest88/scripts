/**
 * 
 * 推一推
 * 入口 极速版 赚金币
 *
 * TYT_USE_SCORE  推一推需要多少积分。（设置为0或者不设置时则表示不需要积分。）
 **/
const got = require('got');
const {
    sendNotify, getEnvs, sleep, getUserInfo, updateUserInfo, addOrUpdateCustomDataTitle, addCustomData
} = require('./quantum');

const moment = require('moment');
const api = got.extend({
    retry: { limit: 0 },
});
let tyt_url = process.env.tyt_url;
let TYT_USE_SCORE = (process.env.TYT_USE_SCORE || 0) * 1;
let status = ''
let sort = moment().format("HHmmss");

let customerDataType = "tyt_order_record";
let CommunicationUserId = process.env.CommunicationUserId;
let CommunicationUserName = process.env.CommunicationUserName;

!(async () => {

    await addOrUpdateCustomDataTitle({
        Type: customerDataType,
        TypeName: "推一推订单记录",
        Title1: "助力链接",
        Title2: "推一推结果",
        Title3: "QQ/WX",
        Title4: "昵称",
    })


    var tyt_order = {
        Type: customerDataType,
        Data1: tyt_url,
        Data3: CommunicationUserId,
        Data4: CommunicationUserName
    }



    var packetId = tyt_url.match(/packetId=([^&]+)(?=&?)/)[1]
    console.log("packetId：" + packetId);
    if (!packetId) {
        console.log(tyt_url + "中未取到packetId");
        return;
    }
    let user = null
    let m = "";
    if (TYT_USE_SCORE > 0) {
        user = await getUserInfo();
        user.MaxEnvCount = user.MaxEnvCount - TYT_USE_SCORE;
        if (user.MaxEnvCount < 0) {
            await sendNotify(`推一推需要${TYT_USE_SCORE}积分，当前积分：${(user.MaxEnvCount + TYT_USE_SCORE)}`);
            return false;
        } else {
            await updateUserInfo(user);
        }
        m = `本次扣除${TYT_USE_SCORE}个积分。剩余积分：${user.MaxEnvCount}`;
    }
    var cookies = await getEnvs("JD_COOKIE", null, 2);
    cookies = cookies.filter((t) => t.Enable).sort(function () {
        return Math.random() - 0.5;
    });
    console.log("cookie数量：" + cookies.length);
    await sendNotify("开始推一推了，骚骚的等一下！任务编号：" + sort + m);
    var result = "";

    for (var i = 0; i < cookies.length; i++) {
        await help(packetId, cookies[i])
        if (status == 1) {
            result = "任务编号：" + sort + "，推一推完成。"
            break;
        }
        if (status == 2) {
            result = "任务编号：" + sort + "，帮砍排队放弃吧。"
            break;
        }
        if (status == 3) {
            result = "任务编号：" + sort + "，推一推链接过期了。"
            break;
        }
        await sleep(3000);
    }
    if (!result) {
        result = "任务编号：" + sort + "，没有推完，CK已经跑完了！";
    }
    console.log(result);
    tyt_order.Data2 = result;
    await addCustomData([tyt_order])
    await sendNotify(result);
})();

async function help(packetId, cookie) {
    const nm = {
        url: `https://api.m.jd.com?functionId=helpCoinDozer&appid=station-soa-h5&client=H5&clientVersion=1.0.0&t=1636015855103&body={"actId":"d5a8c7198ee54de093d2adb04089d3ec","channel":"coin_dozer","antiToken":"","referer":"-1","frontendInitStatus":"s","packetId":"${packetId}"}&_ste=1&_stk=appid,body,client,clientVersion,functionId,t&h5st=20211104165055104;9806356985655163;10005;tk01wd1ed1d5f30nBDriGzaeVZZ9vuiX+cBzRLExSEzpfTriRD0nxU6BbRIOcSQvnfh74uInjSeb6i+VHpnHrBJdVwzs;017f330f7a84896d31a8d6017a1504dc16be8001273aaea9a04a8d04aad033d9`,
        headers: {
            "Cookie": cookie.Value,
            "Origin": "https://pushgold.jd.com",
        },
        method: "get"
    }
    var pt_pin = cookie.Value.match(/pt_pin=([^; ]+)(?=;?)/)[1]
    try {
        await api(nm).then(async response => {
            var data = response.body;
            if (safeGet(data)) {
                data = JSON.parse(data);
                if (data.success == true) {
                    amount = data.data.amount;
                    console.log(pt_pin + "帮砍：" + data.data.amount)
                }
            }
            if (data.msg.indexOf("完成") != -1) {
                status = 1
            }
            else if (data.msg == "帮砍排队") {
                status = 2
            }
            else if (data.msg.indexOf("过期") > -1) {
                status = 3
            }
            if (data.success == false) {
                console.log(data.msg)
            }
        });
    }
    catch (e) {
        console.log("请求错误！", JSON.stringify(e));
    }
}

function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        }
    } catch (e) {
        console.log(e);
        console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
        return false;
    }
}