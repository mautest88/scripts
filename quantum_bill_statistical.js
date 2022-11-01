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
})().catch((e) => {console.log("脚本异常：" + e);});
