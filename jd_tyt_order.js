/**
 * 
 * 推一推
 * 入口 极速版 赚金币
 *
 * TYT_USE_SCORE  推一推需要多少积分。（设置为0或者不设置时则表示不需要积分。）
 **/
const got = require('got');
const {
    sendNotify, getUserInfo, updateUserInfo, addOrUpdateCustomDataTitle, addCustomData, getCustomData, sleep, getEnvs, updateCustomData
} = require('./quantum');
const api = got.extend({
    retry: { limit: 0 },
});

const moment = require('moment');

let tyt_url = process.env.tyt_url;
let TYT_USE_SCORE = (process.env.TYT_USE_SCORE || 0) * 1;

let customerDataType = "tyt_order_record";
let CommunicationUserId = process.env.CommunicationUserId;
let CommunicationUserName = process.env.CommunicationUserName;
let ManagerQQ = process.env.ManagerQQ;

let tytCustomerDataType = "tyt_record";

let status = 0;
let ckStatus = 0;

!(async () => {
    var packetId = tyt_url.match(/packetId=([^&]+)(?=&?)/)[1]
    console.log("packetId：" + packetId);
    if (!packetId) {
        console.log(tyt_url + "中未取到packetId");
        return;
    }
    var startTime = moment().format("YYYY-MM-DD")
    var endTime = moment().format("YYYY-MM-DD HH:mm:ss");
    var ss = await getCustomData(customerDataType, startTime, endTime, { Data6: process.env.user_id });
    if (ss && ss.length > 0 && ss.filter((t) => t.Data1.indexOf(packetId) > -1).length > 0) {
        var msg = "重复的推一推任务，已自动跳过。";
        console.log(msg);
        await sendNotify(msg)
        return;
    }
    await addOrUpdateCustomDataTitle({
        Type: tytCustomerDataType,
        TypeName: "推一推JD_COOKIE记录",
        Title1: "PT_PIN",
        Title2: "CK状态",
        Title3: "更新时间",
        Title4: "说明"
    });
    await addOrUpdateCustomDataTitle({
        Type: customerDataType,
        TypeName: "推一推订单记录",
        Title1: "助力链接",
        Title2: "推一推状态",
        Title3: "QQ/WX",
        Title4: "昵称",
        Title5: "任务编号",
        Title6: "用户Id"
    })
    var tytOrder = {
        Type: customerDataType,
        Data1: tyt_url,
        Data2: "进行中",
        Data3: CommunicationUserId,
        Data4: CommunicationUserName,
        Data6: process.env.user_id
    }
    var m = "";
    if (TYT_USE_SCORE > 0) {
        user = await getUserInfo();
        user.MaxEnvCount = user.MaxEnvCount - TYT_USE_SCORE;
        if (user.MaxEnvCount < 0) {
            await sendNotify(`推一推需要${TYT_USE_SCORE}积分，当前积分：${(user.MaxEnvCount + TYT_USE_SCORE)}`);
            return false;
        } else {
            await updateUserInfo(user);
        }
        m = `\n本次扣除${TYT_USE_SCORE}个积分。剩余积分：${user.MaxEnvCount}`;
    }
    var no = (ss.length + 1)
    tytOrder.Data5 = no;
    var sss = await addCustomData([tytOrder])
    tytOrder = sss[0];
    await sendNotify("任务进行中！任务编号：" + no + m);
    var cookies = await getEnvs("JD_COOKIE", null, 2);
    cookies = cookies.filter((t) => t.Enable).sort(function () {
        return Math.random() - 0.5;
    });
    console.log("cookie数量：" + cookies.length);
    var result = "";
    var packetId = tytOrder.Data1.match(/packetId=([^&]+)(?=&?)/)[1]
    await sendNotify("开始推一推任务：" + tytOrder.Data5)
    // var tyt_records = await getCustomData(tytCustomerDataType);
    var tyt_records = [];
    console.log(tyt_records.length);

    for (var index = 0; index <= cookies.length; index++) {
        try {
            var cookie = cookies[index];
            if (!cookie || !cookie.Value) {
                continue;
            }
            var c = cookie.Value.replace(/[\r\n]/g, "");
            var pt_pin = c.match(/pt_pin=([^; ]+)(?=;?)/)[1];
            if (!pt_pin) {
                continue;
            }
            var s1 = tyt_records.filter(n => n.Data1.indexOf(pt_pin) > -1 && (n.Data2 == -1 || moment(n.Data3) > moment(startTime)));
            if (s1.length > 0) {
                continue;
            }
            var sss = await getCustomData(tytCustomerDataType, startTime, null, {
                Data1: pt_pin
            });
            if (sss.length > 0) {
                continue;
            }
            ckStatus = 0;
            await help(packetId, c)
            if (status == 1) {
                result = "任务编号：" + tytOrder.Data5 + "，推一推完成。"
                break;
            }
            if (status == 2) {
                result = "任务编号：" + tytOrder.Data5 + "，帮砍排队放弃吧。"
                break;
            }
            if (status == 3) {
                result = "任务编号：" + tytOrder.Data5 + "，推一推链接过期了。"
                break;
            }
            // if (ckStatus == -1) {
            //     await addCustomData([{
            //         Type: tytCustomerDataType,
            //         Data1: pt_pin,
            //         Data2: ckStatus,
            //         Data3: moment().format("YYYY-MM-DD HH:mm:ss"),
            //         Data4: "火爆了"
            //     }])
            // } else if (ckStatus == 99) {
            //     if (s1.length > 0) {
            //         s1[0].Data3 = moment().format("YYYY-MM-DD HH:mm:ss");
            //         await updateCustomData(s1[0]);
            //     } else {
            //         await addCustomData([{
            //             Type: tytCustomerDataType,
            //             Data1: pt_pin,
            //             Data2: ckStatus,
            //             Data3: moment().format("YYYY-MM-DD HH:mm:ss"),
            //             Data4: "助力次数用完了"
            //         }])
            //     }
            // }
        } catch (e) {

        }
        await sleep(3000);
    }
    if (!result) {
        result = "任务编号：" + tytOrder.Data5 + "，没有推完，CK已经跑完了！";
    }
    console.log(result);
    tytOrder.Data2 = result;
    await updateCustomData(tytOrder);
    await sendNotify(result + "\n用户：" + CommunicationUserName, true);
    if (tytOrder.Data3 != ManagerQQ) {
        await sendNotify(result, false, tytOrder.Data6);
    }
})();

async function help(packetId, cookie) {
    const nm = {
        url: `https://api.m.jd.com?functionId=helpCoinDozer&appid=station-soa-h5&client=H5&clientVersion=1.0.0&t=1636015855103&body={"actId":"49f40d2f40b3470e8d6c39aa4866c7ff","channel":"coin_dozer","antiToken":"","referer":"-1","frontendInitStatus":"s","packetId":"${packetId}"}&_ste=1&_stk=appid,body,client,clientVersion,functionId,t&h5st=20211104165055104;9806356985655163;10005;tk01wd1ed1d5f30nBDriGzaeVZZ9vuiX+cBzRLExSEzpfTriRD0nxU6BbRIOcSQvnfh74uInjSeb6i+VHpnHrBJdVwzs;017f330f7a84896d31a8d6017a1504dc16be8001273aaea9a04a8d04aad033d9`,
        headers: {
            "Cookie": cookie,
            "Origin": "https://pushgold.jd.com",
        },
        method: "get"
    }
    var pt_pin = cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
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
                console.log("助力失败，京东返回数据：" + data.msg)
                if (data.msg.indexOf("帮砍机会已用完") > -1) {
                    ckStatus = 99;
                }
                else if (data.msg.indexOf("verify") > -1 || data.msg.indexOf("活动太火爆") > -1 || data.msg.indexOf("未登录") > -1) {
                    ckStatus = -1;
                }
            }
        });
    }
    catch (e) {
        console.log(pt_pin + "请求错误" + JSON.stringify(e));
        console.log("请求京东错了，今天标记成助力完了，明天再试");
        ckStatus = 99;
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