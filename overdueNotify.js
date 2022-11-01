/*
 * 
 * 给用户推送过期账号提醒
 * 可配置环境变量名称：OVERDUE_NOTIFY_MSG  (过期提醒文字)
 * 
 */

const {
    sendNotify, allEnvs,sleep
} = require('./quantum');

var message = process.env.OVERDUE_NOTIFY_MSG || "您的以下京东账号已经过期，请重更新提交CK：";

!(async () => {
    var envs = await allEnvs("JD_COOKIE", 2, false, "");
    console.log("获取过期环境变量" + envs.length + "个");
    var ts = [];
    for (var i = 0; i < envs.length; i++) {
        if (ts.length > 0 && ts.filter((t) => t.UserId === envs[i].UserId).length > 0) {
            ts.filter((t) => t.UserId === envs[i].UserId)[0].List.push(envs[i].UserRemark)
        } else {
            ts.push({
                UserId: envs[i].UserId,
                List: [envs[i].UserRemark]
            });
        }
    }
    if (ts.length > 0) {
        for (var i = 0; i < ts.length; i++) {
            await sleep(5000);
            await sendNotify(message + "\n" + ts[i].List.join(","), false, ts[i].UserId);
        }
    }
})().catch((e) => {console.log("脚本异常：" + e);});