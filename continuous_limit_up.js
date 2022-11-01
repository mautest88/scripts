/**
 * 连扳天梯
 * */

const got = require('got');
const {
    sendNotify
} = require('./quantum');

const moment = require('moment');

const api = got.extend({
    retry: { limit: 0 },
});

//触发指令
var command = process.env.command;

!(async () => {
    var pattern = /[0-9]{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/
    var date = "";
    if (pattern.test(command)) {
        date = command.match(/[0-9]{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/)[0]
    } else {
        date = moment().format("YYYYMMDD");
        //let d = new Date()
        //var m = (d.getMonth() + 1);
        //var day = d.getDate();
        //date = d.getFullYear().toString() + (m > 9 ? m.toString() : "0" + m) + (day > 9 ? day.toString() : "0" + day)
    }
    console.log(date)
    if (moment(date, 'YYYYMMDD') > moment()) {
        await sendNotify("无法预知未来！");
        return;
    }
    var week = moment(date, 'YYYYMMDD').weekday();
    console.log(week);
    if (week == 6) {
        await sendNotify("周六休市！")
        return;
    }
    if (week == 0) {
        await sendNotify("周日休市！")
        return;
    }

    var config = {
        method: 'get',
        url: 'https://data.10jqka.com.cn/dataapi/limit_up/continuous_limit_up?filter=HS,GEM2STAR&date=' + date
    };

    await api(config).then(async response => {
        console.log(response.body)
        var body = JSON.parse(response.body)
        if (body.status_code == 0) {
            if (body.data && body.data.length > 0) {
                var message = "";
                for (var i = 0; i < body.data.length; i++) {
                    message += `高度：${body.data[i].height}
`
                    for (var x = 0; x < body.data[i].code_list.length; x++) {
                        message += `${body.data[i].code_list[x].code} ${body.data[i].code_list[x].name}，`
                    }
                    message = message.trim("，") + "\r";
                }
                await sendNotify("连板天梯" + "\n" + "当前查询日期：" + date + "\n" + message);
            } else {
                await sendNotify("接口未返回数据。")
            }
        } else {
            console.log(response.body);
        }
    });
})().catch((e) => {console.log("脚本异常：" + e);});