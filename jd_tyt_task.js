/**
 * 
 * 推一推任务执行
 * 入口 极速版 赚金币
 *
 * TYT_USE_SCORE  推一推需要多少积分。（设置为0或者不设置时则表示不需要积分。）
 **/
const got = require('got');
const {
    sendNotify, getEnvs, sleep, addOrUpdateCustomDataTitle, addCustomData, updateCustomData, getCustomData
} = require('./quantum');

const moment = require('moment');
const api = got.extend({
    retry: { limit: 0 },
});
let status = 0;
let ckStatus = 0;

let tytOrderCustomerDataType = "tyt_order_record";
let tytCustomerDataType = "tyt_record";
let CommunicationUserId = process.env.CommunicationUserId;

let ManagerQQ = process.env.ManagerQQ; //管理员QQ

!(async () => {
    if (CommunicationUserId != process.env.ManagerQQ) {
        await sendNotify("你不是我的主人，你滚吧！");
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

    await sendNotify("推一推队列助力任务开始了\n有新的订单会自动助力\n该脚本已经支持多线程了\n发一次指令开启一条线程", true);
    while (true) {
        status = 0;
        var startTime = moment().format("YYYY-MM-DD 00:00:00")
        var endTime = moment().format("YYYY-MM-DD HH:mm:ss");
        var ss = await getCustomData(tytOrderCustomerDataType, startTime, endTime, {
            Data2: "未开始",
            PageIndex: 1,
            PageSize: 99999
        });
        var t = Math.floor((Math.random() * 5000) + 1);
        if (ss.length > 0) {
            var tytOrder = ss[ss.length - 1];
            var cookies = await getEnvs("JD_COOKIE", null, 2);
            cookies = cookies.filter((t) => t.Enable).sort(function () {
                return Math.random() - 0.5;
            });

            console.log("cookie数量：" + cookies.length);
            var result = "";

            var packetId = tytOrder.Data1.match(/packetId=([^&]+)(?=&?)/)[1]
            await sendNotify("开始推一推任务：" + tytOrder.Data5)
            tytOrder.Data2 = "任务进行中";
            await updateCustomData(tytOrder);
            await sendNotify("开始推一推任务：" + tytOrder.Data5, false, tytOrder.Data6)
            var tyt_records = await getCustomData(tytCustomerDataType);
            console.log(tyt_records.length);
            for (var index = 0; index <= cookies.length; index++) {
                var cookie = cookies[index];

                var c = cookie.Value.replace(/[\r\n]/g, "");

                var pt_pin = c.match(/pt_pin=([^; ]+)(?=;?)/)[1];
                if (!pt_pin) {
                    continue;
                }
                var s1 = tyt_records.filter(n => n.Data1.indexOf(pt_pin) > -1 && (n.Data2 == -1 || moment(n.Data3) > moment(startTime)));
                if (s1.length > 0) {
                    console.log(pt_pin + "无法助力了。");
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
                if (ckStatus == -1) {
                    await addCustomData([{
                        Type: tytCustomerDataType,
                        Data1: pt_pin,
                        Data2: ckStatus,
                        Data3: moment().format("YYYY-MM-DD HH:mm:ss"),
                        Data4: "火爆了"
                    }])
                } else if (ckStatus == 99) {
                    if (s1.length > 0) {
                        s1[0].Data3 = moment().format("YYYY-MM-DD HH:mm:ss");
                        await updateCustomData(s1[0]);
                    } else {
                        await addCustomData([{
                            Type: tytCustomerDataType,
                            Data1: pt_pin,
                            Data2: ckStatus,
                            Data3: moment().format("YYYY-MM-DD HH:mm:ss"),
                            Data4: "助理次数用完了"
                        }])
                    }
                }
                await sleep(3000);
            }
            if (!result) {
                result = "任务编号：" + tytOrder.Data5 + "，没有推完，CK已经跑完了！";
            }
            console.log(result);
            tytOrder.Data2 = result;
            console.log("开始更新推一推订单数据。");
            await updateCustomData(tytOrder);
            await sendNotify(result, true);
            if (tytOrder.Data3 != ManagerQQ) {
                await sendNotify(result, false, tytOrder.Data6);
            }
        }
        else {
            t = t + 30000;
            console.log("无推一推订单信息");
        }
        await sleep(t);
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
                else if (data.msg.indexOf("verify") > -1 || data.msg.indexOf("活动太火爆") > -1) {
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