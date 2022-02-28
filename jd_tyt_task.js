/**
 * 
 * 推一推任务执行
 * 入口 极速版 赚金币
 *
 * TYT_USE_SCORE  推一推需要多少积分。（设置为0或者不设置时则表示不需要积分。）
 **/
const got = require('got');
const {
    sendNotify, getEnvs, sleep, getUserInfo, updateUserInfo, addOrUpdateCustomDataTitle, addCustomData, updateCustomData, getCustomData
} = require('./quantum');

const moment = require('moment');
const { createWriteStream } = require('fs');
const api = got.extend({
    retry: { limit: 0 },
});
let status = ''
let sort = moment().format("HHmmss");

let tytOrderCustomerDataType = "tyt_order_record";
let tytCustomerDataType = "tyt_record";
let CommunicationUserId = process.env.CommunicationUserId;
let CommunicationUserName = process.env.CommunicationUserName;



!(async () => {

    if (CommunicationUserId != process.env.ManagerQQ) {
        await sendNotify("你不是我的主人，你滚吧！");
        return;
    }
    await addOrUpdateCustomDataTitle({
        Type: tytCustomerDataType,
        TypeName: "推一推任务记录（可忽略该数据）",
        Title1: "Cookie轮数",
        Title2: "Cookie序号",
    });


    await sendNotify("推一推队列助力任务开始了\n任务只能执行一次\n有新的订单会自动助力\n重复执行将导致数据异常。", true);

    while (true) {
        var startTime = moment().format("YYYY-MM-DD 00:00:00")
        var endTime = moment().format("YYYY-MM-DD HH:mm:ss");
        var ss = await getCustomData(tytOrderCustomerDataType, startTime, endTime, {
            Data2: "未开始",
            PageIndex: 1, PageSize: 99999
        });
        if (ss.length > 0) {
            var tytRecordData = await getCustomData(tytCustomerDataType, startTime, endTime, {
                PageIndex: 1, PageSize: 1
            })

            var count = 1;
            var index = 0

            if (tytRecordData && tytRecordData.length > 0) {
                count = tytRecordData[0].Data1 * 1;
                index = tytRecordData[0].Data2 * 1;
                console.log("推一推记录信息：" + JSON.stringify(tytRecordData[0]));
            }

            var tytOrder = ss[ss.length - 1];
            await sendNotify("开始推一推任务：" + tytOrder.Data5)
            var cookies = await getEnvs("JD_COOKIE", null, 2);
            cookies = cookies.filter((n) => n.Enable);
            console.log("cookie数量：" + cookies.length);
            var result = "";

            var packetId = tytOrder.Data1.match(/packetId=([^&]+)(?=&?)/)[1]

            var index2 = index;

            var counts = 0;



            if (index2 <= cookies.length - 5 && count >= 4) {
                await sendNotify("所有Cookie已经助力3次\n今日无法完成推一推任务了！", true)
            }

            for (index2; index2 <= cookies.length;) {
                //如果不是从第一个CK 开始推的，则再遍历一次CK
                if (index2 >= cookies.length && index != 0 && count < 4 && counts == 0) {
                    index2 = 0;
                    count++;
                    counts = 1;
                }
                await help(packetId, cookies[index2])
                index2++
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
                await sleep(3000);
            }

            if (!result) {
                result = "任务编号：" + tytOrder.Data5 + "，没有推完，CK已经跑完了！";
            }

            var sssre = {
                Type: tytCustomerDataType,
                Data1: count,
                Data2: index2
            }

            console.log(result);
            if (tytRecordData && tytRecordData.length > 0) {
                tytRecordData[0].Data1 = count;
                tytRecordData[0].Data2 = index2;
                console.log("开始更新记录数据。");
                await updateCustomData(tytRecordData[0])

            } else {
                var sssre = {
                    Type: tytCustomerDataType,
                    Data1: count,
                    Data2: index2
                }
                console.log("开始添加记录数据。");
                await addCustomData([sssre]);
            }

            tytOrder.Data2 = result;

            console.log("开始更新推一推订单数据。");
            await updateCustomData(tytOrder);
            await sendNotify(result, true);
        }

        else {
            console.log("无推一推订单信息");
        }
        await sleep(10000);
    }
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