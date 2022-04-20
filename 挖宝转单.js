/**
 * 
 * 量子转单
 * 该示例为转挖宝
 * 
 **/
const got = require('got');
const {
    sendNotify, getUserInfo, updateUserInfo, addOrUpdateCustomDataTitle, addCustomData, getCustomData, sleep
} = require('./quantum');


const api = got.extend({
    retry: { limit: 0 },
});
const moment = require('moment');

// 触发消息指令
let command = process.env.command;

/*-----------------自行修改参数部分-----------------*/
// 使用积分，如果不要积分则赋值为0 

let USE_SCORE = 350;

// 订单类型 请直接修改脚本里的 “挖宝”为推一推或其他
let customerDataType = "挖宝";

/**
 * 消息要转发的通讯类型
 * 1：QQ
 * 4：微信（vlw）
 * */
let targetCommunicationType = 1;

/**
 * 
 * 消息要转给的目标人QQ或者微信ID（请与上面的通讯类型匹配）
 * 
 * */
let targetCommunicationUserId = "179100150";


/**
 * 黑名单，可以是QQ 或者 微信ID
 * 多个用英文的逗号隔开
 * 建议将上家微信QQ加入黑名单，否则上家回执带链接时会触发转单
 * */
let blackList = "123456,8888888,888888"

/**
 * 转单限制开始时间
 * 以下表示0:30分（包含00:30）才开始转单
 * */
let startLimitTime = '00:30:00'

/**
 * 转单限制结束时间
 * */
let endLimitTime = '22:30:00'


/*-----------------自行修改参数部分-----------------*/



let CommunicationUserId = process.env.CommunicationUserId;
let CommunicationUserName = process.env.CommunicationUserName;

!(async () => {
    if (blackList.split(",").indexOf(CommunicationUserId) > -1) {
        console.log(CommunicationUserId + "在黑名单中，不处理转单信息");
        return;
    }
    var startTime = moment(moment().format("YYYY-MM-DD " + startLimitTime));
    var endTime = moment(moment().format("YYYY-MM-DD " + endLimitTime));
    var now = moment();
    if (now < startTime || now > endTime) {
        console.log(`转单时间结束，转单时间 ${startLimitTime}-${endLimitTime}`);
        return;
    }

    var t = Math.round(Math.random() * 3000) + 300;
    console.log("随机延迟" + t + "毫秒");
    await sleep(t);

    /***
     * 重组xml 消息中的url信息
     * 如发财挖宝
     * 因为锦鲤本身是口令，则不需要进行重组消息，直接转发即可
     * https://bnzf.jd.com/?activityId=pTTvJeSTrpthgk9ASBVGsw&inviterId=wJgdJ8ZDemfPlhjkWEBr0E878IikZSVhF1e29X_fe4M&inviterCode=6455212d609e4a9d9f8bf6a19997456b67721650038447629&
     * */
    // var activityId = command.match(/activityId=([^&]+)(?=&?)/)[1]
    var inviterId = command.match(/inviterId=([^&]+)(?=&?)/)[1]
    var inviterCode = command.match(/inviterCode=([^&]+)(?=&?)/)[1]
    if (!inviterId || !inviterCode) {
        await sendNotify("消息中的助力链接参数异常！");
        return;
    }
    // url 为重新拼接的助力链接
    var url = `https://bnzf.jd.com/?activityId=pTTvJeSTrpthgk9ASBVGsw&inviterId=${inviterId}&inviterCode=${inviterCode}&`


    var startTime = moment().format("YYYY-MM-DD")
    var endTime = moment().format("YYYY-MM-DD HH:mm:ss");

    // 查询当天用户的发送的所有的订单数据
    var ss = await getCustomData(customerDataType, startTime, endTime, { Data2: CommunicationUserId });

    //通常将助力链接放在数据管理的Data1 字段，通过判断Data1 中是否包含邀请码是否重复来判断订单是否重复

    if (ss && ss.length > 0 && ss.filter((t) => t.Data1.indexOf(inviterCode) > -1).length > 0) {
        var msg = `邀请码：${inviterCode}重复`;
        console.log(msg);
        await sendNotify(msg)
        return;
    }
    //扣除积分的通知
    var m = "";
    // 如果启用了积分，则扣除用户积分
    if (USE_SCORE > 0) {
        user = await getUserInfo();
        user.MaxEnvCount = user.MaxEnvCount - USE_SCORE;
        if (user.MaxEnvCount < 0) {
            await sendNotify(`挖宝需要${USE_SCORE}积分，当前积分：${(user.MaxEnvCount + USE_SCORE)}`);
            return false;
        } else {
            await updateUserInfo(user);
        }
        m = `\n本次扣除${USE_SCORE}个积分。剩余积分：${user.MaxEnvCount}`;
    }

    await addOrUpdateCustomDataTitle({
        Type: customerDataType,
        TypeName: "挖宝转单记录",
        Title1: "助力链接",
        Title2: "QQ/WX",
        Title3: "昵称",
        Title4: "订单编号",
        Title5: "助力码"
    });
    var no = (ss.length + 1)
    var tytOrder = {
        Type: customerDataType, // 订单类型
        Data1: url, // 重新拼接好的助力链接
        Data2: CommunicationUserId, // QQ/WX
        Data3: CommunicationUserName, //昵称 
        Data4: no, // 订单编号
        Data5: inviterCode
    }
    // 保存订单数据
    await addCustomData([tytOrder])

    console.log(`
用户：${CommunicationUserId}
昵称：${CommunicationUserName}
订单编号：${no}
扣除积分：${USE_SCORE}
转单消息：${url}
接收人：${targetCommunicationType}`);
    // 将消息发送给转单对象
    await sendNotify(url, false, targetCommunicationUserId, null, targetCommunicationType);

    // 提交成功回执给用户
    await sendNotify("挖宝提交成功，订单编号：" + no + "\r邀请码：" + inviterCode + m);
})();

