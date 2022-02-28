/**
 * 
 * 推一推（只进入任务队列）
 * 入口 极速版 赚金币
 *
 * TYT_USE_SCORE  推一推需要多少积分。（设置为0或者不设置时则表示不需要积分。）
 **/
const got = require('got');
const {
    sendNotify, getUserInfo, updateUserInfo, addOrUpdateCustomDataTitle, addCustomData, getCustomData
} = require('./quantum');

const moment = require('moment');

let tyt_url = process.env.tyt_url;
let TYT_USE_SCORE = (process.env.TYT_USE_SCORE || 0) * 1;

let customerDataType = "tyt_order_record";
let CommunicationUserId = process.env.CommunicationUserId;
let CommunicationUserName = process.env.CommunicationUserName;

!(async () => {
    var packetId = tyt_url.match(/packetId=([^&]+)(?=&?)/)[1]
    console.log("packetId：" + packetId);
    if (!packetId) {
        console.log(tyt_url + "中未取到packetId");
        return;
    }
    var startTime = moment().format("YYYY-MM-DD 00:00:00")
    var endTime = moment().format("YYYY-MM-DD HH:mm:ss");
    var ss = await getCustomData(customerDataType, startTime, endTime, { Data3: CommunicationUserId });
    if (ss && ss.length > 0 && ss.filter((t) => t.Data1.indexOf(packetId) > -1).length > 0) {
        var msg = "重复的推一推任务，已自动跳过。";
        console.log(msg);
        await sendNotify(msg)
        return;
    }
    await addOrUpdateCustomDataTitle({
        Type: customerDataType,
        TypeName: "推一推订单记录",
        Title1: "助力链接",
        Title2: "推一推状态",
        Title3: "QQ/WX",
        Title4: "昵称",
        Title5: "任务编号"
    })
    var tyt_order = {
        Type: customerDataType,
        Data1: tyt_url,
        Data2: "未开始",
        Data3: CommunicationUserId,
        Data4: CommunicationUserName
    }
    var uye = ss.filter((tr) => tr.Data2 == "未开始");
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
    tyt_order.Data5 = no;

    await sendNotify("任务已加入队列！任务编号：" + no + "\n前面还有" + uye.length + "个任务" + m);
    await addCustomData([tyt_order])
})();
