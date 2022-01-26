/*
 * 给用户推送过期账号提醒
 * 可配置环境变量名称：DELETE_LOG_DAY  (删除指定多少天以前的日志，默认3天)
 */

require('./env.js');
const got = require('got');

const moment = require('moment');


let prefixUrl = process.env.serverAddres || 'http://localhost:5088';


const {
    sendNotify, allEnvs
} = require('./quantum');



const api = got.extend({
    prefixUrl: prefixUrl,
    retry: { limit: 0 },
});

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
})();


