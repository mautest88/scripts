/*
 * 给用户推送过期账号提醒
 * 可配置环境变量名称：OVERDUE_NOTIFY_MSG  (过期提醒文字)
 */

require('./env.js');
const got = require('got');
const {
    sendNotify, allEnvs
} = require('./quantum');

var message = process.env.OVERDUE_NOTIFY_MSG || "您的以下京东账号已经过期，已经无法自动领取京豆等任务。";

!(async () => {
    var envs = await allEnvs("JD_COOKIE", 2, false, "", process.env.user_id);
    console.log("获取过期环境变量" + envs.length + "个");
    var ts = [];
    for (var i = 0; i < envs.length; i++) {
        ts.push(envs[i].UserRemark);
    }
    console.log(ts)
    await sendNotify(message + "\n" + ts.join(","));
})();


