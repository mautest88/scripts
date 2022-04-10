// 个人账单

const {
    sendNotify, addCustomData, addOrUpdateCustomDataTitle, getCustomData
} = require('./quantum');

const moment = require('moment');

let command = process.env.command;

let CommunicationUserId = process.env.CommunicationUserId;
let CommunicationUserName = process.env.CommunicationUserName;
let ChargeAccount = process.env.ChargeAccount;
let customeDataType = "quantum_bill";

!(async () => {
    var startTime;
    var endTime = moment().format("yyyy-MM-DD HH:mm:ss");
    if (command.indexOf("今日") > -1 || command.indexOf("本日") > -1) {
        startTime = moment().format("yyyy-MM-DD 00:00:00");
    } else if (command == "本周账单") {
        var wk1 = moment().weekday(1);
        if (wk1 > moment()) {
            wk1 = wk1.subtract(1, "weeks");
        }
        startTime = wk1.format('YYYY-MM-DD 00:00:00');
    }
    else if (command.indexOf("当月") > -1 || command.indexOf("本月") > -1) {
        startTime = moment().format("yyyy-MM-01 00:00:00");
    } else if (command.indexOf("上月") > -1) {
        startTime = moment(new Date()).subtract(1, 'months').format('YYYY-MM-01 00:00:00');
        endTime = moment().format('YYYY-MM-01 00:00:00');
    }
    else if (command.indexOf("当年") > -1 || command.indexOf("今年") > -1 || command.indexOf("本年") > -1) {
        startTime = moment().format("yyyy-01-01 00:00:00");
    } else if (command.indexOf("全部")) {
        startTime = "2020-01-01";
    }
    console.log(`查询开始时间：${startTime}，结束时间：${endTime}`);

    var ss = await getCustomData(customeDataType, startTime, endTime, { Data3: CommunicationUserId });


    var zc = 0;
    var sr = 0;
    var ss = await getCustomData(customeDataType, startTime, endTime, { Data3: CommunicationUserId });
    for (var i = 0; i < ss.length; i++) {
        if (ss[i].Data5 == "支出") {
            zc += parseFloat(ss[i].Data2);
        } else {
            sr += parseFloat(ss[i].Data2);
        }
    }
    await sendNotify(command + "\n" + "\n收入：" + sr + "\n支出：" + zc);

    //var ttt = ChargeAccount.split(" ")
    //if (!ChargeAccount || ttt.length != 3) {
    //    await sendNotify("记账功能指令格式\n“支出 买衣服 300”或“收入 捡到钱了 200”");
    //    return;
    //}
    //var money = parseFloat(ttt[2]);
    //if (money <= 0) {
    //    await sendNotify("记账金额不能为0！");
    //    return;
    //}
    //var titleInfo = {
    //    Type: customeDataType,
    //    TypeName: "记账本",
    //    Title1: "事项",
    //    Title2: "金额",
    //    Title3: "QQ/微信",
    //    Title4: "昵称",
    //    Title5: "类型"
    //}
    //var stamp1 = new Date(new Date().setHours(0, 0, 0, 0))
    //var startTime = moment(stamp1).format("YYYY-MM-DD HH:mm:ss")
    //var endTime = moment().format("YYYY-MM-DD HH:mm:ss");
    //await addOrUpdateCustomDataTitle(titleInfo)
    //var info = {
    //    Type: "quantum_bill",
    //    Data1: ttt[1],
    //    Data2: money,
    //    Data3: CommunicationUserId,
    //    Data4: CommunicationUserName,
    //    Data5: ttt[0].indexOf("支出") > -1 ? "支出" : "收入"
    //}

    //var zc = 0;
    //var sr = 0;
    //var ss = await getCustomData(customeDataType, startTime, endTime, { Data3: CommunicationUserId });
    //for (var i = 0; i < ss.length; i++) {
    //    if (ss[i].Data5 == "支出") {
    //        zc += parseFloat(ss[i].Data2);
    //    } else {
    //        sr += parseFloat(ss[i].Data2);
    //    }
    //}
    //if (ttt[0].indexOf("支出") > -1) {
    //    zc += money;
    //} else {
    //    sr += money;
    //}
    //await addCustomData([info]);
    // await sendNotify("记账成功！\n" + ChargeAccount + "\n今日统计，收入：" + sr + "，支出：" + zc);
})();
