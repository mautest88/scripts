/*
 * 定时删除量子日志
 * 
 * 支持环境变量：DELETE_LOG_DAY 指定删除 多少天前的CK ，不指定默认3天。
 * 
 */

const {
    api
} = require('./quantum');

const moment = require('moment');

var day = process.env.DELETE_LOG_DAY || 3;
try {
    day = parseInt(day);
}
catch {
    day = 3;
}
!(async () => {
    var start = "2022-01-01 1:00:00"
    var end = moment().add(-day, 'day').format('YYYY-MM-DD HH:00:00')
    const body = await api({
        url: 'api/Logs',
        method: 'get',
        searchParams: {
            PageIndex: 1,
            PageSize: 999999,
            StartTime: start,
            EndTime: end
        },
        headers: {
            "Content-Type": "application/json"
        }
    }).json();
    var logs = body.Data.Data;
    console.log("获取日志" + logs.length + "条");
    var logIds = []
    for (var i = 0; i < logs.length; i++) {
        logIds.push(logs[i].Id);
    }
    if (logs.length > 0) {
        const body = await api({
            url: 'api/logs',
            body: JSON.stringify(logIds),
            method: 'delete',
            headers: {
                "Content-Type": "application/json"
            }
        }).json();
        console.log("删除日志返回结果：" + JSON.stringify(body));
    }
})().catch((e) => {console.log("脚本异常：" + e);});