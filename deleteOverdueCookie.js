// 删除过期CK
require('./env.js');
const {
    sendNotify, getEnvs, deleteEnvByIds, syncEnv
} = require('./quantum');

!(async () => {
    //获取所有的CK 
    var envs = await getEnvs("JD_COOKIE", "pt_key", 2, null);
    envs = envs.filter((n) => !n.Enable);
    console.log(`过期CK共${envs.length}个。`);
    if (envs.length == 0) {
        console.log("没有过期的CK.");
        return;
    }
    //待删除的变量id
    var ids = [];
    //待通知的用户
    var userIds = [];
    for (var i = 0; i < envs.length; i++) {
        var env = envs[i];
        ids.push(env.Id);
        var cookie = env.Value;
        var pt_pin = cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
        pt_pin = (cookie.match(/pt_pin=([^; ]+)(?=;?)/) && pt_pin)
        if (env.UserId) {
            var h = false;
            for (var x = 0; x < userIds.length; x++) {
                if (userIds[x].UserId == env.UserId) {
                    userIds[x].CKs.push(env.UserRemark || pt_pin)
                    h = true;
                    break;
                }
            }
            if (!h) {
                userIds.push({
                    UserId: env.UserId,
                    CKs: [env.UserRemark || pt_pin]
                })
            }
        }
    }
    var body1 = await deleteEnvByIds(ids);
    console.log("删除过期CK结果：" + JSON.stringify(body1));
    var body2 = await syncEnv();
    console.log("单项CK同步结果：" + JSON.stringify(body2));
    sendNotify(`删除过期CK${envs.length}个。`, true);
    console.log("开始给韭菜发通知了。");
    for (var i = 0; i < userIds.length; i++) {
        console.log(`给杖號：${userIds[i].UserId}发送杖號过期通知。`);
        var message = "您的杖號过期了";
        for (var x = 0; x < userIds[i].CKs.length; x++) {
            message += "\r\n" + userIds[i].CKs[x];
        }
        await sendNotify(message, false, userIds[i].UserId);
    }
    console.log(`一共给${userIds.length}个韭菜发送了CK 过期通知。`);
})().catch((e) => {
    console.log(e);
});